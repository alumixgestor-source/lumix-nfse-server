import { ValidationError } from '../errors/validation.js';
export interface DpsCounterScope {
    readonly emitenteCnpj: string;
    readonly serie: string;
}
/**
 * Fonte atômica do próximo `nDPS`. O `NfseClient.emitir()` consulta esse
 * provider **depois** de passar nas validações offline (CPF/CNPJ, XSD, CEP)
 * e **antes** de assinar e enviar ao SEFIN — assim uma DPS quebrada não
 * queima um número da série.
 *
 * **Contrato**:
 *  - `next()` deve ser **atômico** para um mesmo `{emitenteCnpj, serie}`.
 *    Use `UPDATE ... RETURNING` no Postgres, `INCR` no Redis, ou equivalente.
 *  - Nunca `SELECT` + `INSERT` em duas queries: race condition garantida.
 *  - Retorno: string com 1 a 15 dígitos, sem zeros à esquerda (primeiro
 *    dígito `[1-9]` per RTC `TSNumDPS`).
 *
 * A lib não prescreve onde persistir o counter — o schema SQL sugerido em
 * `docs/guide/integracao.md` usa uma tabela `dps_counters` com PK composta
 * `(cnpj, serie)`.
 */
export interface DpsCounter {
    next(scope: DpsCounterScope): Promise<string>;
}
/**
 * Counter em memória, para testes e demos. Não persiste entre restarts.
 * Produção implementa a interface contra seu banco.
 */
export declare function createInMemoryDpsCounter(initial?: number): DpsCounter;
export declare class MissingDpsCounterError extends ValidationError {
    constructor();
}
//# sourceMappingURL=dps-counter.d.ts.map