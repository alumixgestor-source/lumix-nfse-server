import type { A1Certificate } from '../certificate/types.js';
/**
 * Assina um `<pedRegEvento>` per RTC v1.01 — mesmas regras da DPS:
 * RSA-SHA256 + exc-c14n + enveloped-signature, Reference URI = `#<infPedReg.Id>`.
 */
export declare function signPedRegEventoXml(xml: string, certificate: A1Certificate): string;
//# sourceMappingURL=sign-event.d.ts.map