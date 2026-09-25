import type { A1Certificate } from '../certificate/types.js';
import { ValidationError } from '../errors/validation.js';
/**
 * Kept for back-compat: existing callers expect `DpsAlreadySignedError`.
 * The generic signer throws `XmlAlreadySignedError`; we translate.
 */
export declare class DpsAlreadySignedError extends ValidationError {
    constructor();
}
/**
 * Assina uma DPS per RTC v1.01 (thin wrapper sobre `signXmlElement`).
 * RSA-SHA256 + exc-c14n + enveloped-signature; Reference URI = `#<infDPS.Id>`.
 */
export declare function signDpsXml(dpsXml: string, certificate: A1Certificate): string;
//# sourceMappingURL=sign-xml.d.ts.map