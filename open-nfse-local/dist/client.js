import { Agent } from 'undici';
import { AMBIENTE_ENDPOINTS } from './ambiente.js';
import { normalizeProvider } from './certificate/provider.js';
import { consultarDanfse as consultarDanfseInternal } from './danfse/fetch.js';
import { gerarDanfse as gerarDanfseLocal } from './danfse/gerar.js';
import { fetchByNsu as fetchByNsuInternal } from './dfe/fetch-by-nsu.js';
import { OpenNfseError } from './errors/base.js';
import { NetworkError, ServerError, TimeoutError } from './errors/http.js';
import { cancelar as cancelarInternal, substituir as substituirInternal, } from './eventos/cancelar.js';
import { postEvento } from './eventos/post-evento.js';
import { signPedRegEventoXml } from './eventos/sign-event.js';
import { HttpClient } from './http/client.js';
import { noopLogger } from './logging.js';
import { emitDpsPronta as emitDpsProntaInternal, emitMany as emitManyInternal, emitSeguro, replayEmission, } from './nfse/emit.js';
import { fetchByChave as fetchByChaveInternal } from './nfse/fetch-by-chave.js';
import { existsDpsStatus as existsDpsStatusInternal, fetchDpsStatus as fetchDpsStatusInternal, } from './nfse/fetch-dps-status.js';
import { createInMemoryParametrosCache, } from './parametros-municipais/cache.js';
import { fetchAliquota, fetchBeneficio, fetchConvenio, fetchHistoricoAliquotas, fetchRegimesEspeciais, fetchRetencoes, } from './parametros-municipais/fetch.js';
import { createDefaultRetryPolicy, makeSafePolicy } from './retry/policy.js';
import { isPendingEmission } from './retry/store.js';
import { defaultIsTransient } from './retry/transient.js';
function dropInternal(r) {
    const { xmlAssinado: _drop, ...rest } = r;
    void _drop;
    return rest;
}
function isRetryableError(err) {
    return defaultIsTransient(err);
}
/**
 * Detecta se um XML de evento já foi assinado. Usado em
 * `replayPendingEvents` para resgatar entradas legadas — a v0.7.2/v0.7.3
 * persistia eventos sem assinatura no caminho transiente (bug corrigido
 * em 0.8.0); detectamos e re-assinamos antes do POST para não perder a
 * operação.
 *
 * A detecção checa **três marcadores XMLDSig independentes** para
 * minimizar falso-positivos em dados controlados pelo usuário (xMotivo,
 * por exemplo). Falso-positivo aqui significa "POSTar XML não-assinado
 * achando que está assinado" → SEFIN rejeita → entrada deletada → perda
 * da operação. Vale ser conservador.
 */
function isEventoXmlSigned(xml) {
    if (typeof xml !== 'string' || xml.length === 0)
        return false;
    return (xml.includes('http://www.w3.org/2000/09/xmldsig#') &&
        xml.includes('<SignatureValue>') &&
        xml.includes('<X509Certificate>'));
}
export class NfseClient {
    ambiente;
    provider;
    timeoutMs;
    logger;
    dispatcherOverride;
    cepValidator;
    retryStore;
    dpsCounter;
    parametrosCache;
    retryPolicy;
    state = null;
    statePromise = null;
    closed = false;
    constructor(config) {
        this.ambiente = config.ambiente;
        this.provider = normalizeProvider(config.certificado);
        this.timeoutMs = config.timeoutMs ?? 60_000;
        this.logger = config.logger ?? noopLogger;
        this.dispatcherOverride = config.dispatcher;
        this.cepValidator = config.cepValidator;
        this.retryStore = config.retryStore;
        this.dpsCounter = config.dpsCounter;
        this.parametrosCache = config.parametrosCache ?? createInMemoryParametrosCache();
        // Wrap defensively so a buggy custom policy can't mask the original
        // fiscal error in catch paths. See makeSafePolicy + RetryPolicy contract.
        this.retryPolicy = makeSafePolicy(config.retryPolicy ?? createDefaultRetryPolicy(), this.logger);
    }
    async fetchByChave(chaveAcesso) {
        const state = await this.ensureState();
        return fetchByChaveInternal(state.sefin, chaveAcesso);
    }
    /**
     * `GET /dps/{id}` — consulta a chave de acesso da NFS-e a partir de um
     * `infDPS.Id`. Uso primário: **reconciliação pós-timeout**. Quando um
     * `emitir()` não retornou (processo morreu, timeout, crash), mas você tem o
     * `idDps` persistido, essa chamada revela se a Receita chegou a gerar a
     * NFS-e — evita reemissão duplicada.
     *
     * Lança `NotFoundError` se nenhuma NFS-e foi gerada a partir desse idDps
     * (resposta 404 do SEFIN).
     */
    async fetchDpsStatus(idDps) {
        const state = await this.ensureState();
        return fetchDpsStatusInternal(state.sefin, idDps);
    }
    /**
     * `HEAD /dps/{id}` — variante barata de `fetchDpsStatus` que só retorna
     * `true`/`false` sem baixar o corpo. Para reconciliação em lote, prefere
     * esse método e busque os detalhes via `fetchDpsStatus` só nos que existem.
     */
    async existsDpsStatus(idDps) {
        const state = await this.ensureState();
        return existsDpsStatusInternal(state.sefin, idDps);
    }
    async fetchByNsu(params) {
        const state = await this.ensureState();
        const { ultimoNsu, ...options } = params;
        return fetchByNsuInternal(state.adn, ultimoNsu, options);
    }
    async emitir(params) {
        const state = await this.ensureState();
        const cepValidator = params.cepValidator ?? this.cepValidator;
        const mergedParams = {
            ...params,
            ...(cepValidator ? { cepValidator } : {}),
        };
        const deps = {
            httpClient: state.sefin,
            certificate: state.certificate,
            dpsCounter: this.dpsCounter,
            retryStore: this.retryStore,
            retryPolicy: this.retryPolicy,
        };
        if (mergedParams.dryRun === true) {
            return emitSeguro(deps, { ...mergedParams, dryRun: true });
        }
        return emitSeguro(deps, { ...mergedParams, dryRun: false });
    }
    async emitirDpsPronta(dps, options) {
        const state = await this.ensureState();
        const merged = this.mergeEmitOptions(options);
        if (options?.dryRun === true) {
            return emitDpsProntaInternal(state.sefin, state.certificate, dps, {
                ...merged,
                dryRun: true,
            });
        }
        return emitDpsProntaInternal(state.sefin, state.certificate, dps, {
            ...merged,
            dryRun: false,
        });
    }
    /**
     * Emissão em lote: paraleliza `emitirDpsPronta()` para uma lista de DPS já
     * montadas (SEFIN não oferece endpoint de batch — a paralelização acontece
     * no cliente, com cap de concorrência). Cada item vira um `EmitLoteItem`
     * com `status: 'success' | 'failure' | 'skipped'`.
     *
     * **Não usa `DpsCounter` nem `RetryStore`.** Cada DPS deve vir com `nDPS`
     * já preenchido pelo caller, e falhas (incluindo 429 / 5xx) são reportadas
     * como `{ status: 'failure', dps, error }` sem persistência automática.
     * Se o caller quer retry transparente do pipeline `emitir(params)`, ele
     * deve orquestrar `emitir(...)` calls manualmente. Esta API é deliberadamente
     * mais baixa-nível para casos onde o caller já controla o sequencial.
     *
     * Em 429 a falha é capturada como `failure` com `error instanceof
     * TooManyRequestsError`; o caller pode inspecionar `error.getRetryAfterMs()`
     * para decidir quando re-emitir os itens que falharam (mesmo `nDPS` —
     * SEFIN deduplica via `infDPS.Id`).
     */
    async emitirEmLote(dpsList, options) {
        const state = await this.ensureState();
        const mergedCepValidator = options?.cepValidator ?? this.cepValidator;
        const merged = {
            ...(options?.concurrency !== undefined ? { concurrency: options.concurrency } : {}),
            ...(options?.stopOnError !== undefined ? { stopOnError: options.stopOnError } : {}),
            ...(options?.skipValidation !== undefined ? { skipValidation: options.skipValidation } : {}),
            ...(options?.skipCepValidation !== undefined
                ? { skipCepValidation: options.skipCepValidation }
                : {}),
            ...(options?.skipCpfCnpjValidation !== undefined
                ? { skipCpfCnpjValidation: options.skipCpfCnpjValidation }
                : {}),
            ...(mergedCepValidator !== undefined ? { cepValidator: mergedCepValidator } : {}),
        };
        return emitManyInternal(state.sefin, state.certificate, dpsList, merged);
    }
    mergeEmitOptions(options) {
        const cepValidator = options?.cepValidator ?? this.cepValidator;
        return {
            ...(options?.skipValidation !== undefined ? { skipValidation: options.skipValidation } : {}),
            ...(options?.skipCepValidation !== undefined
                ? { skipCepValidation: options.skipCepValidation }
                : {}),
            ...(options?.skipCpfCnpjValidation !== undefined
                ? { skipCpfCnpjValidation: options.skipCpfCnpjValidation }
                : {}),
            ...(cepValidator !== undefined ? { cepValidator } : {}),
        };
    }
    /**
     * Cancela uma NFS-e via evento 101101. Cancelamento simples — sem vínculo
     * de substituição. Para substituição use `substituir()`.
     *
     * Retorna resultado discriminado:
     * - `{ status: 'ok', evento }` — cancelamento aceito pela Sefin.
     * - `{ status: 'retry_pending', pending }` — falha transiente; persistido
     *   no `RetryStore` configurado para replay via `replayPendingEvents()`.
     *
     * Lança `ReceitaRejectionError` em rejeições permanentes (prazo expirado,
     * nota já cancelada, regra municipal, etc.) — nesses casos o cancelamento
     * definitivamente não pode proceder sem intervenção manual (outro motivo,
     * análise fiscal, etc.).
     */
    async cancelar(params) {
        const state = await this.ensureState();
        const retryStore = params.retryStore ?? this.retryStore;
        const merged = {
            ...params,
            ...(retryStore ? { retryStore } : {}),
        };
        return cancelarInternal(state.sefin, state.certificate, this.retryPolicy, merged);
    }
    /**
     * Substitui uma NFS-e: emite a nova DPS com `infDPS/subst` apontando para a
     * `chaveOriginal` (auto-preenchido se ausente) via `POST /nfse`. O **Sistema
     * Nacional NFS-e** gera, de forma atômica com a emissão, o evento 105102
     * (Cancelamento por Substituição, autor=MEmis) que cancela a original, e
     * retorna a NFS-e substituta em `{ novaNfse }`.
     *
     * O contribuinte **não** registra um pedRegEvento 105102 (autor=MEmis,
     * assinado pelo município emissor); fazê-lo seria redundante (evento único →
     * E0845) e com autor/assinante inválidos (E0813/E2032). Ref.: Manual dos
     * Contribuintes — API Sistema Nacional NFS-e v1.2 §1.3.2.
     *
     * Resultado discriminado (igual a `emitir`): `'ok'` (`novaNfse`) ou
     * `'retry_pending'` — falha transiente no `POST /nfse` persistida no
     * `retryStore` para replay via `replayPendingEvents` (dedup por `infDPS.Id`).
     * Rejeição **permanente** (regra fiscal) lança exceção.
     */
    async substituir(params) {
        const state = await this.ensureState();
        const retryStore = params.retryStore ?? this.retryStore;
        const merged = {
            ...params,
            ...(retryStore ? { retryStore } : {}),
        };
        return substituirInternal(state.sefin, state.certificate, this.retryPolicy, merged);
    }
    /**
     * Re-POSTs each `PendingEvent` in the store. SEFIN deduplication on
     * `infDPS.Id` (emissão) ou `chave + tipoEvento` (eventos)
     * garante idempotência: itens já processados retornam o mesmo resultado
     * ou uma rejeição determinística. Em sucesso, o item é removido do store.
     * Em falha transiente, permanece com `lastAttemptAt`/`notBefore`/`attempts`
     * atualizados. Em falha permanente, também é removido e o erro é
     * retornado no item.
     *
     * **Contrato: single-threaded.** Esta função NÃO é segura para execução
     * concorrente — dois processos chamando-a ao mesmo tempo veriam a mesma
     * lista, retentariam os mesmos itens, e dobrariam o consumo de
     * rate-limit do SEFIN. Garanta exclusão mútua no caller (e.g., um cron
     * single-instance, lock distribuído via Redis se múltiplos workers
     * compartilham o mesmo `RetryStore`).
     *
     * **Cuidado com rotação de certificado.** O XML persistido foi assinado
     * com o certificado A1 vigente no momento da emissão original. Se você
     * rotacionar o certificado (renovação anual, troca de fornecedor) antes
     * que pendentes drenem, a assinatura ainda é tecnicamente válida desde
     * que o certificado antigo não esteja expirado ou revogado. Mas se a
     * janela de validade do antigo passou, SEFIN rejeita a assinatura como
     * permanente → pendente deletado, operação perdida. Drene o RetryStore
     * via `replayPendingEvents` antes de instalar o novo certificado.
     *
     * Consumidores tipicamente chamam isso em um cron a cada 1–5 min.
     */
    async replayPendingEvents(override) {
        const state = await this.ensureState();
        const store = override ?? this.retryStore;
        if (!store)
            return [];
        const pending = await store.list();
        const now = new Date();
        const results = [];
        for (const entry of pending) {
            if (entry.notBefore && entry.notBefore > now) {
                continue; // not yet eligible — skip silently, will reappear next sweep
            }
            try {
                if (isPendingEmission(entry)) {
                    // Re-POST direto em /nfse — SEFIN deduplica via infDPS.Id
                    const r = await replayEmission(state.sefin, entry.xmlAssinado);
                    await store.delete(entry.id);
                    results.push({ id: entry.id, status: 'success_emission', emission: r });
                }
                else {
                    // Evento de cancelamento/substituição — re-POST no endpoint de eventos.
                    // Defensivo: entradas persistidas em 0.7.2/0.7.3 podem ter sido
                    // gravadas com XML não-assinado (bug corrigido em 0.8.0). Detectamos
                    // e re-assinamos para não perder a operação — re-assinar é seguro
                    // porque SEFIN deduplica por (chave + tipoEvento)
                    // independente da assinatura.
                    let xmlToPost = entry.xmlAssinado;
                    if (!isEventoXmlSigned(xmlToPost)) {
                        this.logger.warn('Pending event entry sem XMLDSig — re-assinando antes do replay (provavelmente dado legado de v0.7.x; pré-fix). Considere drenar o RetryStore antes de atualizar para evitar este caminho.', {
                            id: entry.id,
                            chaveNfse: entry.chaveNfse,
                            tipoEvento: entry.tipoEvento,
                        });
                        try {
                            xmlToPost = signPedRegEventoXml(xmlToPost, state.certificate);
                        }
                        catch (signErr) {
                            // Re-sign failed (malformed legacy XML, cert problem, etc.).
                            // Continue with the unsigned bytes — SEFIN will reject as a
                            // permanent signature error and the catch below will delete
                            // the entry. This is no worse than pre-rescue behavior; the
                            // error log gives the consumer a chance to investigate the
                            // specific entry before it disappears.
                            this.logger.error('Re-assinatura do XML legado falhou — POSTando bytes originais; SEFIN provavelmente rejeitará como permanente e a entrada será deletada do RetryStore.', {
                                id: entry.id,
                                signError: signErr instanceof Error ? signErr.message : String(signErr),
                                signErrorName: signErr instanceof Error ? signErr.name : 'unknown',
                            });
                        }
                    }
                    const r = await postEvento(state.sefin, state.certificate, entry.chaveNfse, xmlToPost, {
                        xmlJaAssinado: true,
                    });
                    await store.delete(entry.id);
                    results.push({ id: entry.id, status: 'success', evento: dropInternal(r) });
                }
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                const transient = entry.lastError.transient && isRetryableError(error);
                if (!transient) {
                    await store.delete(entry.id);
                }
                else {
                    // Always refresh `lastAttemptAt` so observability/audit queries
                    // reflect the most recent attempt. Increment `attempts` so policies
                    // doing exponential/linear backoff see the right count. Recompute
                    // `notBefore` from the fresh error — when the policy returns
                    // `undefined` (NetworkError, TimeoutError, generic 5xx without a
                    // Retry-After header), preserve the previous `notBefore` (which
                    // is necessarily in the past at this point). Same id, idempotent
                    // save.
                    const newAttemptAt = new Date();
                    // Defesa contra entry.attempts corrompido (NaN/Infinity/negativo
                    // vindo de um RetryStore que não respeitou o contrato do tipo).
                    // Se inválido, tratamos como "primeira tentativa registrada" (= 1)
                    // e o incremento abaixo leva para 2.
                    const prevAttempts = typeof entry.attempts === 'number' &&
                        Number.isFinite(entry.attempts) &&
                        entry.attempts >= 1
                        ? entry.attempts
                        : 1;
                    const newAttempts = prevAttempts + 1;
                    // firstAttemptAt pode estar undefined em entrada corrompida —
                    // fallback para o `now` atual para que o RetryContext não
                    // propague undefined para policies customizadas.
                    const newNotBefore = this.retryPolicy.computeNotBefore(error, newAttemptAt, {
                        attempt: newAttempts,
                        firstAttemptAt: entry.firstAttemptAt ?? newAttemptAt,
                    });
                    await store.save({
                        ...entry,
                        lastAttemptAt: newAttemptAt,
                        attempts: newAttempts,
                        ...(newNotBefore ? { notBefore: newNotBefore } : {}),
                    });
                }
                results.push({
                    id: entry.id,
                    status: transient ? 'still_pending' : 'failed_permanent',
                    error,
                });
            }
        }
        return results;
    }
    // -------------------------------------------------------------------------
    // Parâmetros Municipais — ADN /parametrizacao, read-only, com cache TTL.
    // -------------------------------------------------------------------------
    /** Consulta a alíquota de ISSQN parametrizada para município + serviço + competência. */
    async consultarAliquota(codigoMunicipio, codigoServico, competencia, options) {
        const state = await this.ensureState();
        return fetchAliquota(state.parametros, codigoMunicipio, codigoServico, competencia, this.parametrosCache, options);
    }
    /** Histórico completo de alíquotas para município + serviço (independente de competência). */
    async consultarHistoricoAliquotas(codigoMunicipio, codigoServico, options) {
        const state = await this.ensureState();
        return fetchHistoricoAliquotas(state.parametros, codigoMunicipio, codigoServico, this.parametrosCache, options);
    }
    /** Parâmetros de um benefício fiscal municipal (redução, imunidade, alíquota diferenciada, etc.). */
    async consultarBeneficio(codigoMunicipio, numeroBeneficio, competencia, options) {
        const state = await this.ensureState();
        return fetchBeneficio(state.parametros, codigoMunicipio, numeroBeneficio, competencia, this.parametrosCache, options);
    }
    /** Status do convênio do município com a Sefin Nacional. */
    async consultarConvenio(codigoMunicipio, options) {
        const state = await this.ensureState();
        return fetchConvenio(state.parametros, codigoMunicipio, this.parametrosCache, options);
    }
    /** Regimes especiais ativos para município + serviço + competência. */
    async consultarRegimesEspeciais(codigoMunicipio, codigoServico, competencia, options) {
        const state = await this.ensureState();
        return fetchRegimesEspeciais(state.parametros, codigoMunicipio, codigoServico, competencia, this.parametrosCache, options);
    }
    /** Configuração de retenções de ISSQN do município para uma competência. */
    async consultarRetencoes(codigoMunicipio, competencia, options) {
        const state = await this.ensureState();
        return fetchRetencoes(state.parametros, codigoMunicipio, competencia, this.parametrosCache, options);
    }
    // -------------------------------------------------------------------------
    // DANFSe — PDF gerado local ou baixado do ADN.
    // -------------------------------------------------------------------------
    /**
     * Gera o DANFSe (PDF) para uma NFS-e. Por default usa o **renderer local**
     * (offline puro) — a NT 008/2026 suspende a API oficial de geração do
     * DANFSe em **03/08/2026**; a geração passa a ser responsabilidade dos
     * sistemas emissores.
     *
     * Estratégias:
     * - `'local'` (default) — só o renderer local (offline puro).
     * - `'auto'` — **deprecated (NT 008)**: online-first com fallback local em
     *   erros transientes (rede/5xx/timeout). Após 03/08/2026 o caminho online
     *   falha sempre e toda chamada paga um round-trip perdido antes do
     *   fallback.
     * - `'online'` — **deprecated (NT 008)**: só o ADN; lança em qualquer
     *   falha. Após 03/08/2026 falha sempre.
     *
     * No caminho online, erros de autorização (`ForbiddenError`,
     * `UnauthorizedError`), chave inválida (`InvalidChaveAcessoError`) ou chave
     * inexistente (`NotFoundError`) **não** caem para local — eles sobem para o
     * caller, que tipicamente precisa corrigir (cert expirado, CNPJ sem
     * permissão, typo na chave).
     *
     * As opções de layout (`urlConsultaPublica`, `observacoes`, `ambiente`) são
     * aplicadas apenas pelo renderer local; no caminho online são ignoradas.
     */
    async gerarDanfse(nfse, options) {
        const strategy = options?.strategy ?? 'local';
        const state = await this.ensureState();
        if (strategy === 'local') {
            return gerarDanfseLocal(nfse, options);
        }
        this.warnDanfseOnlineDeprecated(strategy);
        if (strategy === 'online') {
            return consultarDanfseInternal(state.danfse, nfse.infNFSe.chaveAcesso);
        }
        try {
            return await consultarDanfseInternal(state.danfse, nfse.infNFSe.chaveAcesso);
        }
        catch (err) {
            // Só caímos no renderer local quando o ADN está indisponível (rede,
            // timeout, 5xx). Erros de autenticação/autorização/configuração devem
            // propagar — mascará-los com um PDF local degradado esconderia um
            // problema que o caller precisa corrigir (cert expirado, CNPJ sem
            // acesso à nota, etc.).
            if (err instanceof NetworkError ||
                err instanceof TimeoutError ||
                err instanceof ServerError) {
                this.logger.warn('danfse.online.fallback', {
                    chave: nfse.infNFSe.chaveAcesso,
                    error: err.message,
                    errorName: err.name,
                });
                return gerarDanfseLocal(nfse, options);
            }
            throw err;
        }
    }
    /**
     * Baixa o DANFSe oficial do ADN (`GET /danfse/{chaveAcesso}`). Só retorna
     * se o PDF veio de fato — erros de rede ou HTTP 4xx/5xx viram exceção.
     *
     * @deprecated A NT 008/2026 suspende a API oficial de geração do DANFSe em
     * **03/08/2026** — após essa data este método falha sempre. Use
     * `gerarDanfse(nfse)` (renderer local, default desde v0.10.1). Mantido até
     * a remoção do endpoint para quem ainda precisa do PDF oficial do ADN.
     */
    async consultarDanfse(chaveAcesso) {
        this.warnDanfseOnlineDeprecated('online');
        const state = await this.ensureState();
        return consultarDanfseInternal(state.danfse, chaveAcesso);
    }
    // NT 008/2026: caminho online do DANFSe morre em 03/08/2026 — avisar quem
    // ainda depende dele antes que vire erro em produção.
    warnDanfseOnlineDeprecated(strategy) {
        this.logger.warn('danfse.online.deprecated', {
            strategy,
            motivo: 'NT 008/2026 — API oficial de geração do DANFSe suspensa em 2026-08-03',
            acao: "use gerarDanfse(nfse) com o renderer local (strategy 'local', default)",
        });
    }
    /**
     * Libera o dispatcher mTLS (quando a lib construiu um). Idempotente: chamar
     * duas vezes é seguro. Após `close()`, qualquer nova chamada de método do
     * cliente lança `ClientClosedError` — reinstancie o `NfseClient` para voltar
     * a emitir/consultar.
     */
    async close() {
        this.closed = true;
        const state = this.state;
        this.state = null;
        this.statePromise = null;
        if (state?.ownsDispatcher) {
            await state.dispatcher.close();
        }
    }
    ensureState() {
        if (this.closed) {
            return Promise.reject(new ClientClosedError());
        }
        if (this.state)
            return Promise.resolve(this.state);
        if (this.statePromise)
            return this.statePromise;
        this.statePromise = this.buildState().catch((err) => {
            // Falha de build (cert corrompido, rede) — limpa o promise para que a
            // próxima chamada possa tentar novamente, ao invés de ficar presa num
            // rejected cached.
            this.statePromise = null;
            throw err;
        });
        return this.statePromise;
    }
    async buildState() {
        const endpoints = AMBIENTE_ENDPOINTS[this.ambiente];
        // Always load the certificate: mTLS uses it as the client identity, and
        // emission signs the DPS with the same key/cert. When the user injects
        // their own dispatcher (e.g. MockAgent in tests), we skip the Agent build
        // but still need the cert for signing.
        const certificate = await this.provider.load();
        let dispatcher;
        let ownsDispatcher;
        if (this.dispatcherOverride) {
            dispatcher = this.dispatcherOverride;
            ownsDispatcher = false;
        }
        else {
            dispatcher = new Agent({
                allowH2: false,
                connect: {
                    key: certificate.keyPem,
                    cert: certificate.certPem,
                    ALPNProtocols: ['http/1.1'],
                },
            });
            ownsDispatcher = true;
        }
        // Se `close()` foi chamado durante o await do provider.load, respeite:
        // não guarde o state e limpe o dispatcher que acabamos de construir.
        if (this.closed) {
            if (ownsDispatcher)
                await dispatcher.close();
            throw new ClientClosedError();
        }
        const state = {
            dispatcher,
            ownsDispatcher,
            certificate,
            sefin: new HttpClient({
                baseUrl: endpoints.sefin,
                dispatcher,
                timeoutMs: this.timeoutMs,
                logger: this.logger,
            }),
            adn: new HttpClient({
                baseUrl: endpoints.adn,
                dispatcher,
                timeoutMs: this.timeoutMs,
                logger: this.logger,
            }),
            parametros: new HttpClient({
                baseUrl: endpoints.parametrosMunicipais,
                dispatcher,
                timeoutMs: this.timeoutMs,
                logger: this.logger,
            }),
            danfse: new HttpClient({
                baseUrl: endpoints.danfse,
                dispatcher,
                timeoutMs: this.timeoutMs,
                logger: this.logger,
            }),
        };
        this.state = state;
        return state;
    }
}
/**
 * Lançada quando métodos do cliente são chamados após `close()`. O cliente é
 * single-shot por design — se precisar reconectar, construa um novo
 * `NfseClient`.
 */
export class ClientClosedError extends OpenNfseError {
    constructor() {
        super('NfseClient.close() foi chamado — operações não são mais permitidas nesta instância.');
    }
}
//# sourceMappingURL=client.js.map