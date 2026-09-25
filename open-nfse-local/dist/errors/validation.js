import { OpenNfseError } from './base.js';
export class ValidationError extends OpenNfseError {
}
export class InvalidCpfError extends ValidationError {
    cpf;
    reason;
    constructor(cpf, reason) {
        const texto = {
            format: 'formato inválido (esperado 11 dígitos sem máscara)',
            check_digit: 'dígitos verificadores não conferem',
            known_invalid: 'sequência repetida inválida',
        }[reason];
        super(`CPF "${cpf}" ${texto}`);
        this.cpf = cpf;
        this.reason = reason;
    }
}
export class InvalidCnpjError extends ValidationError {
    cnpj;
    reason;
    constructor(cnpj, reason) {
        const texto = {
            format: 'formato inválido (esperado 14 dígitos sem máscara)',
            check_digit: 'dígitos verificadores não conferem',
            known_invalid: 'sequência repetida inválida',
        }[reason];
        super(`CNPJ "${cnpj}" ${texto}`);
        this.cnpj = cnpj;
        this.reason = reason;
    }
}
export class InvalidCepError extends ValidationError {
    cep;
    reason;
    constructor(cep, reason, detalhe) {
        const reasonText = {
            format: 'formato inválido (esperado 8 dígitos sem máscara)',
            not_found: 'não encontrado nos Correios',
            api_unavailable: 'API de consulta indisponível',
        }[reason];
        super(`CEP "${cep}" ${reasonText}${detalhe ? `: ${detalhe}` : ''}`);
        this.cep = cep;
        this.reason = reason;
    }
}
export class InvalidChaveAcessoError extends ValidationError {
    value;
    constructor(value, options) {
        super(`Chave de acesso inválida: "${value}". Deve conter exatamente 50 dígitos numéricos.`, options);
        this.value = value;
    }
}
export class InvalidDpsIdError extends ValidationError {
    value;
    constructor(value, options) {
        super(`Id do DPS inválido: "${value}". Deve bater com o pattern "DPS" + 42 dígitos (TSIdDPS do RTC v1.01).`, options);
        this.value = value;
    }
}
export class InvalidXmlError extends ValidationError {
    constructor(detalhe, options) {
        super(`XML inválido: ${detalhe}`, options);
    }
}
/**
 * Violação de regra de negócio local. Usado para regras que o lib verifica
 * antes de ir para a rede — tipicamente regras enumeradas no Manual do
 * Contribuinte / Anexo I (e.g. E0078: cMotivo=99 exige xMotivo) que evitamos
 * disparar um round-trip inútil + queima de `nDPS`.
 */
export class RuleViolationError extends ValidationError {
    rule;
    constructor(message, rule) {
        super(message);
        this.rule = rule;
    }
}
/**
 * Lançado quando um XML falha validação XSD contra a RTC v1.01. Carrega a
 * lista completa de violações detectadas pelo xmllint — útil para mostrar
 * todos os erros de uma vez em vez de só o primeiro.
 */
export class XsdValidationError extends ValidationError {
    violations;
    constructor(violations, options) {
        const first = violations[0];
        const extras = violations.length - 1;
        const sufixo = extras > 0 ? ` (+${extras} violação${extras > 1 ? 'ões' : ''})` : '';
        const base = first ? first.message : 'violação desconhecida';
        super(`Validação XSD falhou: ${base}${sufixo}`, options);
        this.violations = violations;
    }
}
//# sourceMappingURL=validation.js.map