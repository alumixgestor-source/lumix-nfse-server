import type { HttpClient } from '../http/client.js';
import { type ParametrosCache } from './cache.js';
import type { ConsultaAliquotasResult, ConsultaBeneficioResult, ConsultaConvenioResult, ConsultaRegimesEspeciaisResult, ConsultaRetencoesResult } from './types.js';
/** Opções comuns aos consultores — cache override per-call + TTL override. */
export interface ConsultaOptions {
    /** Passe `false` para forçar miss (bater direto no ADN). Default `true`. */
    readonly useCache?: boolean;
    /** Override do TTL para esta chamada específica. */
    readonly ttlMs?: number;
    /**
     * Cache específica para esta chamada. Sobrescreve a do cliente. Útil para
     * testes e cenários com cache compartilhada entre processos.
     */
    readonly cache?: ParametrosCache;
}
export declare function fetchAliquota(httpClient: HttpClient, codigoMunicipio: string, codigoServico: string, competencia: Date | string, cache?: ParametrosCache, options?: ConsultaOptions): Promise<ConsultaAliquotasResult>;
export declare function fetchHistoricoAliquotas(httpClient: HttpClient, codigoMunicipio: string, codigoServico: string, cache?: ParametrosCache, options?: ConsultaOptions): Promise<ConsultaAliquotasResult>;
export declare function fetchBeneficio(httpClient: HttpClient, codigoMunicipio: string, numeroBeneficio: string, competencia: Date | string, cache?: ParametrosCache, options?: ConsultaOptions): Promise<ConsultaBeneficioResult>;
export declare function fetchConvenio(httpClient: HttpClient, codigoMunicipio: string, cache?: ParametrosCache, options?: ConsultaOptions): Promise<ConsultaConvenioResult>;
export declare function fetchRegimesEspeciais(httpClient: HttpClient, codigoMunicipio: string, codigoServico: string, competencia: Date | string, cache?: ParametrosCache, options?: ConsultaOptions): Promise<ConsultaRegimesEspeciaisResult>;
export declare function fetchRetencoes(httpClient: HttpClient, codigoMunicipio: string, competencia: Date | string, cache?: ParametrosCache, options?: ConsultaOptions): Promise<ConsultaRetencoesResult>;
//# sourceMappingURL=fetch.d.ts.map