import { type Dispatcher } from 'undici';
import { type Ambiente } from './ambiente.js';
import type { CepValidator } from './cep/types.js';
import type { CertificateInput } from './certificate/types.js';
import { type GerarDanfseOptions } from './danfse/gerar.js';
import type { FetchByNsuOptions, NsuQueryResult } from './dfe/types.js';
import { OpenNfseError } from './errors/base.js';
import { type CancelarParams, type CancelarResult, type SubstituirParams, type SubstituirResult } from './eventos/cancelar.js';
import type { EventoResult } from './eventos/post-evento.js';
import { type Logger } from './logging.js';
import type { DPS } from './nfse/domain.js';
import type { NFSe } from './nfse/domain.js';
import type { DpsCounter } from './nfse/dps-counter.js';
import { type DpsDryRunResult, type EmitLoteOptions, type EmitLoteResult, type EmitOptions, type EmitirParams, type EmitirResult, type NfseEmitResult } from './nfse/emit.js';
import { type DpsStatusResult } from './nfse/fetch-dps-status.js';
import type { NfseQueryResult } from './nfse/types.js';
import { type ParametrosCache } from './parametros-municipais/cache.js';
import { type ConsultaOptions } from './parametros-municipais/fetch.js';
import type { ConsultaAliquotasResult, ConsultaBeneficioResult, ConsultaConvenioResult, ConsultaRegimesEspeciaisResult, ConsultaRetencoesResult } from './parametros-municipais/types.js';
import { type RetryPolicy } from './retry/policy.js';
import { type RetryStore } from './retry/store.js';
export type ReplayItem = {
    readonly id: string;
    readonly status: 'success';
    readonly evento: EventoResult;
} | {
    readonly id: string;
    readonly status: 'success_emission';
    readonly emission: NfseEmitResult;
} | {
    readonly id: string;
    readonly status: 'still_pending';
    readonly error: Error;
} | {
    readonly id: string;
    readonly status: 'failed_permanent';
    readonly error: Error;
};
export interface EmitenteConfig {
    /** CNPJ do emitente (14 dígitos, sem máscara). */
    readonly cnpj: string;
    /** Inscrição Municipal no município emissor. */
    readonly inscricaoMunicipal: string;
    /** Código IBGE do município emissor (7 dígitos). Ex.: `2111300` = São Luís/MA, `3550308` = São Paulo/SP. */
    readonly codigoMunicipio: string;
}
export interface NfseClientConfig {
    readonly ambiente: Ambiente;
    readonly certificado: CertificateInput;
    readonly emitente?: EmitenteConfig;
    readonly timeoutMs?: number;
    readonly logger?: Logger;
    /**
     * Advanced / testing hook. When set, used as the HTTP dispatcher instead of
     * building an mTLS Agent from `certificado` (e.g. pass undici's `MockAgent`).
     * Normal consumers should never need this.
     */
    readonly dispatcher?: Dispatcher;
    /**
     * Validador de CEP usado nas emissões deste cliente. Se omitido, a lib usa
     * o `createViaCepValidator()` internamente (consulta viacep.com.br com
     * cache em memória). Passe um custom para trocar o provedor (BrasilAPI,
     * banco local, mock em tests).
     */
    readonly cepValidator?: CepValidator;
    /**
     * Store para eventos pendentes de retry. Necessário para `emitir()` e
     * `substituir()` persistirem falhas transientes/rollbacks. Se omitido, a lib
     * lança `MissingRetryStoreError` quando o caminho transiente é acionado.
     */
    readonly retryStore?: RetryStore;
    /**
     * Provedor atômico do próximo `nDPS`. Obrigatório para `emitir(params)` —
     * o novo fluxo consulta esse provider depois das validações offline
     * passarem. `emitirDpsPronta(dps)` não usa.
     */
    readonly dpsCounter?: DpsCounter;
    /**
     * Cache opcional para respostas da API de Parâmetros Municipais. Se omitido
     * e `useCache` não for `false` em cada chamada, a lib usa um
     * `createInMemoryParametrosCache()` implícito. Para cache compartilhada
     * entre processos, passe uma impl de Redis/Memcached.
     */
    readonly parametrosCache?: ParametrosCache;
    /**
     * Política de retry — decide o `notBefore` para cada erro transiente
     * (respeitando `Retry-After` quando o servidor envia). Se omitida, a
     * lib usa `createDefaultRetryPolicy()` (default 60s para 429/503 sem
     * header, cap de 1h para valores absurdos).
     */
    readonly retryPolicy?: RetryPolicy;
}
export interface FetchByNsuParams extends FetchByNsuOptions {
    readonly ultimoNsu: number;
}
export declare class NfseClient {
    private readonly ambiente;
    private readonly provider;
    private readonly timeoutMs;
    private readonly logger;
    private readonly dispatcherOverride;
    private readonly cepValidator;
    private readonly retryStore;
    private readonly dpsCounter;
    private readonly parametrosCache;
    private readonly retryPolicy;
    private state;
    private statePromise;
    private closed;
    constructor(config: NfseClientConfig);
    fetchByChave(chaveAcesso: string): Promise<NfseQueryResult>;
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
    fetchDpsStatus(idDps: string): Promise<DpsStatusResult>;
    /**
     * `HEAD /dps/{id}` — variante barata de `fetchDpsStatus` que só retorna
     * `true`/`false` sem baixar o corpo. Para reconciliação em lote, prefere
     * esse método e busque os detalhes via `fetchDpsStatus` só nos que existem.
     */
    existsDpsStatus(idDps: string): Promise<boolean>;
    fetchByNsu(params: FetchByNsuParams): Promise<NsuQueryResult>;
    /**
     * Emissão segura — fluxo primário. Recebe params de alto nível (sem `nDPS`);
     * a lib consulta o `DpsCounter` configurado **só depois** de todas as
     * validações offline (CPF/CNPJ, XSD, CEP) passarem, de forma que uma DPS
     * quebrada não queima um número da série.
     *
     * Resultado discriminado:
     * - `{ status: 'ok', nfse }` — autorizada.
     * - `{ status: 'retry_pending', pending }` — falha transiente (rede / timeout
     *   / 5xx / 429); salvo no `RetryStore` para replay via `replayPendingEvents()`.
     *
     * Lança em falhas permanentes (rejeição fiscal, validação offline). Nesses
     * casos o `nDPS` foi consumido mas a nota foi definitivamente rejeitada —
     * o caller loga e segue.
     *
     * **Não envolva esta chamada num retry loop próprio para 429 / 5xx.** Cada
     * `emitir()` consome um `nDPS` antes do POST; um wrapper externo que recapta
     * e retenta queima números da série e cria buracos permanentes. A lib já
     * persiste o pendente no `RetryStore` e dedupica server-side via `infDPS.Id`
     * — use `replayPendingEvents()` (tipicamente num cron) para retomar.
     *
     * Para emitir uma DPS já montada manualmente (bypass counter + retry flow),
     * use `emitirDpsPronta(dps)`.
     */
    emitir(params: EmitirParams & {
        dryRun: true;
    }): Promise<DpsDryRunResult>;
    emitir(params: EmitirParams & {
        dryRun?: false;
    }): Promise<EmitirResult>;
    /**
     * Escape hatch — emite uma `DPS` já completamente montada. Não consulta o
     * counter, não usa o `RetryStore`. Falhas viram exceção direta.
     * Útil para replay customizado, testes com nDPS determinístico, ou quando
     * você pré-assina o XML externamente.
     */
    emitirDpsPronta(dps: DPS, options?: EmitOptions & {
        dryRun?: false;
    }): Promise<NfseEmitResult>;
    emitirDpsPronta(dps: DPS, options: EmitOptions & {
        dryRun: true;
    }): Promise<DpsDryRunResult>;
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
    emitirEmLote(dpsList: readonly DPS[], options?: EmitLoteOptions): Promise<EmitLoteResult>;
    private mergeEmitOptions;
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
    cancelar(params: CancelarParams): Promise<CancelarResult>;
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
    substituir(params: SubstituirParams): Promise<SubstituirResult>;
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
    replayPendingEvents(override?: RetryStore): Promise<ReplayItem[]>;
    /** Consulta a alíquota de ISSQN parametrizada para município + serviço + competência. */
    consultarAliquota(codigoMunicipio: string, codigoServico: string, competencia: Date | string, options?: ConsultaOptions): Promise<ConsultaAliquotasResult>;
    /** Histórico completo de alíquotas para município + serviço (independente de competência). */
    consultarHistoricoAliquotas(codigoMunicipio: string, codigoServico: string, options?: ConsultaOptions): Promise<ConsultaAliquotasResult>;
    /** Parâmetros de um benefício fiscal municipal (redução, imunidade, alíquota diferenciada, etc.). */
    consultarBeneficio(codigoMunicipio: string, numeroBeneficio: string, competencia: Date | string, options?: ConsultaOptions): Promise<ConsultaBeneficioResult>;
    /** Status do convênio do município com a Sefin Nacional. */
    consultarConvenio(codigoMunicipio: string, options?: ConsultaOptions): Promise<ConsultaConvenioResult>;
    /** Regimes especiais ativos para município + serviço + competência. */
    consultarRegimesEspeciais(codigoMunicipio: string, codigoServico: string, competencia: Date | string, options?: ConsultaOptions): Promise<ConsultaRegimesEspeciaisResult>;
    /** Configuração de retenções de ISSQN do município para uma competência. */
    consultarRetencoes(codigoMunicipio: string, competencia: Date | string, options?: ConsultaOptions): Promise<ConsultaRetencoesResult>;
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
    gerarDanfse(nfse: NFSe, options?: GerarDanfseOptions & {
        strategy?: 'auto' | 'online' | 'local';
    }): Promise<Buffer>;
    /**
     * Baixa o DANFSe oficial do ADN (`GET /danfse/{chaveAcesso}`). Só retorna
     * se o PDF veio de fato — erros de rede ou HTTP 4xx/5xx viram exceção.
     *
     * @deprecated A NT 008/2026 suspende a API oficial de geração do DANFSe em
     * **03/08/2026** — após essa data este método falha sempre. Use
     * `gerarDanfse(nfse)` (renderer local, default desde v0.10.1). Mantido até
     * a remoção do endpoint para quem ainda precisa do PDF oficial do ADN.
     */
    consultarDanfse(chaveAcesso: string): Promise<Buffer>;
    private warnDanfseOnlineDeprecated;
    /**
     * Libera o dispatcher mTLS (quando a lib construiu um). Idempotente: chamar
     * duas vezes é seguro. Após `close()`, qualquer nova chamada de método do
     * cliente lança `ClientClosedError` — reinstancie o `NfseClient` para voltar
     * a emitir/consultar.
     */
    close(): Promise<void>;
    private ensureState;
    private buildState;
}
/**
 * Lançada quando métodos do cliente são chamados após `close()`. O cliente é
 * single-shot por design — se precisar reconectar, construa um novo
 * `NfseClient`.
 */
export declare class ClientClosedError extends OpenNfseError {
    constructor();
}
//# sourceMappingURL=client.d.ts.map