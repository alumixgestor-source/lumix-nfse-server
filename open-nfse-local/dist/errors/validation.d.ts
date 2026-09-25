import { OpenNfseError } from './base.js';
export declare abstract class ValidationError extends OpenNfseError {
}
export declare class InvalidCpfError extends ValidationError {
    readonly cpf: string;
    readonly reason: 'format' | 'check_digit' | 'known_invalid';
    constructor(cpf: string, reason: 'format' | 'check_digit' | 'known_invalid');
}
export declare class InvalidCnpjError extends ValidationError {
    readonly cnpj: string;
    readonly reason: 'format' | 'check_digit' | 'known_invalid';
    constructor(cnpj: string, reason: 'format' | 'check_digit' | 'known_invalid');
}
export declare class InvalidCepError extends ValidationError {
    readonly cep: string;
    readonly reason: 'format' | 'not_found' | 'api_unavailable';
    constructor(cep: string, reason: 'format' | 'not_found' | 'api_unavailable', detalhe?: string);
}
export declare class InvalidChaveAcessoError extends ValidationError {
    readonly value: string;
    constructor(value: string, options?: {
        cause?: unknown;
    });
}
export declare class InvalidDpsIdError extends ValidationError {
    readonly value: string;
    constructor(value: string, options?: {
        cause?: unknown;
    });
}
export declare class InvalidXmlError extends ValidationError {
    constructor(detalhe: string, options?: {
        cause?: unknown;
    });
}
/** Uma violação de XSD individual. */
export interface XsdViolation {
    readonly message: string;
    readonly line?: number;
}
/**
 * Violação de regra de negócio local. Usado para regras que o lib verifica
 * antes de ir para a rede — tipicamente regras enumeradas no Manual do
 * Contribuinte / Anexo I (e.g. E0078: cMotivo=99 exige xMotivo) que evitamos
 * disparar um round-trip inútil + queima de `nDPS`.
 */
export declare class RuleViolationError extends ValidationError {
    readonly rule: string | undefined;
    constructor(message: string, rule?: string);
}
/**
 * Lançado quando um XML falha validação XSD contra a RTC v1.01. Carrega a
 * lista completa de violações detectadas pelo xmllint — útil para mostrar
 * todos os erros de uma vez em vez de só o primeiro.
 */
export declare class XsdValidationError extends ValidationError {
    readonly violations: readonly XsdViolation[];
    constructor(violations: readonly XsdViolation[], options?: {
        cause?: unknown;
    });
}
//# sourceMappingURL=validation.d.ts.map