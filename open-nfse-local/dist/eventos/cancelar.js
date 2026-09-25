import { RuleViolationError } from '../errors/validation.js';
import { emitDpsProntaSeguro } from '../nfse/emit.js';
import { JustificativaCancelamento, JustificativaSubstituicao, } from '../nfse/enums.js';
import { MissingRetryStoreError, pendingEventId, } from '../retry/store.js';
import { defaultIsTransient } from '../retry/transient.js';
import { buildCancelamentoXml } from './build-event-xml.js';
import { postEvento } from './post-evento.js';
import { signPedRegEventoXml } from './sign-event.js';
export async function cancelar(httpClient, certificate, retryPolicy, params) {
    // Evento 101101: e101101/xMotivo é obrigatório (1-1); cMotivo=9 (Outros) sem
    // descrição é o caso mais comum de omissão. (E0078 é regra da DPS/subst, não
    // deste evento — o campo aqui é evento/.../e101101/xMotivo.)
    if (params.cMotivo === JustificativaCancelamento.Outros && !params.xMotivo?.trim()) {
        throw new RuleViolationError('cMotivo=9 (Outros) exige xMotivo não-vazio (evento 101101)', 'e101101/xMotivo');
    }
    // TSMotivo (tiposSimples_v1.01.xsd:355) — minLength 15, maxLength 255.
    // xMotivo é required em CancelarParams, então sempre checa.
    validarTSMotivo(params.xMotivo);
    const isTransient = params.isTransient ?? defaultIsTransient;
    const xmlPedido = buildCancelamentoXml(params);
    // Sign up-front so that, if the POST fails transiently, the persisted
    // entry carries genuinely signed XML — `replayPendingEvents` re-POSTs
    // with `xmlJaAssinado: true`, so unsigned XML in the store would be
    // rejected by SEFIN's signature check on every retry.
    const xmlAssinado = signPedRegEventoXml(xmlPedido, certificate);
    try {
        const r = await postEvento(httpClient, certificate, params.chaveAcesso, xmlAssinado, {
            xmlJaAssinado: true,
        });
        return { status: 'ok', evento: dropInternal(r) };
    }
    catch (err) {
        const error = toError(err);
        if (!isTransient(error)) {
            throw error; // regra fiscal — caller loga e segue
        }
        const now = new Date();
        const notBefore = retryPolicy.computeNotBefore(error, now, {
            attempt: 1,
            firstAttemptAt: now,
        });
        const pending = buildPendingEvent({
            kind: 'cancelamento_simples',
            chaveNfse: params.chaveAcesso,
            tipoEvento: '101101',
            cMotivo: params.cMotivo,
            xMotivo: params.xMotivo,
            xmlAssinado,
            error,
            transient: true,
            now,
            ...(notBefore ? { notBefore } : {}),
        });
        await savePending(params.retryStore, pending);
        return { status: 'retry_pending', pending, error };
    }
}
export async function substituir(httpClient, certificate, retryPolicy, params) {
    // Rule E0078 — cMotivo=99 exige xMotivo populado. Pré-check local para evitar
    // round-trip + queima de nDPS num emit que seria rejeitado.
    if (params.cMotivo === JustificativaSubstituicao.Outros && !params.xMotivo?.trim()) {
        throw new RuleViolationError('cMotivo=99 (Outros) exige xMotivo não-vazio', 'E0078');
    }
    // TSMotivo — 15 a 255 chars quando presente (xMotivo é opcional em subst).
    if (params.xMotivo !== undefined) {
        validarTSMotivo(params.xMotivo);
    }
    // Auto-preenche infDPS.subst (chSubstda = chave original) se ausente.
    const dpsComSubst = ensureSubstPopulated(params.novaDps, params.chaveOriginal, params.cMotivo, params.xMotivo);
    // Único write do contribuinte: a DPS com <subst> via POST /nfse. O Sistema
    // Nacional NFS-e gera, de forma atômica com a emissão, o evento 105102
    // (autor=MEmis) que cancela a NFS-e original, e retorna a substituta. O
    // contribuinte NÃO registra um pedRegEvento 105102 — ver doc do método.
    // Transiente → retry_pending (persistido). Permanente → throw.
    const emitOptions = {
        ...(params.skipValidation !== undefined ? { skipValidation: params.skipValidation } : {}),
        ...(params.skipCepValidation !== undefined
            ? { skipCepValidation: params.skipCepValidation }
            : {}),
        ...(params.skipCpfCnpjValidation !== undefined
            ? { skipCpfCnpjValidation: params.skipCpfCnpjValidation }
            : {}),
        ...(params.cepValidator ? { cepValidator: params.cepValidator } : {}),
    };
    const r = await emitDpsProntaSeguro(httpClient, certificate, dpsComSubst, {
        retryStore: params.retryStore,
        retryPolicy,
        ...(params.isTransient ? { isTransient: params.isTransient } : {}),
    }, emitOptions);
    return r.status === 'ok'
        ? { status: 'ok', novaNfse: r.nfse }
        : { status: 'retry_pending', pending: r.pending, error: r.error };
}
// -----------------------------------------------------------------------------
// helpers
// -----------------------------------------------------------------------------
function ensureSubstPopulated(dps, chaveOriginal, cMotivo, xMotivo) {
    if (dps.infDPS.subst)
        return dps;
    return {
        ...dps,
        infDPS: {
            ...dps.infDPS,
            subst: {
                chSubstda: chaveOriginal,
                cMotivo,
                ...(xMotivo ? { xMotivo } : {}),
            },
        },
    };
}
function dropInternal(r) {
    const { xmlAssinado: _drop, ...rest } = r;
    void _drop;
    return rest;
}
function toError(err) {
    return err instanceof Error ? err : new Error(String(err));
}
function buildPendingEvent(input) {
    return {
        id: pendingEventId(input.chaveNfse, input.tipoEvento, input.kind),
        kind: input.kind,
        chaveNfse: input.chaveNfse,
        ...(input.chaveSubstituta ? { chaveSubstituta: input.chaveSubstituta } : {}),
        tipoEvento: input.tipoEvento,
        cMotivo: input.cMotivo,
        ...(input.xMotivo ? { xMotivo: input.xMotivo } : {}),
        xmlAssinado: input.xmlAssinado,
        firstAttemptAt: input.now,
        lastAttemptAt: input.now,
        attempts: input.attempts ?? 1,
        ...(input.notBefore ? { notBefore: input.notBefore } : {}),
        lastError: {
            message: input.error.message,
            errorName: input.error.name,
            transient: input.transient,
        },
    };
}
async function savePending(store, pending) {
    if (!store)
        throw new MissingRetryStoreError();
    await store.save(pending);
}
/**
 * Valida que a string bate com `TSMotivo` (tiposSimples_v1.01.xsd:355):
 * minLength 15, maxLength 255. Lança `RuleViolationError` com rule `TSMotivo`
 * — evita round-trip + rejeição server-side de payload curto.
 */
function validarTSMotivo(xMotivo) {
    const len = xMotivo.length;
    if (len < 15 || len > 255) {
        throw new RuleViolationError(`xMotivo deve ter entre 15 e 255 caracteres (atual: ${len}) — per TSMotivo do RTC v1.01`, 'TSMotivo');
    }
}
//# sourceMappingURL=cancelar.js.map