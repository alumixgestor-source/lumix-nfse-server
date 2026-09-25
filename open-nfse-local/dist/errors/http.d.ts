import { OpenNfseError } from './base.js';
export declare abstract class HttpError extends OpenNfseError {
}
export declare class NetworkError extends HttpError {
    constructor(detalhe: string, options?: {
        cause?: unknown;
    });
}
export declare class TimeoutError extends HttpError {
    readonly timeoutMs: number;
    constructor(timeoutMs: number, options?: {
        cause?: unknown;
    });
}
export interface HttpStatusErrorOptions {
    readonly cause?: unknown;
    readonly headers?: Record<string, string>;
}
export declare class HttpStatusError extends HttpError {
    readonly status: number;
    readonly body: string | undefined;
    readonly headers: Readonly<Record<string, string>>;
    constructor(status: number, body: string | undefined, options?: HttpStatusErrorOptions);
    /**
     * Parse `Retry-After` per RFC 7231 §7.1.3, returning the delay in
     * milliseconds (or `undefined` when missing/malformed/signed).
     *
     * Strict RFC delta-seconds is non-negative integer only, but the
     * parser is intentionally lenient on one real-world deviation:
     * decimal seconds (`12.5`) — some servers send fractional values;
     * we round up to whole seconds via `Math.ceil` (`12.5` → `13s`).
     *
     * HTTP-date values in the past return `0` (ready immediately).
     *
     * Explicitly rejects any leading sign (`-5`, `+60`) before falling
     * through to numeric / date branches. `Date.parse('-5')` returns `0`
     * on V8, which would silently route to the past-date branch and
     * yield a `0ms` delay — wrong.
     */
    getRetryAfterMs(): number | undefined;
}
export declare class UnauthorizedError extends HttpStatusError {
    constructor(body: string | undefined, options?: HttpStatusErrorOptions);
}
export declare class ForbiddenError extends HttpStatusError {
    constructor(body: string | undefined, options?: HttpStatusErrorOptions);
}
export declare class NotFoundError extends HttpStatusError {
    constructor(body: string | undefined, options?: HttpStatusErrorOptions);
}
export declare class ServerError extends HttpStatusError {
    constructor(status: number, body: string | undefined, options?: HttpStatusErrorOptions);
}
export declare class TooManyRequestsError extends HttpStatusError {
    constructor(body: string | undefined, options?: HttpStatusErrorOptions);
}
//# sourceMappingURL=http.d.ts.map