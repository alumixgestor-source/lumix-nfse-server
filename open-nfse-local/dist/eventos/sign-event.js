import { signXmlElement } from '../xml/sign.js';
/**
 * Assina um `<pedRegEvento>` per RTC v1.01 — mesmas regras da DPS:
 * RSA-SHA256 + exc-c14n + enveloped-signature, Reference URI = `#<infPedReg.Id>`.
 */
export function signPedRegEventoXml(xml, certificate) {
    return signXmlElement(xml, certificate, {
        rootElementName: 'pedRegEvento',
        signedElementName: 'infPedReg',
    });
}
//# sourceMappingURL=sign-event.js.map