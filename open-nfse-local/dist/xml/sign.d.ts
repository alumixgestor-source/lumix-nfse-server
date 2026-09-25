import type { A1Certificate } from '../certificate/types.js';
import { ValidationError } from '../errors/validation.js';
export declare class XmlAlreadySignedError extends ValidationError {
    constructor(rootName: string);
}
export interface SignXmlElementParams {
    /** Nome do elemento raiz (wrapper). Ex.: `DPS`, `pedRegEvento`. */
    readonly rootElementName: string;
    /** Nome do elemento com atributo `Id` cujo subtree será assinado. Ex.: `infDPS`, `infPedReg`. */
    readonly signedElementName: string;
}
/**
 * Assina um XML per RTC v1.01 / NFS-e:
 *  - RSA-SHA256 + exc-c14n + enveloped-signature + SHA-256 digest
 *  - Reference URI = `#<signedElementName Id>`
 *  - KeyInfo com `<X509Certificate>`
 *  - `<Signature>` adicionado como último filho de `<rootElementName>`
 */
export declare function signXmlElement(xml: string, certificate: A1Certificate, params: SignXmlElementParams): string;
//# sourceMappingURL=sign.d.ts.map