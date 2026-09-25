import { XsdValidationError } from '../errors/validation.js';
import { RTC_V1_01_SCHEMAS } from './_rtc-schemas.generated.js';
const DPS_SCHEMA_FILE = 'DPS_v1.01.xsd';
const PED_REG_EVENTO_SCHEMA_FILE = 'pedRegEvento_v1.01.xsd';
const EVENTO_SCHEMA_FILE = 'evento_v1.01.xsd';
export async function validateDpsXml(xml, options) {
    return validateAgainst(xml, DPS_SCHEMA_FILE, 'dps.xml', options);
}
export async function validatePedRegEventoXml(xml, options) {
    return validateAgainst(xml, PED_REG_EVENTO_SCHEMA_FILE, 'pedRegEvento.xml', options);
}
export async function validateEventoXml(xml, options) {
    return validateAgainst(xml, EVENTO_SCHEMA_FILE, 'evento.xml', options);
}
async function validateAgainst(xml, mainSchemaFile, xmlLabel, options) {
    const throwOnInvalid = options?.throwOnInvalid ?? true;
    const result = await runValidation(xml, mainSchemaFile, xmlLabel);
    if (result.valid) {
        return throwOnInvalid ? undefined : result;
    }
    if (throwOnInvalid) {
        throw new XsdValidationError(result.violations);
    }
    return result;
}
async function runValidation(xml, mainSchemaFile, xmlLabel) {
    const { validateXML } = await import('xmllint-wasm');
    const main = RTC_V1_01_SCHEMAS.find((s) => s.fileName === mainSchemaFile);
    if (!main) {
        throw new Error(`schema principal ${mainSchemaFile} ausente nos bundled XSDs.`);
    }
    const preload = RTC_V1_01_SCHEMAS.filter((s) => s.fileName !== mainSchemaFile).map((s) => ({
        fileName: s.fileName,
        contents: s.contents,
    }));
    const out = await validateXML({
        xml: [{ fileName: xmlLabel, contents: xml }],
        schema: [{ fileName: main.fileName, contents: main.contents }],
        preload,
    });
    const violations = (out.errors ?? []).map((e) => {
        const line = typeof e.loc?.lineNumber === 'number' ? e.loc.lineNumber : undefined;
        return line !== undefined
            ? { message: e.message ?? e.rawMessage ?? 'violação desconhecida', line }
            : { message: e.message ?? e.rawMessage ?? 'violação desconhecida' };
    });
    return { valid: out.valid, violations };
}
//# sourceMappingURL=validate-xml.js.map