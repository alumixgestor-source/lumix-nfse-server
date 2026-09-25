import { ValidationError } from '../errors/validation.js';
export class InvalidEventoPedidoIdParamError extends ValidationError {
    field;
    value;
    constructor(field, value, detail) {
        super(`Parâmetro inválido para ID do pedido de evento (${field}="${value}"): ${detail}`);
        this.field = field;
        this.value = value;
    }
}
const REGEX_CHAVE = /^\d{50}$/;
const REGEX_TIPO_EVENTO = /^\d{6}$/;
export function buildEventoPedidoId(params) {
    const { chaveAcesso, tipoEvento } = params;
    if (!REGEX_CHAVE.test(chaveAcesso)) {
        throw new InvalidEventoPedidoIdParamError('chaveAcesso', chaveAcesso, 'deve conter exatamente 50 dígitos.');
    }
    if (!REGEX_TIPO_EVENTO.test(tipoEvento)) {
        throw new InvalidEventoPedidoIdParamError('tipoEvento', tipoEvento, 'deve conter exatamente 6 dígitos.');
    }
    return `PRE${chaveAcesso}${tipoEvento}`;
}
//# sourceMappingURL=event-id.js.map