import { OpenNfseError } from './base.js';
export declare abstract class CertificateError extends OpenNfseError {
}
export declare class ExpiredCertificateError extends CertificateError {
    readonly expiredOn: Date;
    constructor(expiredOn: Date, options?: {
        cause?: unknown;
    });
}
export declare class InvalidCertificateError extends CertificateError {
    constructor(detalhe: string, options?: {
        cause?: unknown;
    });
}
export declare class InvalidCertificatePasswordError extends CertificateError {
    constructor(options?: {
        cause?: unknown;
    });
}
//# sourceMappingURL=certificate.d.ts.map