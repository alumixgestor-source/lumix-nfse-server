import { TipoAmbiente } from '../ambiente.js';
import type { CepValidator } from '../cep/types.js';
import type { A1Certificate } from '../certificate/types.js';
import { type MensagemProcessamento } from '../errors/receita.js';
import type { HttpClient } from '../http/client.js';
import type { RetryPolicy } from '../retry/policy.js';
import { type PendingEmission, type RetryStore } from '../retry/store.js';
import { type BuildDpsParams } from './build-dps.js';
import type { DPS, NFSe } from './domain.js';
import { type DpsCounter } from './dps-counter.js';
export interface EmitOptions {
    /**
     * Quando `true`, a pipeline só constrói e assina o XML — sem enviar para a
     * Receita. Útil para previews, testes locais e inspeção offline.
     */
    readonly dryRun?: boolean;
    /**
     * Pula a validação XSD local (RTC v1.01) antes de assinar. Default `false`.
     * A validação roda antes da assinatura: se o XML estiver malformado, o erro
     * aparece localmente com linha + descrição ao invés de virar rejeição da
     * Receita depois de um round-trip. Só desligue para debugging ou quando
     * estiver intencionalmente gerando XML fora do padrão.
     */
    readonly skipValidation?: boolean;
    /**
     * Pula a validação de CEP (formato + lookup na API externa). Default
     * `false`. Quando habilitada, cada endereço da DPS (prest/toma/interm/obra/
     * atvEvento/RTC-dest/fornec) é verificado — a API default é o ViaCEP.
     */
    readonly skipCepValidation?: boolean;
    /**
     * Pula a validação de dígito verificador de CPF/CNPJ. Default `false`.
     * Apenas identificadores do tipo CNPJ e CPF são validados; NIF e cNaoNIF
     * são ignorados (não têm DV brasileiro).
     */
    readonly skipCpfCnpjValidation?: boolean;
    /**
     * Validador de CEP custom. Se omitido, o validador default (ViaCEP) é
     * usado. Passe um custom para usar outra API, banco local ou mock em tests.
     */
    readonly cepValidator?: CepValidator;
}
/** Resultado do modo dry-run — retorna o XML assinado sem enviar. */
export interface DpsDryRunResult {
    readonly dryRun: true;
    readonly xmlDpsAssinado: string;
    readonly xmlDpsGZipB64: string;
}
/** Resultado do POST /nfse síncrono. */
export interface NfseEmitResult {
    readonly dryRun?: false;
    readonly chaveAcesso: string;
    readonly idDps: string;
    readonly xmlNfse: string;
    readonly nfse: NFSe;
    readonly alertas: readonly MensagemProcessamento[];
    readonly tipoAmbiente: TipoAmbiente;
    readonly versaoAplicativo: string;
    readonly dataHoraProcessamento: Date;
}
/**
 * Escape hatch para quando você já tem um `DPS` completo e quer controlar
 * inteiramente a pipeline. `nDPS` precisa estar preenchido; o counter do
 * cliente **não** é chamado. Sem tratamento transiente — falhas de rede
 * viram exceção.
 *
 * O caminho padrão é `emitSeguro` / `NfseClient.emitir(params)`.
 */
export declare function emitDpsPronta(httpClient: HttpClient, certificate: A1Certificate, dps: DPS, options: EmitOptions & {
    dryRun: true;
}): Promise<DpsDryRunResult>;
export declare function emitDpsPronta(httpClient: HttpClient, certificate: A1Certificate, dps: DPS, options?: EmitOptions & {
    dryRun?: false;
}): Promise<NfseEmitResult>;
/**
 * Como `emitDpsPronta`, mas com resiliência a transientes: em vez de lançar
 * num erro transiente (rede/timeout/5xx/429), persiste uma `PendingEmission`
 * no `retryStore` e retorna `retry_pending` (replay via `replayPendingEvents`).
 * Rejeição permanente continua lançando. É o caminho usado por `substituir`
 * (a DPS já vem pronta, com `nDPS` explícito — não há counter envolvido).
 */
export declare function emitDpsProntaSeguro(httpClient: HttpClient, certificate: A1Certificate, dps: DPS, deps: {
    readonly retryStore: RetryStore | undefined;
    readonly retryPolicy: RetryPolicy;
    readonly isTransient?: (err: unknown) => boolean;
}, options?: Omit<EmitOptions, 'dryRun'>): Promise<EmitirResult>;
export interface EmitLoteOptions {
    /** Máximo de requisições concorrentes. Default: 4. */
    readonly concurrency?: number;
    /**
     * Interromper o lote assim que uma DPS falhar. As DPS ainda não processadas
     * aparecem no resultado com `status: 'skipped'`. Default: `false` (coletar
     * todas e deixar o caller decidir como reagir).
     */
    readonly stopOnError?: boolean;
    /** Propagado para cada `emitDpsPronta()` do lote. Ver `EmitOptions.skipValidation`. */
    readonly skipValidation?: boolean;
    /** Propagado. Ver `EmitOptions.skipCepValidation`. */
    readonly skipCepValidation?: boolean;
    /** Propagado. Ver `EmitOptions.skipCpfCnpjValidation`. */
    readonly skipCpfCnpjValidation?: boolean;
    /**
     * Validador de CEP compartilhado pelo lote. Crie uma instância única com
     * cache externo para deduplicar lookups entre as DPS. Ver `createViaCepValidator`.
     */
    readonly cepValidator?: CepValidator;
}
export type EmitLoteItem = {
    readonly status: 'success';
    readonly dps: DPS;
    readonly result: NfseEmitResult;
} | {
    readonly status: 'failure';
    readonly dps: DPS;
    readonly error: Error;
} | {
    readonly status: 'skipped';
    readonly dps: DPS;
};
export interface EmitLoteResult {
    readonly items: readonly EmitLoteItem[];
    readonly successCount: number;
    readonly failureCount: number;
    readonly skippedCount: number;
}
export declare function emitMany(httpClient: HttpClient, certificate: A1Certificate, dpsList: readonly DPS[], options?: EmitLoteOptions): Promise<EmitLoteResult>;
/**
 * Parâmetros de alto nível para `emitSeguro`. Equivalente a `BuildDpsParams`
 * sem o campo `nDPS` (fornecido pelo `DpsCounter`), mais os flags de emissão.
 *
 * Passe `nDPS` explícito para override manual (útil para `dryRun` sem queimar
 * um número ou replay determinístico em testes).
 */
export interface EmitirParams extends Omit<BuildDpsParams, 'nDPS'>, EmitOptions {
    /**
     * Override manual do `nDPS`. Quando presente, o `DpsCounter` não é
     * consultado. Obrigatório em `dryRun` (sem isso o preview consumiria
     * um número do counter à toa).
     *
     * **Não preencher com zeros à esquerda** — o `Id` da DPS é composto a partir
     * desta string, então `'1'` e `'00001'` produzem `Id`s distintos para o mesmo
     * número sequencial.
     */
    readonly nDPS?: string;
}
/**
 * Resultado discriminado de `emitSeguro`.
 *
 * - `ok` — autorizada, `nfse` contém a NFS-e parseada.
 * - `retry_pending` — erro transiente (rede/timeout/5xx); salvo no
 *   `RetryStore` para replay idempotente via `replayPendingEvents`.
 *
 * Erros **permanentes** (rejeição de regra fiscal, validação local) lançam
 * exceção — o caller sabe que o nDPS foi consumido mas a nota foi
 * definitivamente rejeitada.
 */
export type EmitirResult = {
    readonly status: 'ok';
    readonly nfse: NfseEmitResult;
} | {
    readonly status: 'retry_pending';
    readonly pending: PendingEmission;
    readonly error: Error;
};
interface EmitSeguroDeps {
    readonly httpClient: HttpClient;
    readonly certificate: A1Certificate;
    readonly dpsCounter: DpsCounter | undefined;
    readonly retryStore: RetryStore | undefined;
    readonly retryPolicy: RetryPolicy;
    readonly isTransient?: (err: unknown) => boolean;
}
export declare function emitSeguro(deps: EmitSeguroDeps, params: EmitirParams): Promise<EmitirResult | DpsDryRunResult>;
/**
 * Replay de uma emissão pendente — re-POSTa o XML assinado diretamente em
 * `/nfse`. SEFIN deduplica via `infDPS.Id`, então retentar é idempotente.
 */
export declare function replayEmission(httpClient: HttpClient, xmlSignedDps: string): Promise<NfseEmitResult>;
export {};
//# sourceMappingURL=emit.d.ts.map