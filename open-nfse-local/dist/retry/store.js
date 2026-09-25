import { ValidationError } from '../errors/validation.js';
export class MissingRetryStoreError extends ValidationError {
    constructor() {
        super('Falha transiente (rede, timeout, 429, 5xx) detectada mas nenhum RetryStore foi configurado — ' +
            'passe `retryStore` no NfseClient config (ou direto no método de evento) para que a lib possa persistir o pendente e retentá-lo via replayPendingEvents().');
    }
}
/** Store em memória — testes e demos. Não sobrevive restart. */
export function createInMemoryRetryStore() {
    const map = new Map();
    return {
        async save(entry) {
            map.set(entry.id, entry);
        },
        async list() {
            return Array.from(map.values());
        },
        async delete(id) {
            map.delete(id);
        },
    };
}
/**
 * Id estável para evento (cancelamento/substituição). Inclui `kind` para
 * que operações distintas sobre a **mesma** NFS-e e tipo de evento não
 * colidam no store: um cancelamento manual (`cancelamento_simples`) e um
 * rollback automático de substituição (`rollback_cancelamento`) compartilham
 * `chaveNfse` + `tipoEvento` `101101`, mas carregam XML assinado / `xMotivo`
 * distintos. Sem o `kind` na chave, o `save` (last-writer-wins) descartaria
 * silenciosamente um dos dois e o replay só veria o sobrevivente.
 *
 * Observação: a SEFIN deduplica server-side por `(chave, tipoEvento)` (Anexo
 * II SEFIN_ADN v1.00-20251226, sem `nPedRegEvento`); a chave do store é
 * intencionalmente mais granular para preservar ambos os pendentes locais.
 */
export function pendingEventId(chaveNfse, tipoEvento, kind) {
    return `${chaveNfse}:${tipoEvento}:${kind}`;
}
/** Id estável para emissão. O `idDps` já é único por natureza. */
export function pendingEmissionId(idDps) {
    return `emission:${idDps}`;
}
// Type guards para discriminar em replay.
export function isPendingEmission(p) {
    return p.kind === 'emission';
}
export function isPendingEventoCancelamento(p) {
    return p.kind !== 'emission';
}
//# sourceMappingURL=store.js.map