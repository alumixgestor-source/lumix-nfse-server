import type { DPS } from './domain.js';
export interface BuildDpsXmlOptions {
    /** Emit the `<?xml ... ?>` declaration. Default `true`. */
    readonly includeXmlDeclaration?: boolean;
}
/**
 * Serializes a typed `DPS` DTO to canonical XML. Inverse of `parseNfseXml`'s
 * DPS branch. Element order and namespace declarations follow RTC v1.01.
 */
export declare function buildDpsXml(dps: DPS, options?: BuildDpsXmlOptions): string;
//# sourceMappingURL=build-xml.d.ts.map