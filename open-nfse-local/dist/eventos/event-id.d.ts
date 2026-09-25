import { ValidationError } from '../errors/validation.js';
/**
 * Per Anexo II do SEFIN_ADN v1.00-20251226 (publicado 2025-12-27):
 * `PRE` + chave(50) + tipoEvento(6) = 59 chars. Pattern `PRE[0-9]{56}`.
 *
 * **Mudança breaking vs RTC v1.01 original**: o `nPedRegEvento` (3 dígitos)
 * foi removido tanto da composição do `Id` quanto do corpo de `infPedReg`.
 * Manter o formato antigo causa rejeição E1235 ("Falha no esquema XML do
 * DF-e — The Pattern constraint failed") em produção.
 */
export interface BuildEventoPedidoIdParams {
    readonly chaveAcesso: string;
    readonly tipoEvento: string;
}
export declare class InvalidEventoPedidoIdParamError extends ValidationError {
    readonly field: keyof BuildEventoPedidoIdParams;
    readonly value: string;
    constructor(field: keyof BuildEventoPedidoIdParams, value: string, detail: string);
}
export declare function buildEventoPedidoId(params: BuildEventoPedidoIdParams): string;
//# sourceMappingURL=event-id.d.ts.map