/**
 * Cache plugável para respostas da API de Parâmetros Municipais. Implemente
 * esta interface contra Redis, Memcached, DynamoDB ou qualquer outro backend
 * se quiser compartilhar cache entre processos. A lib inclui
 * `createInMemoryParametrosCache()` como default (Map em memória).
 *
 * Contrato:
 *  - `get` retorna `undefined` em miss ou item expirado.
 *  - `set` guarda por `ttlMs` milissegundos a partir de agora.
 *  - As chaves são opacas — não assuma formato (a lib pode mudar).
 */
export interface ParametrosCache {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, ttlMs: number): Promise<void>;
}
export declare function createInMemoryParametrosCache(): ParametrosCache;
/** TTLs defaults, em milissegundos. */
export declare const DEFAULT_TTL_MS: {
    readonly aliquota: number;
    readonly historicoAliquotas: number;
    readonly beneficio: number;
    readonly convenio: number;
    readonly regimesEspeciais: number;
    readonly retencoes: number;
};
//# sourceMappingURL=cache.d.ts.map