import { readFile } from 'node:fs/promises';
import { parsePfx } from './parse.js';
export function providerFromFile(path, password) {
    let cached;
    return {
        async load() {
            if (!cached) {
                const pfx = await readFile(path);
                cached = parsePfx(pfx, password);
            }
            return cached;
        },
    };
}
export function providerFromBuffer(pfx, password) {
    let cached;
    return {
        async load() {
            if (!cached)
                cached = parsePfx(pfx, password);
            return cached;
        },
    };
}
export function normalizeProvider(input) {
    if ('load' in input) {
        return input;
    }
    return providerFromBuffer(input.pfx, input.password);
}
//# sourceMappingURL=provider.js.map