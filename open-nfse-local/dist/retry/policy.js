import { HttpStatusError, ServerError, TooManyRequestsError } from '../errors/http.js';
const DEFAULT_RETRY_AFTER_MS = 60_000;
const DEFAULT_MAX_RETRY_AFTER_MS = 3_600_000;
export function createDefaultRetryPolicy(options) {
    const defaultMs = options?.defaultRetryAfterMs ?? DEFAULT_RETRY_AFTER_MS;
    const maxMs = options?.maxRetryAfterMs ?? DEFAULT_MAX_RETRY_AFTER_MS;
    return {
        computeNotBefore(err, now, _context) {
            // _context é ignorado pela default — a default não faz backoff baseado
            // em tentativas, só respeita Retry-After. Policies customizadas usam.
            if (err instanceof HttpStatusError) {
                const headerMs = err.getRetryAfterMs();
                if (headerMs !== undefined) {
                    const clamped = Math.min(Math.max(0, headerMs), maxMs);
                    return new Date(now.getTime() + clamped);
                }
                if (isBackoffStatus(err)) {
                    return new Date(now.getTime() + Math.min(defaultMs, maxMs));
                }
            }
            return undefined;
        },
    };
}
function isBackoffStatus(err) {
    return err instanceof TooManyRequestsError || (err instanceof ServerError && err.status === 503);
}
/**
 * Wraps a `RetryPolicy` so that exceptions thrown by `computeNotBefore`
 * are caught, logged, and converted to a `undefined` notBefore. Internal
 * to the lib — every `NfseClient` wraps the configured (or default)
 * policy with this in its constructor, so a buggy custom policy can't
 * mask the original fiscal error.
 *
 * @internal
 */
export function makeSafePolicy(inner, logger) {
    return {
        computeNotBefore(err, now, context) {
            try {
                return inner.computeNotBefore(err, now, context);
            }
            catch (policyErr) {
                // Defesa também contra logger que joga (logger é injetado pelo
                // consumidor — se for buggy, NÃO queremos que o throw escape
                // daqui e mascare o erro original. O ponto de makeSafePolicy é
                // ser à prova de bala.).
                try {
                    logger.warn('retryPolicy.computeNotBefore threw — caindo para notBefore=undefined', {
                        policyError: policyErr instanceof Error ? policyErr.message : String(policyErr),
                        policyErrorName: policyErr instanceof Error ? policyErr.name : 'unknown',
                        originalError: err.message,
                        originalErrorName: err.name,
                    });
                }
                catch {
                    /* logger threw — silently swallow; not much else we can do */
                }
                return undefined;
            }
        },
    };
}
//# sourceMappingURL=policy.js.map