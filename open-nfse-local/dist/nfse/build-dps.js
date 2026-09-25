import { RuleViolationError } from '../errors/validation.js';
import { validateCnpj, validateCpf } from '../fiscal/validate-cpf-cnpj.js';
import { DEFAULT_VER_APLIC } from '../version.js';
import { buildDpsId } from './dps-id.js';
import { OpcaoSimplesNacional, TipoRetISSQN, TipoTribISSQN } from './enums.js';
const DEFAULT_TP_AMB = '2';
const TP_EMIT_PRESTADOR = '1';
const DEFAULT_TRIB_ISSQN = '1';
const DEFAULT_TP_RET_ISSQN = '1';
const DEFAULT_IND_TOT_TRIB = '0';
/**
 * Constrói uma `DPS` completa a partir de um subconjunto ergonômico de campos.
 * Cobre o caso comum (prestador brasileiro, serviço único, tomador BR opcional)
 * preenchendo todo o boilerplate do layout RTC v1.01.
 *
 * Para cenários avançados — exterior, obra, atvEvento, dedução/redução, IBSCBS —
 * construa `InfDPS` manualmente (todos os tipos da RTC estão exportados).
 */
export function buildDps(params) {
    assertSimplesNacionalConsistency(params.emitente.regime);
    assertAliqIssRange(params.valores.aliqIss);
    assertValoresConsistency(params.valores, params.emitente.regime);
    // E0532 — o serviço 99.01.01 não tem incidência de ISSQN: exige tribISSQN=4.
    if (params.servico.cTribNac === '990101' &&
        (params.valores.tribISSQN ?? DEFAULT_TRIB_ISSQN) !== TipoTribISSQN.NaoIncidencia) {
        throw new RuleViolationError("o serviço 99.01.01 não tem incidência de ISSQN: tribISSQN deve ser '4' (Não Incidência) — per E0532", 'E0532');
    }
    if (!params.skipCpfCnpjValidation) {
        assertIdentifiersDv(params);
    }
    const dhEmi = params.dhEmi ?? new Date();
    const dCompet = params.dCompet ?? new Date();
    const tpAmb = params.tpAmb ?? DEFAULT_TP_AMB;
    const Id = buildDpsId({
        cLocEmi: params.emitente.codMunicipio,
        tipoInsc: 'CNPJ',
        inscricaoFederal: params.emitente.cnpj,
        serie: params.serie,
        nDPS: params.nDPS,
    });
    const prest = buildInfoPrestador(params.emitente);
    const serv = buildServ(params.servico, params.emitente.codMunicipio);
    const valores = buildInfoValores(params.valores, params.emitente.regime.opSimpNac);
    const verAplic = params.verAplic ?? DEFAULT_VER_APLIC;
    assertVerAplic(verAplic);
    const infDPS = {
        Id,
        tpAmb,
        dhEmi,
        verAplic,
        serie: params.serie,
        nDPS: params.nDPS,
        dCompet,
        tpEmit: TP_EMIT_PRESTADOR,
        cLocEmi: params.emitente.codMunicipio,
        prest,
        ...(params.tomador ? { toma: buildInfoPessoa(params.tomador) } : {}),
        serv,
        valores,
    };
    return { versao: '1.01', infDPS };
}
// ---------------------------------------------------------------------------
function buildInfoPrestador(emit) {
    const regTrib = {
        opSimpNac: emit.regime.opSimpNac,
        ...(emit.regime.regApTribSN !== undefined ? { regApTribSN: emit.regime.regApTribSN } : {}),
        regEspTrib: emit.regime.regEspTrib,
    };
    // tpEmit='1' (prestador é o emitente): SEFIN preenche xNome e endereço a
    // partir do cadastro do CNPJ e rejeita o envio desses campos. buildDps sempre
    // usa tpEmit='1', então `xNome` e `end` ficam de fora — e `EmitenteInput` não
    // os expõe pra falhar em tempo de compilação.
    return {
        identificador: { CNPJ: emit.cnpj },
        ...(emit.inscricaoMunicipal ? { IM: emit.inscricaoMunicipal } : {}),
        ...(emit.fone ? { fone: emit.fone } : {}),
        ...(emit.email ? { email: emit.email } : {}),
        regTrib,
    };
}
function buildInfoPessoa(tomador) {
    const identificador = 'CNPJ' in tomador.documento ? { CNPJ: tomador.documento.CNPJ } : { CPF: tomador.documento.CPF };
    return {
        identificador,
        ...(tomador.inscricaoMunicipal ? { IM: tomador.inscricaoMunicipal } : {}),
        xNome: tomador.nome,
        ...(tomador.endereco ? { end: toEndereco(tomador.endereco) } : {}),
        ...(tomador.fone ? { fone: tomador.fone } : {}),
        ...(tomador.email ? { email: tomador.email } : {}),
    };
}
function toEndereco(e) {
    return {
        localidade: { endNac: { cMun: e.codMunicipio, CEP: e.cep } },
        xLgr: e.logradouro,
        nro: e.numero,
        ...(e.complemento ? { xCpl: e.complemento } : {}),
        xBairro: e.bairro,
    };
}
function buildServ(serv, cMunDefault) {
    const cLocPrestacao = serv.codMunicipioPrestacao ?? cMunDefault;
    // E0315 — '000' não é código de tributação municipal válido (passa no XSD).
    if (serv.cTribMun === '000') {
        throw new RuleViolationError("cTribMun não pode ser '000' — informe o código de tributação municipal real — per E0315", 'E0315');
    }
    // E1402 — subitem 200101 não admite cLocPrestacao '0000000' (Águas Marítimas).
    if (serv.cTribNac === '200101' && cLocPrestacao === '0000000') {
        throw new RuleViolationError("cTribNac=200101 não admite cLocPrestacao='0000000' (Águas Marítimas) — per E1402", 'E1402');
    }
    return {
        locPrest: { cLocPrestacao },
        cServ: {
            cTribNac: serv.cTribNac,
            ...(serv.cTribMun ? { cTribMun: serv.cTribMun } : {}),
            xDescServ: serv.descricao,
            ...(serv.cNBS ? { cNBS: serv.cNBS } : {}),
            ...(serv.codigoInterno ? { cIntContrib: serv.codigoInterno } : {}),
        },
    };
}
function buildInfoValores(v, opSimpNac) {
    // vReceb não é serializado: assertValoresConsistency já rejeita vReceb !== undefined
    // (E0424 — buildDps usa tpEmit=1).
    const vServPrest = {
        vServ: v.vServ,
    };
    const tribMun = {
        tribISSQN: v.tribISSQN ?? DEFAULT_TRIB_ISSQN,
        tpRetISSQN: v.tpRetISSQN ?? DEFAULT_TP_RET_ISSQN,
        ...(v.aliqIss > 0 ? { pAliq: v.aliqIss } : {}),
    };
    return {
        vServPrest,
        trib: { tribMun, totTrib: buildTotTrib(v, opSimpNac) },
    };
}
/**
 * Seleciona o membro do choice `totTrib` conforme a situação do emitente perante
 * o Simples Nacional (`opSimpNac`), aplicando E0710/E0712/E0713. `vTotTrib` e
 * `pTotTrib` (Lei da Transparência / IBPT) valem para qualquer regime; o
 * default — quando nada é informado — só existe para MEI (`indTotTrib='0'`).
 * Não Optante e ME/EPP exigem um membro explícito, senão lança fail-fast em vez
 * de produzir uma DPS que a SEFIN rejeitaria.
 */
function buildTotTrib(v, opSimpNac) {
    if (v.vTotTrib)
        return { vTotTrib: v.vTotTrib };
    if (v.pTotTrib)
        return { pTotTrib: v.pTotTrib };
    if (v.pTotTribSN !== undefined) {
        if (opSimpNac === OpcaoSimplesNacional.Mei) {
            throw new RuleViolationError('pTotTribSN não pode ser informado para MEI — per E0710', 'E0710');
        }
        if (opSimpNac === OpcaoSimplesNacional.NaoOptante) {
            throw new RuleViolationError('pTotTribSN não pode ser informado para Não Optante (use vTotTrib/pTotTrib) — per E0713', 'E0713');
        }
        return { pTotTribSN: v.pTotTribSN };
    }
    if (v.indTotTrib !== undefined) {
        if (opSimpNac === OpcaoSimplesNacional.MeEpp) {
            throw new RuleViolationError('indTotTrib não pode ser informado para ME/EPP (use pTotTribSN) — per E0712', 'E0712');
        }
        if (opSimpNac === OpcaoSimplesNacional.NaoOptante) {
            throw new RuleViolationError('indTotTrib não pode ser informado para Não Optante (use vTotTrib/pTotTrib) — per E0713', 'E0713');
        }
        return { indTotTrib: v.indTotTrib };
    }
    // Nenhum membro informado → default por regime.
    if (opSimpNac === OpcaoSimplesNacional.Mei) {
        return { indTotTrib: DEFAULT_IND_TOT_TRIB };
    }
    if (opSimpNac === OpcaoSimplesNacional.MeEpp) {
        throw new RuleViolationError('ME/EPP exige um total de tributos: informe pTotTribSN (ou vTotTrib/pTotTrib) — per E0712', 'E0712');
    }
    throw new RuleViolationError('Não Optante exige um total de tributos: informe vTotTrib ou pTotTrib — per E0713', 'E0713');
}
/**
 * `regApTribSN` é obrigatório quando `opSimpNac=MeEpp` ('3') per TCRegTrib do
 * RTC v1.01 — XSD não enforça, então a SEFIN rejeita após round-trip. Fail-fast
 * local para virar erro de tempo de build em vez de rejeição.
 */
/**
 * Valida o DV de CPF/CNPJ do emitente e do tomador (E0080/E0096/E0188/E0206) no
 * próprio builder, para que o caminho offline `buildDps` + `buildDpsXml`
 * (dry-run/preview, design principle #5) também rejeite DV inválido — não só o
 * `emitSeguro`. O XSD valida apenas a contagem de dígitos, não o DV.
 */
function assertIdentifiersDv(params) {
    validateCnpj(params.emitente.cnpj);
    if (params.tomador) {
        const doc = params.tomador.documento;
        if ('CNPJ' in doc)
            validateCnpj(doc.CNPJ);
        else
            validateCpf(doc.CPF);
    }
}
function assertSimplesNacionalConsistency(regime) {
    if (regime.opSimpNac === OpcaoSimplesNacional.MeEpp && regime.regApTribSN === undefined) {
        throw new RuleViolationError(`regApTribSN é obrigatório quando opSimpNac=MeEpp ('3') — per TCRegTrib do RTC v1.01 (E0166)`, 'E0166');
    }
    // E0162 — regApTribSN só se aplica a ME/EPP; Não Optante e MEI não podem informá-lo.
    if (regime.regApTribSN !== undefined &&
        (regime.opSimpNac === OpcaoSimplesNacional.NaoOptante ||
            regime.opSimpNac === OpcaoSimplesNacional.Mei)) {
        throw new RuleViolationError(`regApTribSN não pode ser informado quando opSimpNac=${regime.opSimpNac} (Não Optante/MEI) — per E0162`, 'E0162');
    }
}
/**
 * Consistência intra-DPS entre regime, alíquota e tributação do ISSQN — regras
 * de rejeição fechadas (sem consulta externa), checáveis no build:
 * - E0600: MEI (opSimpNac=2) não pode informar `aliqIss`.
 * - E0602: `aliqIss` não pode ser informada com `tribISSQN` 2/3/4 (imune/exportação/não-incidência).
 * - E0580: não pode haver retenção (`tpRetISSQN` 2/3) com `tribISSQN` 2/3/4.
 */
function assertValoresConsistency(v, regime) {
    // E0424 — vReceb só é válido com tpEmit=3 (intermediário); buildDps sempre usa
    // tpEmit=1 (prestador é o emitente), então vReceb aqui é rejeição garantida.
    if (v.vReceb !== undefined) {
        throw new RuleViolationError('vReceb não pode ser informado: buildDps usa tpEmit=1 (prestador é o emitente). vReceb só vale com tpEmit=3 (intermediário) — para esse cenário construa InfDPS manualmente — per E0424', 'E0424');
    }
    const tribISSQN = v.tribISSQN ?? DEFAULT_TRIB_ISSQN;
    const tpRet = v.tpRetISSQN ?? DEFAULT_TP_RET_ISSQN;
    const naoTributavel = tribISSQN === TipoTribISSQN.Imunidade ||
        tribISSQN === TipoTribISSQN.ExportacaoServico ||
        tribISSQN === TipoTribISSQN.NaoIncidencia;
    if (regime.opSimpNac === OpcaoSimplesNacional.Mei && v.aliqIss !== undefined) {
        throw new RuleViolationError('aliqIss não pode ser informada quando o prestador é MEI (opSimpNac=2) — per E0600', 'E0600');
    }
    if (naoTributavel && v.aliqIss !== undefined) {
        throw new RuleViolationError(`aliqIss não pode ser informada quando tribISSQN=${tribISSQN} (imune/exportação/não-incidência) — per E0602`, 'E0602');
    }
    if (naoTributavel &&
        (tpRet === TipoRetISSQN.RetidoPeloTomador || tpRet === TipoRetISSQN.RetidoPeloIntermediario)) {
        throw new RuleViolationError(`tpRetISSQN não pode indicar retenção (2/3) quando tribISSQN=${tribISSQN} (imune/exportação/não-incidência) — per E0580`, 'E0580');
    }
}
/**
 * `aliqIss` é em percentual (ex: `2.5` = 2,5%). Valores `0 < x < 0.5` são quase
 * sempre erro de fração-vs-percentual (ex: `0.025` em vez de `2.5`): o formatter
 * faria `(0.025).toFixed(2) === '0.03'` e a SEFIN aceitaria a nota com **0,03%**
 * em vez dos 2,5% pretendidos. ISS por LC 116 nunca é abaixo de 2%; o limite de
 * 0.5 é generoso pra regimes especiais e ainda pega a confusão de unidade.
 */
function assertAliqIssRange(aliqIss) {
    if (aliqIss === undefined || aliqIss === 0)
        return;
    if (aliqIss > 0 && aliqIss < 0.5) {
        const asPercent = aliqIss * 100;
        throw new RuleViolationError(`aliqIss=${aliqIss} parece ser uma fração, não um percentual. Para emitir alíquota de ${asPercent}%, passe aliqIss=${asPercent}. Se a alíquota é realmente abaixo de 0,5%, construa InfDPS manualmente.`, 'aliqIss');
    }
    // E0595 — teto constitucional do ISSQN é 5%; acima disso a SEFIN rejeita.
    if (aliqIss > 5) {
        throw new RuleViolationError(`aliqIss=${aliqIss}% excede o teto de 5% do ISSQN — per E0595`, 'E0595');
    }
}
/**
 * `TSVerAplic` (base `TSString`): 1 a 20 caracteres, todos imprimíveis
 * (`[!-ÿ]`), sem espaço/controle nas pontas — pattern
 * `[!-ÿ][ -ÿ]*[!-ÿ]|[!-ÿ]`. Fail-fast local em vez de rejeição XSD.
 */
const TSSTRING_PATTERN = /^(?:[!-ÿ][ -ÿ]*[!-ÿ]|[!-ÿ])$/u;
function assertVerAplic(verAplic) {
    if (verAplic.length < 1 || verAplic.length > 20) {
        throw new RuleViolationError(`verAplic deve ter entre 1 e 20 caracteres (atual: ${verAplic.length}) — per TSVerAplic do RTC v1.01`, 'TSVerAplic');
    }
    if (!TSSTRING_PATTERN.test(verAplic)) {
        throw new RuleViolationError('verAplic deve conter apenas caracteres imprimíveis, sem espaço ou controle nas pontas — per TSString do RTC v1.01', 'TSVerAplic');
    }
}
//# sourceMappingURL=build-dps.js.map