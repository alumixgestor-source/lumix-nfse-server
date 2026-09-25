import { ValidationError } from '../errors/validation.js';
/**
 * Counter em memória, para testes e demos. Não persiste entre restarts.
 * Produção implementa a interface contra seu banco.
 */
export function createInMemoryDpsCounter(initial = 1) {
    const map = new Map();
    const key = (s) => `${s.emitenteCnpj}:${s.serie}`;
    return {
        async next(scope) {
            const k = key(scope);
            const current = map.get(k) ?? initial;
            map.set(k, current + 1);
            return String(current);
        },
    };
}
export class MissingDpsCounterError extends ValidationError {
    constructor() {
        super('emitir() precisa de um DpsCounter configurado — pass dpsCounter no NfseClient ' +
            'ou passe `nDPS` explícito em EmitirParams para pular o counter. ' +
            'Para emitir uma DPS já montada manualmente, use emitirDpsPronta(dps).');
    }
}
//# sourceMappingURL=dps-counter.js.map