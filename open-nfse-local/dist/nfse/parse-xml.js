import { InvalidXmlError } from '../errors/validation.js';
import { ATTR_PREFIX, parseXml } from '../xml/parser.js';
export function parseNfseXml(xml) {
    let tree;
    try {
        tree = parseXml(xml);
    }
    catch (cause) {
        throw new InvalidXmlError('falha ao parsear XML', { cause });
    }
    const root = tree.NFSe;
    if (!isObject(root)) {
        throw new InvalidXmlError('elemento raiz <NFSe> ausente');
    }
    return parseNFSe(root);
}
function parseNFSe(node) {
    return {
        versao: requireAttr(node, 'versao'),
        infNFSe: parseInfNFSe(requireChild(node, 'infNFSe')),
        signature: parseSignature(requireChild(node, 'Signature')),
    };
}
function parseInfNFSe(node) {
    const id = requireAttr(node, 'Id');
    return {
        Id: id,
        chaveAcesso: id.replace(/^NFS/, ''),
        xLocEmi: requireText(node, 'xLocEmi'),
        xLocPrestacao: requireText(node, 'xLocPrestacao'),
        nNFSe: requireText(node, 'nNFSe'),
        ...optionalAssign('cLocIncid', optionalText(node, 'cLocIncid')),
        ...optionalAssign('xLocIncid', optionalText(node, 'xLocIncid')),
        xTribNac: requireText(node, 'xTribNac'),
        ...optionalAssign('xTribMun', optionalText(node, 'xTribMun')),
        ...optionalAssign('xNBS', optionalText(node, 'xNBS')),
        verAplic: requireText(node, 'verAplic'),
        ambGer: requireText(node, 'ambGer'),
        tpEmis: requireText(node, 'tpEmis'),
        ...optionalAssign('procEmi', optionalText(node, 'procEmi')),
        cStat: requireText(node, 'cStat'),
        dhProc: coerceDate(requireText(node, 'dhProc')),
        nDFSe: requireText(node, 'nDFSe'),
        emit: parseEmitente(requireChild(node, 'emit')),
        valores: parseValoresNFSe(requireChild(node, 'valores')),
        ...optionalAssign('xOutInf', optionalText(node, 'xOutInf')),
        ...optionalAssign('IBSCBS', mapIfPresent(optionalChild(node, 'IBSCBS'), parseRtcIbsCbs)),
        DPS: parseDPS(requireChild(node, 'DPS')),
    };
}
function parseEmitente(node) {
    return {
        identificador: parseIdentificadorEmitente(node),
        ...optionalAssign('IM', optionalText(node, 'IM')),
        xNome: requireText(node, 'xNome'),
        ...optionalAssign('xFant', optionalText(node, 'xFant')),
        enderNac: parseEnderecoEmitente(requireChild(node, 'enderNac')),
        ...optionalAssign('fone', optionalText(node, 'fone')),
        ...optionalAssign('email', optionalText(node, 'email')),
    };
}
function parseEnderecoEmitente(node) {
    return {
        xLgr: requireText(node, 'xLgr'),
        nro: requireText(node, 'nro'),
        ...optionalAssign('xCpl', optionalText(node, 'xCpl')),
        xBairro: requireText(node, 'xBairro'),
        cMun: requireText(node, 'cMun'),
        UF: requireText(node, 'UF'),
        CEP: requireText(node, 'CEP'),
    };
}
function parseValoresNFSe(node) {
    return {
        ...optionalAssign('vCalcDR', optionalNumber(node, 'vCalcDR')),
        ...optionalAssign('tpBM', optionalText(node, 'tpBM')),
        ...optionalAssign('vCalcBM', optionalNumber(node, 'vCalcBM')),
        ...optionalAssign('vBC', optionalNumber(node, 'vBC')),
        ...optionalAssign('pAliqAplic', optionalNumber(node, 'pAliqAplic')),
        ...optionalAssign('vISSQN', optionalNumber(node, 'vISSQN')),
        ...optionalAssign('vTotalRet', optionalNumber(node, 'vTotalRet')),
        vLiq: coerceNumber(requireText(node, 'vLiq')),
    };
}
function parseDPS(node) {
    const sig = optionalChild(node, 'Signature');
    return {
        versao: requireAttr(node, 'versao'),
        infDPS: parseInfDPS(requireChild(node, 'infDPS')),
        ...optionalAssign('signature', sig ? parseSignature(sig) : undefined),
    };
}
function parseInfDPS(node) {
    return {
        Id: requireAttr(node, 'Id'),
        tpAmb: requireText(node, 'tpAmb'),
        dhEmi: coerceDate(requireText(node, 'dhEmi')),
        verAplic: requireText(node, 'verAplic'),
        serie: requireText(node, 'serie'),
        nDPS: requireText(node, 'nDPS'),
        dCompet: coerceDateOnly(requireText(node, 'dCompet')),
        tpEmit: requireText(node, 'tpEmit'),
        ...optionalAssign('cMotivoEmisTI', optionalText(node, 'cMotivoEmisTI')),
        ...optionalAssign('chNFSeRej', optionalText(node, 'chNFSeRej')),
        cLocEmi: requireText(node, 'cLocEmi'),
        ...optionalAssign('subst', mapIfPresent(optionalChild(node, 'subst'), parseSubstituicao)),
        prest: parseInfoPrestador(requireChild(node, 'prest')),
        ...optionalAssign('toma', mapIfPresent(optionalChild(node, 'toma'), parseInfoPessoa)),
        ...optionalAssign('interm', mapIfPresent(optionalChild(node, 'interm'), parseInfoPessoa)),
        serv: parseServ(requireChild(node, 'serv')),
        valores: parseInfoValores(requireChild(node, 'valores')),
        ...optionalAssign('IBSCBS', mapIfPresent(optionalChild(node, 'IBSCBS'), parseRtcInfoIbsCbs)),
    };
}
function parseSubstituicao(node) {
    return {
        chSubstda: requireText(node, 'chSubstda'),
        cMotivo: requireText(node, 'cMotivo'),
        ...optionalAssign('xMotivo', optionalText(node, 'xMotivo')),
    };
}
function parseRtcInfoIbsCbs(node) {
    return {
        finNFSe: requireText(node, 'finNFSe'),
        ...optionalAssign('indFinal', optionalText(node, 'indFinal')),
        cIndOp: requireText(node, 'cIndOp'),
        ...optionalAssign('tpOper', optionalText(node, 'tpOper')),
        ...optionalAssign('gRefNFSe', mapIfPresent(optionalChild(node, 'gRefNFSe'), parseInfoRefNFSe)),
        ...optionalAssign('tpEnteGov', optionalText(node, 'tpEnteGov')),
        indDest: requireText(node, 'indDest'),
        ...optionalAssign('dest', mapIfPresent(optionalChild(node, 'dest'), parseRtcInfoDest)),
        ...optionalAssign('imovel', mapIfPresent(optionalChild(node, 'imovel'), parseRtcInfoImovel)),
        valores: parseRtcInfoValoresIbsCbs(requireChild(node, 'valores')),
    };
}
function parseInfoRefNFSe(node) {
    return {
        refNFSe: asArray(node.refNFSe).map((v) => {
            if (typeof v !== 'string')
                throw new InvalidXmlError('refNFSe não é string');
            return v;
        }),
    };
}
function parseRtcInfoDest(node) {
    return {
        identificador: parseIdentificador(node),
        xNome: requireText(node, 'xNome'),
        ...optionalAssign('end', mapIfPresent(optionalChild(node, 'end'), parseEndereco)),
        ...optionalAssign('fone', optionalText(node, 'fone')),
        ...optionalAssign('email', optionalText(node, 'email')),
    };
}
function parseRtcInfoImovel(node) {
    return {
        ...optionalAssign('inscImobFisc', optionalText(node, 'inscImobFisc')),
        identificacao: parseImovelIdentificacao(node),
    };
}
function parseImovelIdentificacao(node) {
    const cCIB = optionalText(node, 'cCIB');
    if (cCIB !== undefined)
        return { cCIB };
    const end = optionalChild(node, 'end');
    if (end)
        return { end: parseEnderObraEvento(end) };
    throw new InvalidXmlError('imovel sem cCIB nem end');
}
function parseRtcInfoValoresIbsCbs(node) {
    return {
        ...optionalAssign('gReeRepRes', mapIfPresent(optionalChild(node, 'gReeRepRes'), parseRtcInfoReeRepRes)),
        trib: parseRtcInfoTributosIbsCbs(requireChild(node, 'trib')),
    };
}
function parseRtcInfoReeRepRes(node) {
    return {
        documentos: asArray(node.documentos).map((entry) => {
            if (!isObject(entry))
                throw new InvalidXmlError('documentos entry inválida');
            return parseRtcListaDoc(entry);
        }),
    };
}
function parseRtcListaDoc(node) {
    return {
        documento: parseRtcDocumentoReferenciado(node),
        ...optionalAssign('fornec', mapIfPresent(optionalChild(node, 'fornec'), parseRtcListaDocFornec)),
        dtEmiDoc: coerceDateOnly(requireText(node, 'dtEmiDoc')),
        dtCompDoc: coerceDateOnly(requireText(node, 'dtCompDoc')),
        tpReeRepRes: requireText(node, 'tpReeRepRes'),
        ...optionalAssign('xTpReeRepRes', optionalText(node, 'xTpReeRepRes')),
        vlrReeRepRes: coerceNumber(requireText(node, 'vlrReeRepRes')),
    };
}
function parseRtcDocumentoReferenciado(node) {
    const dFe = optionalChild(node, 'dFeNacional');
    if (dFe)
        return { dFeNacional: parseRtcListaDocDFe(dFe) };
    const outroFiscal = optionalChild(node, 'docFiscalOutro');
    if (outroFiscal)
        return { docFiscalOutro: parseRtcListaDocFiscalOutro(outroFiscal) };
    const outro = optionalChild(node, 'docOutro');
    if (outro)
        return { docOutro: parseRtcListaDocOutro(outro) };
    throw new InvalidXmlError('documento referenciado sem variante reconhecida');
}
function parseRtcListaDocDFe(node) {
    return {
        tipoChaveDFe: requireText(node, 'tipoChaveDFe'),
        ...optionalAssign('xTipoChaveDFe', optionalText(node, 'xTipoChaveDFe')),
        chaveDFe: requireText(node, 'chaveDFe'),
    };
}
function parseRtcListaDocFiscalOutro(node) {
    return {
        cMunDocFiscal: requireText(node, 'cMunDocFiscal'),
        nDocFiscal: requireText(node, 'nDocFiscal'),
        xDocFiscal: requireText(node, 'xDocFiscal'),
    };
}
function parseRtcListaDocOutro(node) {
    return {
        nDoc: requireText(node, 'nDoc'),
        xDoc: requireText(node, 'xDoc'),
    };
}
function parseRtcListaDocFornec(node) {
    return {
        identificador: parseIdentificador(node),
        xNome: requireText(node, 'xNome'),
    };
}
function parseRtcInfoTributosIbsCbs(node) {
    return {
        gIBSCBS: parseRtcInfoTributosSitClas(requireChild(node, 'gIBSCBS')),
    };
}
function parseRtcInfoTributosSitClas(node) {
    return {
        CST: requireText(node, 'CST'),
        cClassTrib: requireText(node, 'cClassTrib'),
        ...optionalAssign('cCredPres', optionalText(node, 'cCredPres')),
        ...optionalAssign('gTribRegular', mapIfPresent(optionalChild(node, 'gTribRegular'), parseRtcInfoTributosTribRegular)),
        ...optionalAssign('gDif', mapIfPresent(optionalChild(node, 'gDif'), parseRtcInfoTributosDif)),
    };
}
function parseRtcInfoTributosTribRegular(node) {
    return {
        CSTReg: requireText(node, 'CSTReg'),
        cClassTribReg: requireText(node, 'cClassTribReg'),
    };
}
function parseRtcInfoTributosDif(node) {
    return {
        pDifUF: coerceNumber(requireText(node, 'pDifUF')),
        pDifMun: coerceNumber(requireText(node, 'pDifMun')),
        pDifCBS: coerceNumber(requireText(node, 'pDifCBS')),
    };
}
function parseInfoPrestador(node) {
    return {
        identificador: parseIdentificador(node),
        ...optionalAssign('CAEPF', optionalText(node, 'CAEPF')),
        ...optionalAssign('IM', optionalText(node, 'IM')),
        ...optionalAssign('xNome', optionalText(node, 'xNome')),
        ...optionalAssign('end', mapIfPresent(optionalChild(node, 'end'), parseEndereco)),
        ...optionalAssign('fone', optionalText(node, 'fone')),
        ...optionalAssign('email', optionalText(node, 'email')),
        regTrib: parseRegTrib(requireChild(node, 'regTrib')),
    };
}
function parseInfoPessoa(node) {
    return {
        identificador: parseIdentificador(node),
        ...optionalAssign('CAEPF', optionalText(node, 'CAEPF')),
        ...optionalAssign('IM', optionalText(node, 'IM')),
        xNome: requireText(node, 'xNome'),
        ...optionalAssign('end', mapIfPresent(optionalChild(node, 'end'), parseEndereco)),
        ...optionalAssign('fone', optionalText(node, 'fone')),
        ...optionalAssign('email', optionalText(node, 'email')),
    };
}
function parseRegTrib(node) {
    return {
        opSimpNac: requireText(node, 'opSimpNac'),
        ...optionalAssign('regApTribSN', optionalText(node, 'regApTribSN')),
        regEspTrib: requireText(node, 'regEspTrib'),
    };
}
function parseEndereco(node) {
    const endNac = optionalChild(node, 'endNac');
    const endExt = optionalChild(node, 'endExt');
    let localidade;
    if (endNac) {
        localidade = {
            endNac: {
                cMun: requireText(endNac, 'cMun'),
                CEP: requireText(endNac, 'CEP'),
            },
        };
    }
    else if (endExt) {
        localidade = { endExt: parseEnderecoExterior(endExt) };
    }
    else {
        throw new InvalidXmlError('endereço sem endNac nem endExt');
    }
    return {
        localidade,
        xLgr: requireText(node, 'xLgr'),
        nro: requireText(node, 'nro'),
        ...optionalAssign('xCpl', optionalText(node, 'xCpl')),
        xBairro: requireText(node, 'xBairro'),
    };
}
function parseServ(node) {
    return {
        locPrest: parseLocPrest(requireChild(node, 'locPrest')),
        cServ: parseCServ(requireChild(node, 'cServ')),
        ...optionalAssign('comExt', mapIfPresent(optionalChild(node, 'comExt'), parseComExterior)),
        ...optionalAssign('obra', mapIfPresent(optionalChild(node, 'obra'), parseInfoObra)),
        ...optionalAssign('atvEvento', mapIfPresent(optionalChild(node, 'atvEvento'), parseAtvEvento)),
        ...optionalAssign('infoCompl', mapIfPresent(optionalChild(node, 'infoCompl'), parseInfoCompl)),
    };
}
function parseComExterior(node) {
    return {
        mdPrestacao: requireText(node, 'mdPrestacao'),
        vincPrest: requireText(node, 'vincPrest'),
        tpMoeda: requireText(node, 'tpMoeda'),
        vServMoeda: coerceNumber(requireText(node, 'vServMoeda')),
        mecAFComexP: requireText(node, 'mecAFComexP'),
        mecAFComexT: requireText(node, 'mecAFComexT'),
        movTempBens: requireText(node, 'movTempBens'),
        ...optionalAssign('nDI', optionalText(node, 'nDI')),
        ...optionalAssign('nRE', optionalText(node, 'nRE')),
        mdic: requireText(node, 'mdic'),
    };
}
function parseAtvEvento(node) {
    return {
        xNome: requireText(node, 'xNome'),
        dtIni: coerceDateOnly(requireText(node, 'dtIni')),
        dtFim: coerceDateOnly(requireText(node, 'dtFim')),
        identificacao: parseAtvEventoIdentificacao(node),
    };
}
function parseAtvEventoIdentificacao(node) {
    const id = optionalText(node, 'idAtvEvt');
    if (id !== undefined)
        return { idAtvEvt: id };
    const end = optionalChild(node, 'end');
    if (end)
        return { end: parseEnderecoSimples(end) };
    throw new InvalidXmlError('atvEvento sem idAtvEvt nem end');
}
function parseEnderecoExterior(node) {
    return {
        cPais: requireText(node, 'cPais'),
        cEndPost: requireText(node, 'cEndPost'),
        xCidade: requireText(node, 'xCidade'),
        xEstProvReg: requireText(node, 'xEstProvReg'),
    };
}
function parseEnderecoExteriorSimples(node) {
    return {
        cEndPost: requireText(node, 'cEndPost'),
        xCidade: requireText(node, 'xCidade'),
        xEstProvReg: requireText(node, 'xEstProvReg'),
    };
}
function parseEnderecoSimples(node) {
    const cep = optionalText(node, 'CEP');
    const localidade = cep
        ? { CEP: cep }
        : { endExt: parseEnderecoExteriorSimples(requireChild(node, 'endExt')) };
    return {
        ...localidade,
        xLgr: requireText(node, 'xLgr'),
        nro: requireText(node, 'nro'),
        ...optionalAssign('xCpl', optionalText(node, 'xCpl')),
        xBairro: requireText(node, 'xBairro'),
    };
}
function parseEnderObraEvento(node) {
    return parseEnderecoSimples(node);
}
function parseInfoObra(node) {
    return {
        ...optionalAssign('inscImobFisc', optionalText(node, 'inscImobFisc')),
        identificacao: parseInfoObraIdentificacao(node),
    };
}
function parseInfoObraIdentificacao(node) {
    const cObra = optionalText(node, 'cObra');
    if (cObra !== undefined)
        return { cObra };
    const cCIB = optionalText(node, 'cCIB');
    if (cCIB !== undefined)
        return { cCIB };
    const end = optionalChild(node, 'end');
    if (end)
        return { end: parseEnderObraEvento(end) };
    throw new InvalidXmlError('obra sem cObra/cCIB/end');
}
function parseInfoCompl(node) {
    return {
        ...optionalAssign('idDocTec', optionalText(node, 'idDocTec')),
        ...optionalAssign('docRef', optionalText(node, 'docRef')),
        ...optionalAssign('xPed', optionalText(node, 'xPed')),
        ...optionalAssign('gItemPed', mapIfPresent(optionalChild(node, 'gItemPed'), parseInfoItemPed)),
        ...optionalAssign('xInfComp', optionalText(node, 'xInfComp')),
    };
}
function parseInfoItemPed(node) {
    return {
        xItemPed: asArray(node.xItemPed).map((v) => {
            if (typeof v !== 'string') {
                throw new InvalidXmlError('xItemPed não é string');
            }
            return v;
        }),
    };
}
function parseLocPrest(node) {
    const muni = optionalText(node, 'cLocPrestacao');
    if (muni !== undefined)
        return { cLocPrestacao: muni };
    const pais = optionalText(node, 'cPaisPrestacao');
    if (pais !== undefined)
        return { cPaisPrestacao: pais };
    throw new InvalidXmlError('locPrest sem cLocPrestacao nem cPaisPrestacao');
}
function parseCServ(node) {
    return {
        cTribNac: requireText(node, 'cTribNac'),
        ...optionalAssign('cTribMun', optionalText(node, 'cTribMun')),
        xDescServ: requireText(node, 'xDescServ'),
        ...optionalAssign('cNBS', optionalText(node, 'cNBS')),
        ...optionalAssign('cIntContrib', optionalText(node, 'cIntContrib')),
    };
}
function parseInfoValores(node) {
    return {
        vServPrest: parseVServPrest(requireChild(node, 'vServPrest')),
        ...optionalAssign('vDescCondIncond', mapIfPresent(optionalChild(node, 'vDescCondIncond'), parseVDescCondIncond)),
        ...optionalAssign('vDedRed', mapIfPresent(optionalChild(node, 'vDedRed'), parseInfoDedRed)),
        trib: parseInfoTributacao(requireChild(node, 'trib')),
    };
}
function parseVServPrest(node) {
    return {
        ...optionalAssign('vReceb', optionalNumber(node, 'vReceb')),
        vServ: coerceNumber(requireText(node, 'vServ')),
    };
}
function parseVDescCondIncond(node) {
    return {
        ...optionalAssign('vDescIncond', optionalNumber(node, 'vDescIncond')),
        ...optionalAssign('vDescCond', optionalNumber(node, 'vDescCond')),
    };
}
function parseInfoDedRed(node) {
    const pDR = optionalNumber(node, 'pDR');
    if (pDR !== undefined)
        return { pDR };
    const vDR = optionalNumber(node, 'vDR');
    if (vDR !== undefined)
        return { vDR };
    const documentos = optionalChild(node, 'documentos');
    if (documentos)
        return { documentos: parseListaDocDedRed(documentos) };
    throw new InvalidXmlError('vDedRed sem pDR, vDR ou documentos');
}
function parseListaDocDedRed(node) {
    return {
        docDedRed: asArray(node.docDedRed).map((entry) => {
            if (!isObject(entry)) {
                throw new InvalidXmlError('docDedRed não é um elemento');
            }
            return parseDocDedRed(entry);
        }),
    };
}
function parseDocDedRed(node) {
    return {
        referencia: parseReferenciaDocDedRed(node),
        tpDedRed: requireText(node, 'tpDedRed'),
        ...optionalAssign('xDescOutDed', optionalText(node, 'xDescOutDed')),
        dtEmiDoc: coerceDateOnly(requireText(node, 'dtEmiDoc')),
        vDedutivelRedutivel: coerceNumber(requireText(node, 'vDedutivelRedutivel')),
        vDeducaoReducao: coerceNumber(requireText(node, 'vDeducaoReducao')),
        ...optionalAssign('fornec', mapIfPresent(optionalChild(node, 'fornec'), parseInfoPessoa)),
    };
}
function parseReferenciaDocDedRed(node) {
    const chNFSe = optionalText(node, 'chNFSe');
    if (chNFSe !== undefined)
        return { chNFSe };
    const chNFe = optionalText(node, 'chNFe');
    if (chNFe !== undefined)
        return { chNFe };
    const NFSeMun = optionalChild(node, 'NFSeMun');
    if (NFSeMun)
        return { NFSeMun: parseDocOutNFSe(NFSeMun) };
    const NFNFS = optionalChild(node, 'NFNFS');
    if (NFNFS)
        return { NFNFS: parseDocNFNFS(NFNFS) };
    const nDocFisc = optionalText(node, 'nDocFisc');
    if (nDocFisc !== undefined)
        return { nDocFisc };
    const nDoc = optionalText(node, 'nDoc');
    if (nDoc !== undefined)
        return { nDoc };
    throw new InvalidXmlError('docDedRed sem referência de documento');
}
function parseDocOutNFSe(node) {
    return {
        cMunNFSeMun: requireText(node, 'cMunNFSeMun'),
        nNFSeMun: requireText(node, 'nNFSeMun'),
        cVerifNFSeMun: requireText(node, 'cVerifNFSeMun'),
    };
}
function parseDocNFNFS(node) {
    return {
        nNFS: requireText(node, 'nNFS'),
        modNFS: requireText(node, 'modNFS'),
        serieNFS: requireText(node, 'serieNFS'),
    };
}
function parseInfoTributacao(node) {
    return {
        tribMun: parseTribMunicipal(requireChild(node, 'tribMun')),
        ...optionalAssign('tribFed', mapIfPresent(optionalChild(node, 'tribFed'), parseTribFederal)),
        totTrib: parseTribTotal(requireChild(node, 'totTrib')),
    };
}
function parseTribMunicipal(node) {
    return {
        tribISSQN: requireText(node, 'tribISSQN'),
        ...optionalAssign('cPaisResult', optionalText(node, 'cPaisResult')),
        ...optionalAssign('tpImunidade', optionalText(node, 'tpImunidade')),
        ...optionalAssign('exigSusp', mapIfPresent(optionalChild(node, 'exigSusp'), parseExigSuspensa)),
        ...optionalAssign('BM', mapIfPresent(optionalChild(node, 'BM'), parseBeneficioMunicipal)),
        tpRetISSQN: requireText(node, 'tpRetISSQN'),
        ...optionalAssign('pAliq', optionalNumber(node, 'pAliq')),
    };
}
function parseExigSuspensa(node) {
    return {
        tpSusp: requireText(node, 'tpSusp'),
        nProcesso: requireText(node, 'nProcesso'),
    };
}
function parseBeneficioMunicipal(node) {
    const nBM = requireText(node, 'nBM');
    const vRedBCBM = optionalNumber(node, 'vRedBCBM');
    if (vRedBCBM !== undefined)
        return { nBM, vRedBCBM };
    const pRedBCBM = optionalNumber(node, 'pRedBCBM');
    if (pRedBCBM !== undefined)
        return { nBM, pRedBCBM };
    return { nBM };
}
function parseTribFederal(node) {
    return {
        ...optionalAssign('piscofins', mapIfPresent(optionalChild(node, 'piscofins'), parseTribOutrosPisCofins)),
        ...optionalAssign('vRetCP', optionalNumber(node, 'vRetCP')),
        ...optionalAssign('vRetIRRF', optionalNumber(node, 'vRetIRRF')),
        ...optionalAssign('vRetCSLL', optionalNumber(node, 'vRetCSLL')),
    };
}
function parseTribOutrosPisCofins(node) {
    return {
        CST: requireText(node, 'CST'),
        ...optionalAssign('vBCPisCofins', optionalNumber(node, 'vBCPisCofins')),
        ...optionalAssign('pAliqPis', optionalNumber(node, 'pAliqPis')),
        ...optionalAssign('pAliqCofins', optionalNumber(node, 'pAliqCofins')),
        ...optionalAssign('vPis', optionalNumber(node, 'vPis')),
        ...optionalAssign('vCofins', optionalNumber(node, 'vCofins')),
        ...optionalAssign('tpRetPisCofins', optionalText(node, 'tpRetPisCofins')),
    };
}
function parseTribTotal(node) {
    const vTot = optionalChild(node, 'vTotTrib');
    if (vTot)
        return { vTotTrib: parseTribTotalMonet(vTot) };
    const pTot = optionalChild(node, 'pTotTrib');
    if (pTot)
        return { pTotTrib: parseTribTotalPercent(pTot) };
    const ind = optionalText(node, 'indTotTrib');
    if (ind !== undefined)
        return { indTotTrib: ind };
    const pSN = optionalNumber(node, 'pTotTribSN');
    if (pSN !== undefined)
        return { pTotTribSN: pSN };
    throw new InvalidXmlError('totTrib sem variante (vTotTrib/pTotTrib/indTotTrib/pTotTribSN)');
}
function parseTribTotalMonet(node) {
    return {
        vTotTribFed: coerceNumber(requireText(node, 'vTotTribFed')),
        vTotTribEst: coerceNumber(requireText(node, 'vTotTribEst')),
        vTotTribMun: coerceNumber(requireText(node, 'vTotTribMun')),
    };
}
function parseTribTotalPercent(node) {
    return {
        pTotTribFed: coerceNumber(requireText(node, 'pTotTribFed')),
        pTotTribEst: coerceNumber(requireText(node, 'pTotTribEst')),
        pTotTribMun: coerceNumber(requireText(node, 'pTotTribMun')),
    };
}
function parseRtcIbsCbs(node) {
    return {
        cLocalidadeIncid: requireText(node, 'cLocalidadeIncid'),
        xLocalidadeIncid: requireText(node, 'xLocalidadeIncid'),
        ...optionalAssign('pRedutor', optionalNumber(node, 'pRedutor')),
        valores: parseRtcValoresIbsCbs(requireChild(node, 'valores')),
        totCIBS: parseRtcTotalCIbs(requireChild(node, 'totCIBS')),
    };
}
function parseRtcValoresIbsCbs(node) {
    return {
        vBC: coerceNumber(requireText(node, 'vBC')),
        ...optionalAssign('vCalcReeRepRes', optionalNumber(node, 'vCalcReeRepRes')),
        uf: parseRtcValoresIbsCbsUF(requireChild(node, 'uf')),
        mun: parseRtcValoresIbsCbsMun(requireChild(node, 'mun')),
        fed: parseRtcValoresIbsCbsFed(requireChild(node, 'fed')),
    };
}
function parseRtcValoresIbsCbsUF(node) {
    return {
        pIBSUF: coerceNumber(requireText(node, 'pIBSUF')),
        ...optionalAssign('pRedAliqUF', optionalNumber(node, 'pRedAliqUF')),
        pAliqEfetUF: coerceNumber(requireText(node, 'pAliqEfetUF')),
    };
}
function parseRtcValoresIbsCbsMun(node) {
    return {
        pIBSMun: coerceNumber(requireText(node, 'pIBSMun')),
        ...optionalAssign('pRedAliqMun', optionalNumber(node, 'pRedAliqMun')),
        pAliqEfetMun: coerceNumber(requireText(node, 'pAliqEfetMun')),
    };
}
function parseRtcValoresIbsCbsFed(node) {
    return {
        pCBS: coerceNumber(requireText(node, 'pCBS')),
        ...optionalAssign('pRedAliqCBS', optionalNumber(node, 'pRedAliqCBS')),
        pAliqEfetCBS: coerceNumber(requireText(node, 'pAliqEfetCBS')),
    };
}
function parseRtcTotalCIbs(node) {
    return {
        vTotNF: coerceNumber(requireText(node, 'vTotNF')),
        gIBS: parseRtcTotalIbs(requireChild(node, 'gIBS')),
        gCBS: parseRtcTotalCbs(requireChild(node, 'gCBS')),
        ...optionalAssign('gTribRegular', mapIfPresent(optionalChild(node, 'gTribRegular'), parseRtcTotalTribRegular)),
        ...optionalAssign('gTribCompraGov', mapIfPresent(optionalChild(node, 'gTribCompraGov'), parseRtcTotalTribCompraGov)),
    };
}
function parseRtcTotalIbs(node) {
    return {
        vIBSTot: coerceNumber(requireText(node, 'vIBSTot')),
        ...optionalAssign('gIBSCredPres', mapIfPresent(optionalChild(node, 'gIBSCredPres'), parseRtcTotalIbsCredPres)),
        gIBSUFTot: parseRtcTotalIbsUF(requireChild(node, 'gIBSUFTot')),
        gIBSMunTot: parseRtcTotalIbsMun(requireChild(node, 'gIBSMunTot')),
    };
}
function parseRtcTotalIbsCredPres(node) {
    return {
        pCredPresIBS: coerceNumber(requireText(node, 'pCredPresIBS')),
        vCredPresIBS: coerceNumber(requireText(node, 'vCredPresIBS')),
    };
}
function parseRtcTotalIbsUF(node) {
    return {
        ...optionalAssign('vDifUF', optionalNumber(node, 'vDifUF')),
        vIBSUF: coerceNumber(requireText(node, 'vIBSUF')),
    };
}
function parseRtcTotalIbsMun(node) {
    return {
        ...optionalAssign('vDifMun', optionalNumber(node, 'vDifMun')),
        vIBSMun: coerceNumber(requireText(node, 'vIBSMun')),
    };
}
function parseRtcTotalCbs(node) {
    return {
        ...optionalAssign('gCBSCredPres', mapIfPresent(optionalChild(node, 'gCBSCredPres'), parseRtcTotalCbsCredPres)),
        ...optionalAssign('vDifCBS', optionalNumber(node, 'vDifCBS')),
        vCBS: coerceNumber(requireText(node, 'vCBS')),
    };
}
function parseRtcTotalCbsCredPres(node) {
    return {
        pCredPresCBS: coerceNumber(requireText(node, 'pCredPresCBS')),
        vCredPresCBS: coerceNumber(requireText(node, 'vCredPresCBS')),
    };
}
function parseRtcTotalTribRegular(node) {
    return {
        pAliqEfeRegIBSUF: coerceNumber(requireText(node, 'pAliqEfeRegIBSUF')),
        vTribRegIBSUF: coerceNumber(requireText(node, 'vTribRegIBSUF')),
        pAliqEfeRegIBSMun: coerceNumber(requireText(node, 'pAliqEfeRegIBSMun')),
        vTribRegIBSMun: coerceNumber(requireText(node, 'vTribRegIBSMun')),
        pAliqEfeRegCBS: coerceNumber(requireText(node, 'pAliqEfeRegCBS')),
        vTribRegCBS: coerceNumber(requireText(node, 'vTribRegCBS')),
    };
}
function parseRtcTotalTribCompraGov(node) {
    return {
        pIBSUF: coerceNumber(requireText(node, 'pIBSUF')),
        vIBSUF: coerceNumber(requireText(node, 'vIBSUF')),
        pIBSMun: coerceNumber(requireText(node, 'pIBSMun')),
        vIBSMun: coerceNumber(requireText(node, 'vIBSMun')),
        pCBS: coerceNumber(requireText(node, 'pCBS')),
        vCBS: coerceNumber(requireText(node, 'vCBS')),
    };
}
function asArray(value) {
    if (value === undefined)
        return [];
    return Array.isArray(value) ? value : [value];
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
function parseIdentificador(node) {
    const cnpj = optionalText(node, 'CNPJ');
    if (cnpj !== undefined)
        return { CNPJ: cnpj };
    const cpf = optionalText(node, 'CPF');
    if (cpf !== undefined)
        return { CPF: cpf };
    const nif = optionalText(node, 'NIF');
    if (nif !== undefined)
        return { NIF: nif };
    const cNaoNIF = optionalText(node, 'cNaoNIF');
    if (cNaoNIF !== undefined)
        return { cNaoNIF: cNaoNIF };
    throw new InvalidXmlError('identificador ausente (CNPJ/CPF/NIF/cNaoNIF)');
}
/**
 * Identificação do emitente: `TCEmitente` admite apenas `CNPJ` ou `CPF`
 * (sem `NIF`/`cNaoNIF`), por isso não reutiliza {@link parseIdentificador}.
 */
function parseIdentificadorEmitente(node) {
    const cnpj = optionalText(node, 'CNPJ');
    if (cnpj !== undefined)
        return { CNPJ: cnpj };
    const cpf = optionalText(node, 'CPF');
    if (cpf !== undefined)
        return { CPF: cpf };
    throw new InvalidXmlError('identificador do emitente ausente (CNPJ/CPF)');
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function requireAttr(node, name) {
    const value = node[`${ATTR_PREFIX}${name}`];
    if (typeof value !== 'string') {
        throw new InvalidXmlError(`atributo @${name} ausente`);
    }
    return value;
}
function requireChild(node, name) {
    const child = node[name];
    if (!isObject(child)) {
        throw new InvalidXmlError(`elemento <${name}> ausente`);
    }
    return child;
}
function optionalChild(node, name) {
    const child = node[name];
    return isObject(child) ? child : undefined;
}
function requireText(node, name) {
    const value = node[name];
    if (typeof value !== 'string') {
        throw new InvalidXmlError(`elemento <${name}> ausente ou não textual`);
    }
    return value;
}
function optionalText(node, name) {
    const value = node[name];
    return typeof value === 'string' ? value : undefined;
}
function optionalNumber(node, name) {
    const value = optionalText(node, name);
    return value !== undefined ? coerceNumber(value) : undefined;
}
function coerceNumber(value) {
    const n = Number(value);
    if (Number.isNaN(n)) {
        throw new InvalidXmlError(`valor não numérico: "${value}"`);
    }
    return n;
}
function coerceDate(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new InvalidXmlError(`valor não é data válida: "${value}"`);
    }
    return d;
}
/**
 * Campos **date-only** (`TSData`, `YYYY-MM-DD`: `dCompet`, `dtEmiDoc`, `dtCompDoc`,
 * `dtIni`, `dtFim`) são ancorados na meia-noite de **Brasília (-03:00)**,
 * espelhando a escrita (`build-xml` aplica `toBrt` antes de fatiar a data). Sem
 * isso, `new Date('2026-03-03')` cairia na meia-noite **UTC** e, lido com
 * acessores locais em fuso BR (UTC-3), retornaria o **dia anterior** (off-by-one)
 * — e o round-trip build→parse não seria estável. Não usar para datetime
 * (`dhEmi`/`dhProc`), que já carregam offset explícito → `coerceDate`.
 */
function coerceDateOnly(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!m) {
        // Não é date-only puro (datetime/edge) — delega ao parser geral.
        return coerceDate(value);
    }
    const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00-03:00`);
    if (Number.isNaN(d.getTime())) {
        throw new InvalidXmlError(`valor não é data válida: "${value}"`);
    }
    return d;
}
function mapIfPresent(node, fn) {
    return node ? fn(node) : undefined;
}
function optionalAssign(key, value) {
    return value === undefined
        ? {}
        : { [key]: value };
}
//# sourceMappingURL=parse-xml.js.map