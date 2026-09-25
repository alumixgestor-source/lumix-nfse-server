export function createInMemoryParametrosCache() {
    const map = new Map();
    return {
        async get(key) {
            const entry = map.get(key);
            if (!entry)
                return undefined;
            if (entry.expiresAt < Date.now()) {
                map.delete(key);
                return undefined;
            }
            return entry.value;
        },
        async set(key, value, ttlMs) {
            map.set(key, { value, expiresAt: Date.now() + ttlMs });
        },
    };
}
/** TTLs defaults, em milissegundos. */
export const DEFAULT_TTL_MS = {
    aliquota: 6 * 60 * 60 * 1_000, // 6h
    historicoAliquotas: 24 * 60 * 60 * 1_000, // 24h — histórico não muda
    beneficio: 60 * 60 * 1_000, // 1h
    convenio: 24 * 60 * 60 * 1_000, // 24h
    regimesEspeciais: 12 * 60 * 60 * 1_000, // 12h
    retencoes: 12 * 60 * 60 * 1_000, // 12h
};
//# sourceMappingURL=cache.js.map