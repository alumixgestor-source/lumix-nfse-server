export function parseAliquotasResult(raw) {
    const aliquotas = {};
    for (const [key, list] of Object.entries(raw.aliquotas ?? {})) {
        if (!list)
            continue;
        aliquotas[key] = list.map(parseAliquota);
    }
    return {
        ...optional('mensagem', raw.mensagem ?? undefined),
        aliquotas,
    };
}
function parseAliquota(raw) {
    return {
        ...optional('incidencia', raw.Incidencia ?? undefined),
        ...optional('aliquota', raw.Aliq ?? undefined),
        dataInicioVigencia: new Date(raw.DtIni),
        ...(raw.DtFim ? { dataFimVigencia: new Date(raw.DtFim) } : {}),
    };
}
export function parseBeneficioResult(raw) {
    return {
        ...optional('mensagem', raw.mensagem ?? undefined),
        ...(raw.beneficio ? { beneficio: parseBeneficio(raw.beneficio) } : {}),
    };
}
function parseBeneficio(raw) {
    return {
        ...optional('codigoBeneficio', raw.codigoBeneficio ?? undefined),
        ...optional('descricao', raw.descricao ?? undefined),
        dataInicioVigencia: new Date(raw.dataInicioVigencia),
        ...(raw.dataFimVigencia ? { dataFimVigencia: new Date(raw.dataFimVigencia) } : {}),
        tipoBeneficio: String(raw.tipoBeneficio),
        ...(raw.tipoReducaoBC !== null && raw.tipoReducaoBC !== undefined
            ? { tipoReducaoBC: String(raw.tipoReducaoBC) }
            : {}),
        ...optional('reducaoPercentualBC', raw.reducaoPercentualBC ?? undefined),
        ...optional('aliquotaDiferenciada', raw.aliquotaDiferenciada ?? undefined),
        ...optional('restritoAoMunicipio', raw.restritoAoMunicipio ?? undefined),
        servicos: (raw.servicos ?? []).map(parseBeneficioServico),
        contribuintes: (raw.contribuintes ?? []).map(parseBeneficioInscricao),
    };
}
function parseBeneficioServico(raw) {
    return {
        ...optional('codigoServico', raw.codigoServico ?? undefined),
        dataInicioVigencia: new Date(raw.dataInicioVigencia),
        ...(raw.dataFimVigencia ? { dataFimVigencia: new Date(raw.dataFimVigencia) } : {}),
    };
}
function parseBeneficioInscricao(raw) {
    return {
        tipoInscricao: String(raw.tipoInscricao),
        ...optional('inscricao', raw.inscricao ?? undefined),
        dataInicioVigencia: new Date(raw.dataInicioVigencia),
        ...(raw.dataFimVigencia ? { dataFimVigencia: new Date(raw.dataFimVigencia) } : {}),
    };
}
export function parseConvenioResult(raw) {
    return {
        ...optional('mensagem', raw.mensagem ?? undefined),
        ...(raw.parametrosConvenio
            ? { parametrosConvenio: parseParametrosConvenio(raw.parametrosConvenio) }
            : {}),
    };
}
function parseParametrosConvenio(raw) {
    return {
        tipoConvenio: String(raw.tipoConvenioDeserializationSetter),
        aderenteAmbienteNacional: String(raw.aderenteAmbienteNacional),
        aderenteEmissorNacional: String(raw.aderenteEmissorNacional),
        situacaoEmissaoPadraoContribuintesRFB: String(raw.situacaoEmissaoPadraoContribuintesRFB),
        aderenteMAN: String(raw.aderenteMAN),
        ...optional('permiteAproveitamentoDeCreditos', raw.permiteAproveitametoDeCreditos ?? undefined),
    };
}
export function parseRegimesEspeciaisResult(raw) {
    const regimesEspeciais = {};
    for (const [regime, variantes] of Object.entries(raw.regimesEspeciais ?? {})) {
        if (!variantes)
            continue;
        const inner = {};
        for (const [variante, list] of Object.entries(variantes)) {
            if (!list)
                continue;
            inner[variante] = list.map(parseRegimeEspecial);
        }
        regimesEspeciais[regime] = inner;
    }
    return {
        ...optional('mensagem', raw.mensagem ?? undefined),
        regimesEspeciais,
    };
}
function parseRegimeEspecial(raw) {
    return {
        situacao: String(raw.situacao),
        dataInicioVigencia: new Date(raw.dataInicio),
        ...(raw.dataFim ? { dataFimVigencia: new Date(raw.dataFim) } : {}),
        ...optional('observacoes', raw.observacoes ?? undefined),
    };
}
export function parseRetencoesResult(raw) {
    return {
        ...optional('mensagem', raw.mensagem ?? undefined),
        ...(raw.retencoes ? { retencoes: parseRetencoes(raw.retencoes) } : {}),
    };
}
function parseRetencoes(raw) {
    const artigoSexto = raw.artigoSexto
        ? {
            habilitado: raw.artigoSexto.habilitado,
            historico: (raw.artigoSexto.historico ?? []).map(parseRetencaoArtigoSexto),
        }
        : { habilitado: false, historico: [] };
    return {
        artigoSexto,
        retencoesMunicipais: (raw.retencoesMunicipais ?? []).map(parseRetencaoMunicipal),
    };
}
function parseRetencaoArtigoSexto(raw) {
    return {
        dataInicioVigencia: new Date(raw.dataInicioVigencia),
        ...(raw.dataFimVigencia ? { dataFimVigencia: new Date(raw.dataFimVigencia) } : {}),
    };
}
function parseRetencaoMunicipal(raw) {
    return {
        ...optional('descricao', raw.descricao ?? undefined),
        dataInicioVigencia: new Date(raw.dataInicioVigencia),
        ...(raw.dataFimVigencia ? { dataFimVigencia: new Date(raw.dataFimVigencia) } : {}),
        tiposRetencao: (raw.tiposRetencao ?? []).map((n) => String(n)),
        servicos: (raw.servicos ?? []).map(parseRetencaoMunicipalPorCodigoServico),
    };
}
function parseRetencaoMunicipalPorCodigoServico(raw) {
    return {
        ...optional('codigoCompleto', raw.codigoCompleto ?? undefined),
        historico: (raw.historico ?? []).map(parseRetencaoMunicipalServico),
    };
}
function parseRetencaoMunicipalServico(raw) {
    return {
        dataInicioVigencia: new Date(raw.dataInicioVigencia),
        ...(raw.dataFimVigencia ? { dataFimVigencia: new Date(raw.dataFimVigencia) } : {}),
    };
}
// ---------- small helper ----------
function optional(key, value) {
    return value === undefined
        ? {}
        : { [key]: value };
}
//# sourceMappingURL=parse.js.map