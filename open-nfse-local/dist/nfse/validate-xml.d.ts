import { type XsdViolation } from '../errors/validation.js';
export interface ValidateDpsXmlOptions {
    /**
     * Quando `false`, retorna a lista de violações ao invés de lançar.
     * Útil para coletar todos os erros de uma DPS antes de decidir o que fazer.
     * Default: `true` (lança `XsdValidationError` se inválido).
     */
    readonly throwOnInvalid?: boolean;
}
export interface ValidateDpsXmlResult {
    readonly valid: boolean;
    readonly violations: readonly XsdViolation[];
}
/**
 * Valida um XML de DPS contra o schema RTC v1.01 usando libxml2 (via WASM).
 *
 * Por default lança `XsdValidationError` se inválido. Passe `throwOnInvalid: false`
 * para obter `{ valid, violations }` sem lançar.
 *
 * **Nota**: a primeira chamada carrega o runtime WASM do libxml2 (~1 MB). As
 * chamadas seguintes reusam o runtime, então em cargas repetitivas (emissão em
 * lote) a amortização é quase imediata.
 */
export declare function validateDpsXml(xml: string): Promise<undefined>;
export declare function validateDpsXml(xml: string, options: {
    throwOnInvalid: false;
}): Promise<ValidateDpsXmlResult>;
export declare function validateDpsXml(xml: string, options: {
    throwOnInvalid: true;
}): Promise<undefined>;
/**
 * Valida um XML de pedRegEvento (cancelamento/substituição/etc, 101101/105102/...)
 * contra o schema RTC v1.01. Mesmo contrato de `validateDpsXml`.
 */
export declare function validatePedRegEventoXml(xml: string): Promise<undefined>;
export declare function validatePedRegEventoXml(xml: string, options: {
    throwOnInvalid: false;
}): Promise<ValidateDpsXmlResult>;
export declare function validatePedRegEventoXml(xml: string, options: {
    throwOnInvalid: true;
}): Promise<undefined>;
/**
 * Valida um XML de `<evento>` (a resposta da Sefin que envelopa o
 * pedRegEvento + metadados de processamento) contra o schema RTC v1.01.
 */
export declare function validateEventoXml(xml: string): Promise<undefined>;
export declare function validateEventoXml(xml: string, options: {
    throwOnInvalid: false;
}): Promise<ValidateDpsXmlResult>;
export declare function validateEventoXml(xml: string, options: {
    throwOnInvalid: true;
}): Promise<undefined>;
//# sourceMappingURL=validate-xml.d.ts.map