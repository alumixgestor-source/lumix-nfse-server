import forge from 'node-forge';
import { ExpiredCertificateError, InvalidCertificateError, InvalidCertificatePasswordError, } from '../errors/certificate.js';
const OID_PKCS8_SHROUDED = forge.pki.oids.pkcs8ShroudedKeyBag;
const OID_KEY_BAG = forge.pki.oids.keyBag;
const OID_CERT_BAG = forge.pki.oids.certBag;
export function parsePfx(pfx, password) {
    const asn1 = parseAsn1(pfx);
    const p12 = parsePkcs12(asn1, password);
    const key = extractPrivateKey(p12);
    const cert = extractCertificate(p12);
    const issuedOn = cert.validity.notBefore;
    const expiresOn = cert.validity.notAfter;
    if (expiresOn.getTime() < Date.now()) {
        throw new ExpiredCertificateError(expiresOn);
    }
    const cnField = cert.subject.getField('CN');
    const subject = cnField?.value ?? '';
    return {
        keyPem: forge.pki.privateKeyToPem(key),
        certPem: forge.pki.certificateToPem(cert),
        issuedOn,
        expiresOn,
        subject,
    };
}
function parseAsn1(pfx) {
    try {
        return forge.asn1.fromDer(pfx.toString('binary'));
    }
    catch (cause) {
        throw new InvalidCertificateError('arquivo .pfx corrompido ou não é DER válido', { cause });
    }
}
function parsePkcs12(asn1, password) {
    try {
        return forge.pkcs12.pkcs12FromAsn1(asn1, password);
    }
    catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        if (/mac|password|integrity/i.test(message)) {
            throw new InvalidCertificatePasswordError({ cause });
        }
        throw new InvalidCertificateError(message, { cause });
    }
}
function extractPrivateKey(p12) {
    for (const bagType of [OID_PKCS8_SHROUDED, OID_KEY_BAG]) {
        const bags = p12.getBags({ bagType })[bagType];
        const bag = bags?.[0];
        if (bag?.key)
            return bag.key;
    }
    throw new InvalidCertificateError('chave privada não encontrada no .pfx');
}
function extractCertificate(p12) {
    const bags = p12.getBags({ bagType: OID_CERT_BAG })[OID_CERT_BAG];
    const bag = bags?.[0];
    if (!bag?.cert) {
        throw new InvalidCertificateError('certificado não encontrado no .pfx');
    }
    return bag.cert;
}
//# sourceMappingURL=parse.js.map