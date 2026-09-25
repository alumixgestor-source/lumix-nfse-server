import type { A1Certificate } from '../certificate/types.js';
import type { HttpClient } from '../http/client.js';
import type { DPS } from '../nfse/domain.js';
import { type EmitOptions, type NfseEmitResult } from '../nfse/emit.js';
import { JustificativaCancelamento, JustificativaSubstituicao, type TipoAmbienteDps } from '../nfse/enums.js';
import type { RetryPolicy } from '../retry/policy.js';
import { type PendingEmission, type PendingEvent, type RetryStore } from '../retry/store.js';
import { type AutorEvento } from './build-event-xml.js';
import { type EventoResult } from './post-evento.js';
export interface CancelarParams {
    readonly chaveAcesso: string;
    readonly autor: AutorEvento;
    readonly cMotivo: JustificativaCancelamento;
    readonly xMotivo: string;
    readonly tpAmb?: TipoAmbienteDps;
    readonly verAplic?: string;
    readonly dhEvento?: Date;
    /**
     * Store para persistir pendentes se o POST falhar transitoriamente.
     * Se omitido e o caminho transiente for acionado, lança
     * `MissingRetryStoreError` para forçar decisão consciente.
     */
    readonly retryStore?: RetryStore;
    /** Classificador custom. Default: `defaultIsTransient`. */
    readonly isTransient?: (err: unknown) => boolean;
}
/** Estado do resultado de `cancelar` — discriminated union sobre `status`. */
export type CancelarResult = {
    readonly status: 'ok';
    readonly evento: EventoResult;
} | {
    readonly status: 'retry_pending';
    readonly pending: PendingEvent;
    readonly error: Error;
};
export declare function cancelar(httpClient: HttpClient, certificate: A1Certificate, retryPolicy: RetryPolicy, params: CancelarParams): Promise<CancelarResult>;
/**
 * Parâmetros da substituição. A substituição é dirigida 100% pela DPS: não há
 * `autor`/`tpAmb`/`verAplic`/`dhEvento` porque o contribuinte não registra um
 * evento — apenas emite a nova DPS. As opções de emissão (`skip*Validation`,
 * `cepValidator`) são repassadas ao emit; `retryStore`/`isTransient` controlam
 * a resiliência a falhas transientes (idêntico a `emitir`).
 */
export interface SubstituirParams extends Omit<EmitOptions, 'dryRun'> {
    /** Chave da NFS-e a ser substituída (a antiga). */
    readonly chaveOriginal: string;
    /**
     * Nova DPS (substituta). Se `infDPS.subst` não estiver preenchido, é
     * auto-completado com `chaveOriginal` + `cMotivo`/`xMotivo`.
     */
    readonly novaDps: DPS;
    readonly cMotivo: JustificativaSubstituicao;
    readonly xMotivo?: string;
    /**
     * Store para persistir a emissão pendente se o `POST /nfse` falhar
     * transitoriamente. Se omitido e o caminho transiente for acionado, lança
     * `MissingRetryStoreError` para forçar decisão consciente.
     */
    readonly retryStore?: RetryStore;
    /** Classificador custom de transiência. Default: `defaultIsTransient`. */
    readonly isTransient?: (err: unknown) => boolean;
}
/**
 * Resultado da substituição — discriminated union sobre `status`, idêntico em
 * forma ao `EmitirResult`. Enviar a nova DPS com `infDPS/subst` para
 * `POST /nfse` faz o **sistema** gerar o evento 105102 (autor=MEmis) cancelando
 * a original (atômico). Como há um único write:
 *
 * - `'ok'` — nota substituta autorizada (`novaNfse`); a original foi cancelada
 *   server-side pelo 105102.
 * - `'retry_pending'` — falha **transiente** no `POST /nfse`; a emissão foi
 *   persistida no `retryStore` para replay idempotente via `replayPendingEvents`
 *   (dedup por `infDPS.Id`). Nada foi alterado no SEFIN ainda.
 *
 * Rejeição **permanente** (regra fiscal / validação local) **lança** exceção.
 */
export type SubstituirResult = {
    readonly status: 'ok';
    readonly novaNfse: NfseEmitResult;
} | {
    readonly status: 'retry_pending';
    readonly pending: PendingEmission;
    readonly error: Error;
};
export declare function substituir(httpClient: HttpClient, certificate: A1Certificate, retryPolicy: RetryPolicy, params: SubstituirParams): Promise<SubstituirResult>;
//# sourceMappingURL=cancelar.d.ts.map