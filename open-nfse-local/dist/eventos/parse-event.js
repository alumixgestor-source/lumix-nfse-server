import { InvalidXmlError } from '../errors/validation.js';
import { ATTR_PREFIX, parseXml } from '../xml/parser.js';
export function parseEventoXml(xml) {
    let tree;
    try {
        tree = parseXml(xml);
    }
    catch (cause) {
        throw new InvalidXmlError('falha ao parsear XML do evento', { cause });
    }
    const root = tree.evento;
    if (!isObject(root)) {
        throw new InvalidXmlError('elemento raiz <evento> ausente');
    }
    return parseEvento(root);
}
function parseEvento(node) {
    return {
        versao: requireAttr(node, 'versao'),
        infEvento: parseInfEvento(requireChild(node, 'infEvento')),
        signature: parseSignature(requireChild(node, 'Signature')),
    };
}
function parseInfEvento(node) {
    return {
        Id: requireAttr(node, 'Id'),
        verAplic: requireText(node, 'verAplic'),
        ambGer: requireText(node, 'ambGer'),
        nSeqEvento: requireText(node, 'nSeqEvento'),
        dhProc: coerceDate(requireText(node, 'dhProc')),
        nDFSe: requireText(node, 'nDFSe'),
        pedRegEvento: parsePedRegEvento(requireChild(node, 'pedRegEvento')),
    };
}
function parsePedRegEvento(node) {
    const sig = optionalChild(node, 'Signature');
    return {
        versao: requireAttr(node, 'versao'),
        infPedReg: parseInfPedReg(requireChild(node, 'infPedReg')),
        ...optionalAssign('signature', sig ? parseSignature(sig) : undefined),
    };
}
function parseInfPedReg(node) {
    const autor = parseAutor(node);
    const { tipoEvento, detalhe } = parseDetalhe(node);
    return {
        Id: requireAttr(node, 'Id'),
        tpAmb: requireText(node, 'tpAmb'),
        verAplic: requireText(node, 'verAplic'),
        dhEvento: coerceDate(requireText(node, 'dhEvento')),
        autor,
        chNFSe: requireText(node, 'chNFSe'),
        tipoEvento,
        detalhe,
    };
}
function parseAutor(node) {
    const cnpj = optionalText(node, 'CNPJAutor');
    if (cnpj !== undefined)
        return { CNPJAutor: cnpj };
    const cpf = optionalText(node, 'CPFAutor');
    if (cpf !== undefined)
        return { CPFAutor: cpf };
    throw new InvalidXmlError('autor do evento ausente (CNPJAutor/CPFAutor)');
}
function parseDetalhe(node) {
    // Tentativa em ordem dos tipos conhecidos — o XSD garante que só um está
    // presente (xs:choice). Ao encontrar, parse com o shape tipado.
    const e101101 = optionalChild(node, 'e101101');
    if (e101101) {
        return {
            tipoEvento: '101101',
            detalhe: {
                e101101: {
                    xDesc: requireText(e101101, 'xDesc'),
                    cMotivo: requireText(e101101, 'cMotivo'),
                    xMotivo: requireText(e101101, 'xMotivo'),
                },
            },
        };
    }
    const e105102 = optionalChild(node, 'e105102');
    if (e105102) {
        const xMotivo = optionalText(e105102, 'xMotivo');
        return {
            tipoEvento: '105102',
            detalhe: {
                e105102: {
                    xDesc: requireText(e105102, 'xDesc'),
                    cMotivo: requireText(e105102, 'cMotivo'),
                    ...(xMotivo !== undefined ? { xMotivo } : {}),
                    chSubstituta: requireText(e105102, 'chSubstituta'),
                },
            },
        };
    }
    const e101103 = optionalChild(node, 'e101103');
    if (e101103) {
        return {
            tipoEvento: '101103',
            detalhe: {
                e101103: {
                    xDesc: requireText(e101103, 'xDesc'),
                    cMotivo: requireText(e101103, 'cMotivo'),
                    xMotivo: requireText(e101103, 'xMotivo'),
                },
            },
        };
    }
    const e105104 = optionalChild(node, 'e105104');
    if (e105104) {
        const nProcAdm = optionalText(e105104, 'nProcAdm');
        return {
            tipoEvento: '105104',
            detalhe: {
                e105104: {
                    xDesc: requireText(e105104, 'xDesc'),
                    CPFAgTrib: requireText(e105104, 'CPFAgTrib'),
                    ...(nProcAdm !== undefined ? { nProcAdm } : {}),
                    cMotivo: requireText(e105104, 'cMotivo'),
                    xMotivo: requireText(e105104, 'xMotivo'),
                },
            },
        };
    }
    const e105105 = optionalChild(node, 'e105105');
    if (e105105) {
        const nProcAdm = optionalText(e105105, 'nProcAdm');
        return {
            tipoEvento: '105105',
            detalhe: {
                e105105: {
                    xDesc: requireText(e105105, 'xDesc'),
                    CPFAgTrib: requireText(e105105, 'CPFAgTrib'),
                    ...(nProcAdm !== undefined ? { nProcAdm } : {}),
                    cMotivo: requireText(e105105, 'cMotivo'),
                    xMotivo: requireText(e105105, 'xMotivo'),
                },
            },
        };
    }
    // Confirmações — todas têm o mesmo shape (só xDesc).
    for (const [elem, codigo] of [
        ['e202201', '202201'],
        ['e203202', '203202'],
        ['e204203', '204203'],
        ['e205204', '205204'],
    ]) {
        const child = optionalChild(node, elem);
        if (child) {
            return {
                tipoEvento: codigo,
                detalhe: { [elem]: { xDesc: requireText(child, 'xDesc') } },
            };
        }
    }
    // Rejeições P/T/I — xDesc, cMotivo, xMotivo? são filhos diretos (sem infRej).
    for (const [elem, codigo] of [
        ['e202205', '202205'],
        ['e203206', '203206'],
        ['e204207', '204207'],
    ]) {
        const child = optionalChild(node, elem);
        if (child) {
            const xMotivo = optionalText(child, 'xMotivo');
            return {
                tipoEvento: codigo,
                detalhe: {
                    [elem]: {
                        xDesc: requireText(child, 'xDesc'),
                        cMotivo: requireText(child, 'cMotivo'),
                        ...(xMotivo !== undefined ? { xMotivo } : {}),
                    },
                },
            };
        }
    }
    const e205208 = optionalChild(node, 'e205208');
    if (e205208) {
        return {
            tipoEvento: '205208',
            detalhe: {
                e205208: {
                    xDesc: requireText(e205208, 'xDesc'),
                    CPFAgTrib: requireText(e205208, 'CPFAgTrib'),
                    idEvManifRej: requireText(e205208, 'idEvManifRej'),
                    xMotivo: requireText(e205208, 'xMotivo'),
                },
            },
        };
    }
    const e305101 = optionalChild(node, 'e305101');
    if (e305101) {
        return {
            tipoEvento: '305101',
            detalhe: {
                e305101: {
                    xDesc: requireText(e305101, 'xDesc'),
                    CPFAgTrib: requireText(e305101, 'CPFAgTrib'),
                    nProcAdm: requireText(e305101, 'nProcAdm'),
                    xProcAdm: requireText(e305101, 'xProcAdm'),
                },
            },
        };
    }
    const e305102 = optionalChild(node, 'e305102');
    if (e305102) {
        return {
            tipoEvento: '305102',
            detalhe: {
                e305102: {
                    xDesc: requireText(e305102, 'xDesc'),
                    CPFAgTrib: requireText(e305102, 'CPFAgTrib'),
                    codEvento: requireText(e305102, 'codEvento'),
                    xMotivo: requireText(e305102, 'xMotivo'),
                },
            },
        };
    }
    const e305103 = optionalChild(node, 'e305103');
    if (e305103) {
        return {
            tipoEvento: '305103',
            detalhe: {
                e305103: {
                    xDesc: requireText(e305103, 'xDesc'),
                    CPFAgTrib: requireText(e305103, 'CPFAgTrib'),
                    idBloqOfic: requireText(e305103, 'idBloqOfic'),
                },
            },
        };
    }
    // Fallback — preserva o elemento bruto. Acontece se a Receita introduzir
    // um novo tipo antes da lib atualizar. Busca entre as chaves do nó pelo
    // padrão `e\d{6}`. Caller pode ler `detalhe.unknown.raw`.
    for (const key of Object.keys(node)) {
        if (/^e\d{6}$/.test(key)) {
            const child = optionalChild(node, key);
            if (child) {
                return {
                    tipoEvento: key.slice(1),
                    detalhe: {
                        unknown: { elementName: key, tipoEvento: key.slice(1), raw: child },
                    },
                };
            }
        }
    }
    throw new InvalidXmlError('evento sem detalhe reconhecido');
}
function parseSignature(node) {
    const signedInfo = requireChild(node, 'SignedInfo');
    const reference = requireChild(signedInfo, 'Reference');
    const keyInfo = requireChild(node, 'KeyInfo');
    const x509Data = requireChild(keyInfo, 'X509Data');
    return {
        signatureValue: requireText(node, 'SignatureValue').trim(),
        digestValue: requireText(reference, 'DigestValue').trim(),
        x509Certificate: requireText(x509Data, 'X509Certificate').trim(),
        referenceUri: requireAttr(reference, 'URI'),
    };
}
// ---- helpers ----
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requireAttr(node, name) {
    const v = node[`${ATTR_PREFIX}${name}`];
    if (typeof v !== 'string')
        throw new InvalidXmlError(`atributo @${name} ausente`);
    return v;
}
function requireChild(node, name) {
    const child = node[name];
    if (!isObject(child))
        throw new InvalidXmlError(`elemento <${name}> ausente`);
    return child;
}
function optionalChild(node, name) {
    const child = node[name];
    return isObject(child) ? child : undefined;
}
function requireText(node, name) {
    const v = node[name];
    if (typeof v !== 'string')
        throw new InvalidXmlError(`elemento <${name}> ausente ou não textual`);
    return v;
}
function optionalText(node, name) {
    const v = node[name];
    return typeof v === 'string' ? v : undefined;
}
function coerceDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        throw new InvalidXmlError(`data inválida: "${value}"`);
    return d;
}
function optionalAssign(key, value) {
    return value === undefined
        ? {}
        : { [key]: value };
}
//# sourceMappingURL=parse-event.js.map