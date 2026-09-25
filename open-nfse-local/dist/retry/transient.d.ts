/**
 * Classificador padrão para decidir se uma falha é **transiente** (vale
 * registrar no RetryStore e retentar depois) ou **permanente** (não adianta
 * retentar — falha de regra fiscal, prazo expirado, DV inválido, etc.).
 *
 * Heurística:
 *  - `NetworkError`, `TimeoutError`, `ServerError` (5xx), `TooManyRequestsError` (429) → transiente
 *  - `ReceitaRejectionError` com código em `TRANSIENT_REJECTION_CODES` → transiente
 *  - `ReceitaRejectionError` em qualquer outro código → permanente (default)
 *  - Tudo o resto → permanente (conservador — não entra no retry pipeline)
 *
 * O consumidor pode sobrescrever passando `isTransient?: (err) => boolean`
 * nas opções do método.
 */
export declare function defaultIsTransient(err: unknown): boolean;
//# sourceMappingURL=transient.d.ts.map