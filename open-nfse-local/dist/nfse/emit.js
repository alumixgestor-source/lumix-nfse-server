import { TipoAmbiente } from '../ambiente.js';
import { ReceitaRejectionError, receitaRejectionFromPostError, } from '../errors/receita.js';
import { validateCnpj, validateCpf } from '../fiscal/validate-cpf-cnpj.js';
import { gzipBase64DecodeToText, gzipBase64Encode } from '../http/encoding.js';
import { MissingRetryStoreError, pendingEmissionId, } from '../retry/store.js';
import { defaultIsTransient } from '../retry/transient.js';
import { buildDps } from './build-dps.js';
import { buildDpsXml } from './build-xml.js';
import { collectCepsFromDps, collectIdentifiersFromDps } from './collect-from-dps.js';
import { MissingDpsCounterError } from './dps-counter.js';
import { parseNfseXml } from './parse-xml.js';
import { signDpsXml } from './sign-xml.js';
import { validateDpsXml } from './validate-xml.js';
export async function emitDpsPronta(httpClient, certificate, dps, options) {
    // Pré-validações, em ordem de custo crescente: primeiro as sync baratas
    // (CPF/CNPJ DV), depois as locais pesadas (XSD contra a RTC v1.01), por
    // último o lookup externo de CEP — que pode bater em viacep.com.br.
    if (!options?.skipCpfCnpjValidation) {
        runIdentifierValidation(dps);
    }
    const xmlUnsigned = buildDpsXml(dps);
    if (!options?.skipValidation) {
        await validateDpsXml(xmlUnsigned);
    }
    if (!options?.skipCepValidation) {
        await runCepValidation(dps, options?.cepValidator);
    }
    const xmlSigned = signDpsXml(xmlUnsigned, certificate);
    const dpsXmlGZipB64 = gzipBase64Encode(xmlSigned);
    if (options?.dryRun) {
        return { dryRun: true, xmlDpsAssinado: xmlSigned, xmlDpsGZipB64: dpsXmlGZipB64 };
    }
    const body = await httpClient.post('/nfse', { dpsXmlGZipB64 }, { acceptedStatuses: [400] });
    return parsePostResponseOrThrow(body);
}
/**
 * Como `emitDpsPronta`, mas com resiliência a transientes: em vez de lançar
 * num erro transiente (rede/timeout/5xx/429), persiste uma `PendingEmission`
 * no `retryStore` e retorna `retry_pending` (replay via `replayPendingEvents`).
 * Rejeição permanente continua lançando. É o caminho usado por `substituir`
 * (a DPS já vem pronta, com `nDPS` explícito — não há counter envolvido).
 */
export async function emitDpsProntaSeguro(httpClient, certificate, dps, deps, options) {
    const isTransient = deps.isTransient ?? defaultIsTransient;
    if (!options?.skipCpfCnpjValidation) {
        runIdentifierValidation(dps);
    }
    const xmlUnsigned = buildDpsXml(dps);
    if (!options?.skipValidation) {
        await validateDpsXml(xmlUnsigned);
    }
    if (!options?.skipCepValidation) {
        await runCepValidation(dps, options?.cepValidator);
    }
    const xmlSigned = signDpsXml(xmlUnsigned, certificate);
    const dpsXmlGZipB64 = gzipBase64Encode(xmlSigned);
    try {
        const body = await httpClient.post('/nfse', { dpsXmlGZipB64 }, { acceptedStatuses: [400] });
        return { status: 'ok', nfse: parsePostResponseOrThrow(body) };
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isTransient(error)) {
            if (!deps.retryStore)
                throw new MissingRetryStoreError();
            const now = new Date();
            const notBefore = deps.retryPolicy.computeNotBefore(error, now, {
                attempt: 1,
                firstAttemptAt: now,
            });
            const ident = dps.infDPS.prest.identificador;
            const pending = {
                id: pendingEmissionId(dps.infDPS.Id),
                kind: 'emission',
                idDps: dps.infDPS.Id,
                emitenteCnpj: 'CNPJ' in ident ? ident.CNPJ : '',
                serie: dps.infDPS.serie,
                nDPS: dps.infDPS.nDPS,
                xmlAssinado: xmlSigned,
                firstAttemptAt: now,
                lastAttemptAt: now,
                attempts: 1,
                ...(notBefore ? { notBefore } : {}),
                lastError: {
                    message: error.message,
                    errorName: error.name,
                    transient: true,
                },
            };
            await deps.retryStore.save(pending);
            return { status: 'retry_pending', pending, error };
        }
        throw error;
    }
}
function isSuccessBody(body) {
    return (typeof body.chaveAcesso === 'string' &&
        typeof body.nfseXmlGZipB64 === 'string');
}
/**
 * Interpreta a resposta do `POST /nfse`: corpo de sucesso → `NfseEmitResult`;
 * 400 com corpo de rejeição → lança `ReceitaRejectionError` (regra de negócio).
 * Corpo de erro irreconhecível cai num `ReceitaRejectionError('UNKNOWN')` com o
 * JSON bruto. Único ponto de verdade — `emitDpsPronta`, `emitSeguro` e
 * `replayEmission` compartilham este parsing (antes era copy-paste divergente).
 */
function parsePostResponseOrThrow(body) {
    if (isSuccessBody(body))
        return toEmitResult(body);
    const rejection = receitaRejectionFromPostError(body);
    if (rejection)
        throw rejection;
    throw new ReceitaRejectionError({
        mensagens: [
            {
                codigo: 'UNKNOWN',
                descricao: `Corpo de erro sem mensagens reconhecíveis: ${JSON.stringify(body)}`,
            },
        ],
    });
}
function toEmitResult(body) {
    const xmlNfse = gzipBase64DecodeToText(body.nfseXmlGZipB64);
    return {
        chaveAcesso: body.chaveAcesso,
        idDps: body.idDps,
        xmlNfse,
        nfse: parseNfseXml(xmlNfse),
        alertas: (body.alertas ?? []).flatMap(normalizeAlerta),
        tipoAmbiente: body.tipoAmbiente === 1 ? TipoAmbiente.Producao : TipoAmbiente.Homologacao,
        versaoAplicativo: body.versaoAplicativo,
        dataHoraProcessamento: new Date(body.dataHoraProcessamento),
    };
}
const DEFAULT_CONCURRENCY = 4;
export async function emitMany(httpClient, certificate, dpsList, options) {
    const concurrency = Math.max(1, Math.floor(options?.concurrency ?? DEFAULT_CONCURRENCY));
    const stopOnError = options?.stopOnError ?? false;
    const perEmitOptions = {
        dryRun: false,
        ...(options?.skipValidation !== undefined ? { skipValidation: options.skipValidation } : {}),
        ...(options?.skipCepValidation !== undefined
            ? { skipCepValidation: options.skipCepValidation }
            : {}),
        ...(options?.skipCpfCnpjValidation !== undefined
            ? { skipCpfCnpjValidation: options.skipCpfCnpjValidation }
            : {}),
        ...(options?.cepValidator !== undefined ? { cepValidator: options.cepValidator } : {}),
    };
    const items = new Array(dpsList.length);
    let nextIndex = 0;
    let aborted = false;
    async function worker() {
        while (true) {
            if (aborted)
                return;
            const i = nextIndex++;
            if (i >= dpsList.length)
                return;
            const dps = dpsList[i];
            try {
                const result = await emitDpsPronta(httpClient, certificate, dps, perEmitOptions);
                items[i] = { status: 'success', dps, result };
            }
            catch (cause) {
                const error = cause instanceof Error ? cause : new Error(String(cause));
                items[i] = { status: 'failure', dps, error };
                if (stopOnError)
                    aborted = true;
            }
        }
    }
    const workerCount = Math.min(concurrency, dpsList.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    for (let i = 0; i < dpsList.length; i++) {
        if (!items[i])
            items[i] = { status: 'skipped', dps: dpsList[i] };
    }
    let successCount = 0;
    let failureCount = 0;
    let skippedCount = 0;
    for (const item of items) {
        if (item.status === 'success')
            successCount++;
        else if (item.status === 'failure')
            failureCount++;
        else
            skippedCount++;
    }
    return { items, successCount, failureCount, skippedCount };
}
function runIdentifierValidation(dps) {
    for (const { type, value } of collectIdentifiersFromDps(dps)) {
        if (type === 'CNPJ')
            validateCnpj(value);
        else
            validateCpf(value);
    }
}
let _defaultCepValidator;
async function runCepValidation(dps, override) {
    const ceps = collectCepsFromDps(dps);
    if (ceps.length === 0)
        return;
    const validator = override ?? (await getDefaultCepValidator());
    // sequencial — o cache interno no validator garante que CEPs repetidos
    // custam O(1). Paralelizar aqui pode violar rate-limit do ViaCEP em lote.
    for (const { cep } of ceps) {
        await validator.validate(cep);
    }
}
async function getDefaultCepValidator() {
    if (!_defaultCepValidator) {
        const { createViaCepValidator } = await import('../cep/viacep.js');
        _defaultCepValidator = createViaCepValidator();
    }
    return _defaultCepValidator;
}
export async function emitSeguro(deps, params) {
    const isTransient = deps.isTransient ?? defaultIsTransient;
    // 1. Monta DPS com nDPS placeholder para validação (XSD não distingue
    //    valor específico — só valida contra pattern [1-9][0-9]{0,14}).
    const placeholderOrExplicit = params.nDPS ?? '1';
    const dpsParaValidar = buildDps({ ...params, nDPS: placeholderOrExplicit });
    // 2. Validações offline. Ordem: CPF/CNPJ (sync) → XSD (WASM) → CEP (HTTP).
    if (!params.skipCpfCnpjValidation) {
        runIdentifierValidation(dpsParaValidar);
    }
    const xmlPlaceholder = buildDpsXml(dpsParaValidar);
    if (!params.skipValidation) {
        await validateDpsXml(xmlPlaceholder);
    }
    if (!params.skipCepValidation) {
        await runCepValidation(dpsParaValidar, params.cepValidator);
    }
    // 3. Dry-run: use o placeholder (ou o nDPS explícito) — não consome counter.
    if (params.dryRun) {
        const xmlSigned = signDpsXml(xmlPlaceholder, deps.certificate);
        const xmlDpsGZipB64 = gzipBase64Encode(xmlSigned);
        return { dryRun: true, xmlDpsAssinado: xmlSigned, xmlDpsGZipB64 };
    }
    // 4. Obtém o nDPS real — override explícito ou counter.
    let nDpsReal;
    if (params.nDPS !== undefined) {
        nDpsReal = params.nDPS;
    }
    else {
        if (!deps.dpsCounter)
            throw new MissingDpsCounterError();
        nDpsReal = await deps.dpsCounter.next({
            emitenteCnpj: params.emitente.cnpj,
            serie: params.serie,
        });
    }
    // 5. Rebuild com nDPS real + sign. Não re-valido XSD — estrutura é
    //    idêntica, só o valor numérico mudou (e já sabemos que bate no pattern).
    const dpsReal = buildDps({ ...params, nDPS: nDpsReal });
    const xmlUnsigned = buildDpsXml(dpsReal);
    const xmlSigned = signDpsXml(xmlUnsigned, deps.certificate);
    const dpsXmlGZipB64 = gzipBase64Encode(xmlSigned);
    // 6. POST. Transiente → retryStore. Permanente → throw.
    try {
        const body = await deps.httpClient.post('/nfse', { dpsXmlGZipB64 }, { acceptedStatuses: [400] });
        // Sucesso → ok; 400 com corpo de rejeição → throw permanente.
        return { status: 'ok', nfse: parsePostResponseOrThrow(body) };
    }
    catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        if (isTransient(error)) {
            if (!deps.retryStore)
                throw new MissingRetryStoreError();
            const now = new Date();
            const notBefore = deps.retryPolicy.computeNotBefore(error, now, {
                attempt: 1,
                firstAttemptAt: now,
            });
            const pending = {
                id: pendingEmissionId(dpsReal.infDPS.Id),
                kind: 'emission',
                idDps: dpsReal.infDPS.Id,
                emitenteCnpj: params.emitente.cnpj,
                serie: params.serie,
                nDPS: nDpsReal,
                xmlAssinado: xmlSigned,
                firstAttemptAt: now,
                lastAttemptAt: now,
                attempts: 1,
                ...(notBefore ? { notBefore } : {}),
                lastError: {
                    message: error.message,
                    errorName: error.name,
                    transient: true,
                },
            };
            await deps.retryStore.save(pending);
            return { status: 'retry_pending', pending, error };
        }
        throw error;
    }
}
/**
 * Replay de uma emissão pendente — re-POSTa o XML assinado diretamente em
 * `/nfse`. SEFIN deduplica via `infDPS.Id`, então retentar é idempotente.
 */
export async function replayEmission(httpClient, xmlSignedDps) {
    const dpsXmlGZipB64 = gzipBase64Encode(xmlSignedDps);
    const body = await httpClient.post('/nfse', { dpsXmlGZipB64 }, { acceptedStatuses: [400] });
    return parsePostResponseOrThrow(body);
}
function pickStr(obj, ...keys) {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.length > 0)
            return v;
    }
    return undefined;
}
function normalizeAlerta(raw) {
    const r = raw;
    const codigo = pickStr(r, 'codigo', 'Codigo');
    const descricao = pickStr(r, 'descricao', 'Descricao');
    if (!codigo && !descricao)
        return [];
    const complemento = pickStr(r, 'complemento', 'Complemento');
    return [
        {
            codigo: codigo ?? 'UNKNOWN',
            descricao: descricao ?? '(sem descrição)',
            ...(complemento ? { complemento } : {}),
        },
    ];
}
//# sourceMappingURL=emit.js.map