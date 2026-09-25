import { TipoAmbiente } from '../ambiente.js';
import type { HttpClient } from '../http/client.js';
/** Resposta de `GET /dps/{id}` quando há NFS-e gerada. */
export interface DpsStatusResult {
    readonly chaveAcesso: string;
    readonly idDps: string;
    readonly tipoAmbiente: TipoAmbiente;
    readonly versaoAplicativo: string;
    readonly dataHoraProcessamento: Date;
}
/**
 * `GET /dps/{id}` — consulta o SEFIN pela chave de acesso da NFS-e a partir
 * de um `infDPS.Id`. Uso primário: **reconciliação pós-timeout** — se um
 * `emitir()` não retornou e você tem o idDps persistido, essa chamada revela
 * se a Receita chegou a gerar a NFS-e.
 *
 * Retorna `DpsStatusResult` (com `chaveAcesso`) quando há NFS-e; lança
 * `NotFoundError` (HTTP 404) quando não há; lança `InvalidDpsIdParamError`
 * se o formato do id for inválido.
 */
export declare function fetchDpsStatus(httpClient: HttpClient, idDps: string): Promise<DpsStatusResult>;
/**
 * `HEAD /dps/{id}` — verifica existência sem baixar o body. Mais barato que
 * `fetchDpsStatus` para checks bulk de reconciliação. Retorna `true` se há
 * NFS-e gerada, `false` se não (404). Propaga outros erros HTTP.
 */
export declare function existsDpsStatus(httpClient: HttpClient, idDps: string): Promise<boolean>;
//# sourceMappingURL=fetch-dps-status.d.ts.map