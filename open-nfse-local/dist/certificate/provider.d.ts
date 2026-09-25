import type { Buffer } from 'node:buffer';
import type { CertificateInput, CertificateProvider } from './types.js';
export declare function providerFromFile(path: string, password: string): CertificateProvider;
export declare function providerFromBuffer(pfx: Buffer, password: string): CertificateProvider;
export declare function normalizeProvider(input: CertificateInput): CertificateProvider;
//# sourceMappingURL=provider.d.ts.map