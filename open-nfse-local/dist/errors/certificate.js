import { OpenNfseError } from './base.js';
export class CertificateError extends OpenNfseError {
}
export class ExpiredCertificateError extends CertificateError {
    expiredOn;
    constructor(expiredOn, options) {
        super(`Certificado A1 expirou em ${expiredOn.toISOString()}. Renove no ICP-Brasil.`, options);
        this.expiredOn = expiredOn;
    }
}
export class InvalidCertificateError extends CertificateError {
    constructor(detalhe, options) {
        super(`Certificado A1 inválido: ${detalhe}`, options);
    }
}
export class InvalidCertificatePasswordError extends CertificateError {
    constructor(options) {
        super('Senha do certificado A1 incorreta.', options);
    }
}
//# sourceMappingURL=certificate.js.map