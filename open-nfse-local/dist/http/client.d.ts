import { type Dispatcher } from 'undici';
import type { A1Certificate } from '../certificate/types.js';
import { type Logger } from '../logging.js';
export interface HttpClientConfig {
    readonly baseUrl: string;
    readonly dispatcher: Dispatcher;
    readonly timeoutMs?: number;
    readonly logger?: Logger;
}
export interface RequestOptions {
    /**
     * HTTP status codes that should be treated as valid responses (body parsed
     * and returned) instead of being mapped to an error. Use for endpoints where
     * 4xx codes carry meaningful payloads — e.g. ADN Contribuintes returns 404
     * with a "no documents found" body on the NSU endpoint.
     */
    readonly acceptedStatuses?: readonly number[];
}
export declare class HttpClient {
    private readonly baseUrl;
    private readonly dispatcher;
    private readonly timeoutMs;
    private readonly logger;
    constructor(config: HttpClientConfig);
    get<T>(path: string, options?: RequestOptions): Promise<T>;
    post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T>;
    /**
     * HEAD — verifica existência sem baixar o body. Retorna o status code em
     * caso de 2xx, lança o erro mapeado em 4xx/5xx (a menos que o status esteja
     * em `acceptedStatuses`).
     */
    head(path: string, options?: RequestOptions): Promise<number>;
    /**
     * GET binário — devolve o corpo cru como `Buffer` em vez de parsear JSON.
     * Usado pelo endpoint DANFSe (`application/pdf`). Segue as mesmas regras
     * de timeout, mTLS e `acceptedStatuses`.
     */
    getPdf(path: string, options?: RequestOptions): Promise<Buffer>;
    private execute;
    private mapTransportError;
}
export declare function createMtlsDispatcher(certificate: A1Certificate): Dispatcher;
//# sourceMappingURL=client.d.ts.map