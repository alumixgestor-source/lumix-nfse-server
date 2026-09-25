import { request } from 'undici';
import { InvalidCepError } from '../errors/validation.js';
const CEP_REGEX = /^\d{8}$/;
const DEFAULT_ENDPOINT = 'https://viacep.com.br/ws';
const DEFAULT_TIMEOUT_MS = 5_000;
/**
 * Validador de CEP baseado no [ViaCEP](https://viacep.com.br/) — gratuito, sem
 * chave, usado como default pela lib. Cacheia resultados em memória por
 * instância (passe `cache` custom para compartilhar entre validadores).
 */
export function createViaCepValidator(options = {}) {
    const endpoint = (options.endpoint ?? DEFAULT_ENDPOINT).replace(/\/$/, '');
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const dispatcher = options.dispatcher;
    const cache = options.cache ?? new Map();
    return {
        async validate(cep) {
            const normalized = normalize(cep);
            const cached = cache.get(normalized);
            if (cached)
                return cached;
            const url = `${endpoint}/${normalized}/json/`;
            let response;
            try {
                response = await request(url, {
                    method: 'GET',
                    bodyTimeout: timeoutMs,
                    headersTimeout: timeoutMs,
                    ...(dispatcher !== undefined ? { dispatcher } : {}),
                });
            }
            catch (cause) {
                const message = cause instanceof Error ? cause.message : String(cause);
                throw new InvalidCepError(normalized, 'api_unavailable', message);
            }
            // ViaCEP devolve 400 para CEPs malformados (improvável aqui — já filtramos
            // pelo regex) e 200 para válidos e "não encontrados". Tratamos 5xx como
            // indisponibilidade.
            if (response.statusCode === 400) {
                await response.body.dump();
                throw new InvalidCepError(normalized, 'format');
            }
            if (response.statusCode >= 500) {
                await response.body.dump();
                throw new InvalidCepError(normalized, 'api_unavailable', `ViaCEP respondeu HTTP ${response.statusCode}`);
            }
            if (response.statusCode !== 200) {
                await response.body.dump();
                throw new InvalidCepError(normalized, 'api_unavailable', `ViaCEP respondeu HTTP ${response.statusCode}`);
            }
            const bodyText = await response.body.text();
            let parsed;
            try {
                parsed = JSON.parse(bodyText);
            }
            catch (cause) {
                throw new InvalidCepError(normalized, 'api_unavailable', `resposta ViaCEP não é JSON: ${bodyText.slice(0, 120)}`);
            }
            if ('erro' in parsed && parsed.erro) {
                throw new InvalidCepError(normalized, 'not_found');
            }
            const info = toInfo(normalized, parsed);
            cache.set(normalized, info);
            return info;
        },
    };
}
function normalize(cep) {
    const stripped = cep.replace(/\D/g, '');
    if (!CEP_REGEX.test(stripped)) {
        throw new InvalidCepError(cep, 'format');
    }
    return stripped;
}
function toInfo(cep, raw) {
    return {
        cep,
        ...(raw.logradouro ? { logradouro: raw.logradouro } : {}),
        ...(raw.bairro ? { bairro: raw.bairro } : {}),
        ...(raw.localidade ? { localidade: raw.localidade } : {}),
        ...(raw.uf ? { uf: raw.uf } : {}),
        ...(raw.ibge ? { ibge: raw.ibge } : {}),
    };
}
//# sourceMappingURL=viacep.js.map