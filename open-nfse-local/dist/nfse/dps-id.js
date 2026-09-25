import { ValidationError } from '../errors/validation.js';
export class InvalidDpsIdParamError extends ValidationError {
    field;
    value;
    constructor(field, value, detail) {
        super(`Parâmetro inválido para ID do DPS (${field}="${value}"): ${detail}`);
        this.field = field;
        this.value = value;
    }
}
const REGEX_COD_MUN = /^\d{7}$/;
const REGEX_CNPJ = /^\d{14}$/;
const REGEX_CPF = /^\d{11}$/;
const REGEX_SERIE = /^\d{1,5}$/;
// TSNumDPS: primeiro dígito 1-9 (sem zero à esquerda), 1 a 15 dígitos. O <nDPS>
// emitido no XML segue esse pattern; o Id usa padStart e tolera zeros.
const REGEX_NDPS = /^[1-9]\d{0,14}$/;
export function buildDpsId(params) {
    const { cLocEmi, tipoInsc, inscricaoFederal, serie, nDPS } = params;
    if (!REGEX_COD_MUN.test(cLocEmi)) {
        throw new InvalidDpsIdParamError('cLocEmi', cLocEmi, 'deve conter exatamente 7 dígitos.');
    }
    let inscFormatted;
    let digitoTipo;
    if (tipoInsc === 'CNPJ') {
        if (!REGEX_CNPJ.test(inscricaoFederal)) {
            throw new InvalidDpsIdParamError('inscricaoFederal', inscricaoFederal, 'CNPJ deve conter 14 dígitos.');
        }
        digitoTipo = '2';
        inscFormatted = inscricaoFederal;
    }
    else {
        if (!REGEX_CPF.test(inscricaoFederal)) {
            throw new InvalidDpsIdParamError('inscricaoFederal', inscricaoFederal, 'CPF deve conter 11 dígitos.');
        }
        digitoTipo = '1';
        inscFormatted = inscricaoFederal.padStart(14, '0');
    }
    if (!REGEX_SERIE.test(serie)) {
        throw new InvalidDpsIdParamError('serie', serie, 'deve conter 1 a 5 dígitos.');
    }
    if (!REGEX_NDPS.test(nDPS)) {
        throw new InvalidDpsIdParamError('nDPS', nDPS, 'deve conter 1 a 15 dígitos, sem zero à esquerda.');
    }
    return `DPS${cLocEmi}${digitoTipo}${inscFormatted}${serie.padStart(5, '0')}${nDPS.padStart(15, '0')}`;
}
//# sourceMappingURL=dps-id.js.map