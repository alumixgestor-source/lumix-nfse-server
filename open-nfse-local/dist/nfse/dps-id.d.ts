import { ValidationError } from '../errors/validation.js';
export type TipoInscricaoEmitente = 'CNPJ' | 'CPF';
export interface BuildDpsIdParams {
    /** Código IBGE do município emissor (7 dígitos). */
    readonly cLocEmi: string;
    /** Tipo de inscrição federal do emitente. */
    readonly tipoInsc: TipoInscricaoEmitente;
    /** CNPJ (14 dígitos) ou CPF (11 dígitos). Sem máscara; zeros à esquerda preservados. */
    readonly inscricaoFederal: string;
    /** Série do DPS (1 a 5 dígitos). */
    readonly serie: string;
    /** Número do DPS (1 a 15 dígitos). */
    readonly nDPS: string;
}
export declare class InvalidDpsIdParamError extends ValidationError {
    readonly field: keyof BuildDpsIdParams;
    readonly value: string;
    constructor(field: keyof BuildDpsIdParams, value: string, detail: string);
}
export declare function buildDpsId(params: BuildDpsIdParams): string;
//# sourceMappingURL=dps-id.d.ts.map