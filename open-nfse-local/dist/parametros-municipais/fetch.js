import { DEFAULT_TTL_MS } from './cache.js';
import { parseAliquotasResult, parseBeneficioResult, parseConvenioResult, parseRegimesEspeciaisResult, parseRetencoesResult, } from './parse.js';
/** Aceita 400/404 com body (ADN devolve payload com `mensagem` em vez de erro HTTP). */
const ACCEPTED_STATUSES = [400, 404];
/**
 * Formata `competencia` para o path do ADN.
 * Aceita Date ou string — se string, pass-through; se Date, usa ISO completo.
 * O ADN aceita tanto `AAAA-MM-DD` quanto `AAAA-MM-DDTHH:MM:SS`.
 */
function formatCompetencia(competencia) {
    if (typeof competencia === 'string')
        return competencia;
    return competencia.toISOString().slice(0, 10); // YYYY-MM-DD
}
function cacheKey(op, ...parts) {
    return `parametros:${op}:${parts.join(':')}`;
}
// ---------------------------------------------------------------------------
// GET /{codigoMunicipio}/{codigoServico}/{competencia}/aliquota
// ---------------------------------------------------------------------------
export async function fetchAliquota(httpClient, codigoMunicipio, codigoServico, competencia, cache, options) {
    const comp = formatCompetencia(competencia);
    const key = cacheKey('aliquota', codigoMunicipio, codigoServico, comp);
    const useCache = options?.useCache !== false;
    const effectiveCache = options?.cache ?? cache;
    if (useCache && effectiveCache) {
        const hit = await effectiveCache.get(key);
        if (hit)
            return hit;
    }
    const raw = await httpClient.get(`/${encodeURIComponent(codigoMunicipio)}/${encodeURIComponent(codigoServico)}/${encodeURIComponent(comp)}/aliquota`, { acceptedStatuses: [...ACCEPTED_STATUSES] });
    const result = parseAliquotasResult(raw);
    if (useCache && effectiveCache) {
        await effectiveCache.set(key, result, options?.ttlMs ?? DEFAULT_TTL_MS.aliquota);
    }
    return result;
}
// ---------------------------------------------------------------------------
// GET /{codigoMunicipio}/{codigoServico}/historicoaliquotas
// ---------------------------------------------------------------------------
export async function fetchHistoricoAliquotas(httpClient, codigoMunicipio, codigoServico, cache, options) {
    const key = cacheKey('historicoAliquotas', codigoMunicipio, codigoServico);
    const useCache = options?.useCache !== false;
    const effectiveCache = options?.cache ?? cache;
    if (useCache && effectiveCache) {
        const hit = await effectiveCache.get(key);
        if (hit)
            return hit;
    }
    const raw = await httpClient.get(`/${encodeURIComponent(codigoMunicipio)}/${encodeURIComponent(codigoServico)}/historicoaliquotas`, { acceptedStatuses: [...ACCEPTED_STATUSES] });
    const result = parseAliquotasResult(raw);
    if (useCache && effectiveCache) {
        await effectiveCache.set(key, result, options?.ttlMs ?? DEFAULT_TTL_MS.historicoAliquotas);
    }
    return result;
}
// ---------------------------------------------------------------------------
// GET /{codigoMunicipio}/{numeroBeneficio}/{competencia}/beneficio
// ---------------------------------------------------------------------------
export async function fetchBeneficio(httpClient, codigoMunicipio, numeroBeneficio, competencia, cache, options) {
    const comp = formatCompetencia(competencia);
    const key = cacheKey('beneficio', codigoMunicipio, numeroBeneficio, comp);
    const useCache = options?.useCache !== false;
    const effectiveCache = options?.cache ?? cache;
    if (useCache && effectiveCache) {
        const hit = await effectiveCache.get(key);
        if (hit)
            return hit;
    }
    const raw = await httpClient.get(`/${encodeURIComponent(codigoMunicipio)}/${encodeURIComponent(numeroBeneficio)}/${encodeURIComponent(comp)}/beneficio`, { acceptedStatuses: [...ACCEPTED_STATUSES] });
    const result = parseBeneficioResult(raw);
    if (useCache && effectiveCache) {
        await effectiveCache.set(key, result, options?.ttlMs ?? DEFAULT_TTL_MS.beneficio);
    }
    return result;
}
// ---------------------------------------------------------------------------
// GET /{codigoMunicipio}/convenio
// ---------------------------------------------------------------------------
export async function fetchConvenio(httpClient, codigoMunicipio, cache, options) {
    const key = cacheKey('convenio', codigoMunicipio);
    const useCache = options?.useCache !== false;
    const effectiveCache = options?.cache ?? cache;
    if (useCache && effectiveCache) {
        const hit = await effectiveCache.get(key);
        if (hit)
            return hit;
    }
    const raw = await httpClient.get(`/${encodeURIComponent(codigoMunicipio)}/convenio`, { acceptedStatuses: [...ACCEPTED_STATUSES] });
    const result = parseConvenioResult(raw);
    if (useCache && effectiveCache) {
        await effectiveCache.set(key, result, options?.ttlMs ?? DEFAULT_TTL_MS.convenio);
    }
    return result;
}
// ---------------------------------------------------------------------------
// GET /{codigoMunicipio}/{codigoServico}/{competencia}/regimes_especiais
// ---------------------------------------------------------------------------
export async function fetchRegimesEspeciais(httpClient, codigoMunicipio, codigoServico, competencia, cache, options) {
    const comp = formatCompetencia(competencia);
    const key = cacheKey('regimesEspeciais', codigoMunicipio, codigoServico, comp);
    const useCache = options?.useCache !== false;
    const effectiveCache = options?.cache ?? cache;
    if (useCache && effectiveCache) {
        const hit = await effectiveCache.get(key);
        if (hit)
            return hit;
    }
    const raw = await httpClient.get(`/${encodeURIComponent(codigoMunicipio)}/${encodeURIComponent(codigoServico)}/${encodeURIComponent(comp)}/regimes_especiais`, { acceptedStatuses: [...ACCEPTED_STATUSES] });
    const result = parseRegimesEspeciaisResult(raw);
    if (useCache && effectiveCache) {
        await effectiveCache.set(key, result, options?.ttlMs ?? DEFAULT_TTL_MS.regimesEspeciais);
    }
    return result;
}
// ---------------------------------------------------------------------------
// GET /{codigoMunicipio}/{competencia}/retencoes
// ---------------------------------------------------------------------------
export async function fetchRetencoes(httpClient, codigoMunicipio, competencia, cache, options) {
    const comp = formatCompetencia(competencia);
    const key = cacheKey('retencoes', codigoMunicipio, comp);
    const useCache = options?.useCache !== false;
    const effectiveCache = options?.cache ?? cache;
    if (useCache && effectiveCache) {
        const hit = await effectiveCache.get(key);
        if (hit)
            return hit;
    }
    const raw = await httpClient.get(`/${encodeURIComponent(codigoMunicipio)}/${encodeURIComponent(comp)}/retencoes`, { acceptedStatuses: [...ACCEPTED_STATUSES] });
    const result = parseRetencoesResult(raw);
    if (useCache && effectiveCache) {
        await effectiveCache.set(key, result, options?.ttlMs ?? DEFAULT_TTL_MS.retencoes);
    }
    return result;
}
//# sourceMappingURL=fetch.js.map