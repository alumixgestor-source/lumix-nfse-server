import type { ConsultaAliquotasResult, ConsultaBeneficioResult, ConsultaConvenioResult, ConsultaRegimesEspeciaisResult, ConsultaRetencoesResult } from './types.js';
interface RawAliquota {
    readonly Incidencia?: string | null;
    readonly Aliq?: number | null;
    readonly DtIni: string;
    readonly DtFim?: string | null;
}
interface RawResultadoConsultaAliquotas {
    readonly mensagem?: string | null;
    readonly aliquotas?: Record<string, RawAliquota[] | null> | null;
}
export declare function parseAliquotasResult(raw: RawResultadoConsultaAliquotas): ConsultaAliquotasResult;
interface RawBeneficioServico {
    readonly codigoServico?: string | null;
    readonly dataInicioVigencia: string;
    readonly dataFimVigencia?: string | null;
}
interface RawBeneficioInscricao {
    readonly tipoInscricao: number;
    readonly inscricao?: string | null;
    readonly dataInicioVigencia: string;
    readonly dataFimVigencia?: string | null;
}
interface RawBeneficio {
    readonly codigoBeneficio?: string | null;
    readonly descricao?: string | null;
    readonly dataInicioVigencia: string;
    readonly dataFimVigencia?: string | null;
    readonly tipoBeneficio: number;
    readonly tipoReducaoBC?: number | null;
    readonly reducaoPercentualBC?: number | null;
    readonly aliquotaDiferenciada?: number | null;
    readonly restritoAoMunicipio?: boolean | null;
    readonly servicos?: RawBeneficioServico[] | null;
    readonly contribuintes?: RawBeneficioInscricao[] | null;
}
interface RawResultadoConsultaBeneficio {
    readonly mensagem?: string | null;
    readonly beneficio?: RawBeneficio | null;
}
export declare function parseBeneficioResult(raw: RawResultadoConsultaBeneficio): ConsultaBeneficioResult;
interface RawParametrosConvenio {
    readonly tipoConvenioDeserializationSetter: number;
    readonly aderenteAmbienteNacional: number;
    readonly aderenteEmissorNacional: number;
    readonly situacaoEmissaoPadraoContribuintesRFB: number;
    readonly aderenteMAN: number;
    readonly permiteAproveitametoDeCreditos?: boolean | null;
}
interface RawResultadoConsultaConvenio {
    readonly mensagem?: string | null;
    readonly parametrosConvenio?: RawParametrosConvenio | null;
}
export declare function parseConvenioResult(raw: RawResultadoConsultaConvenio): ConsultaConvenioResult;
interface RawRegimeEspecial {
    readonly situacao: number;
    readonly dataInicio: string;
    readonly dataFim?: string | null;
    readonly observacoes?: string | null;
}
interface RawResultadoConsultaRegimesEspeciais {
    readonly mensagem?: string | null;
    readonly regimesEspeciais?: Record<string, Record<string, RawRegimeEspecial[] | null> | null> | null;
}
export declare function parseRegimesEspeciaisResult(raw: RawResultadoConsultaRegimesEspeciais): ConsultaRegimesEspeciaisResult;
interface RawRetencaoArtigoSexto {
    readonly dataInicioVigencia: string;
    readonly dataFimVigencia?: string | null;
}
interface RawRetencoesArtigoSexto {
    readonly habilitado: boolean;
    readonly historico?: RawRetencaoArtigoSexto[] | null;
}
interface RawRetencaoMunicipalServico {
    readonly dataInicioVigencia: string;
    readonly dataFimVigencia?: string | null;
}
interface RawRetencaoMunicipalPorCodigoServico {
    readonly codigoCompleto?: string | null;
    readonly historico?: RawRetencaoMunicipalServico[] | null;
}
interface RawRetencaoMunicipal {
    readonly descricao?: string | null;
    readonly dataInicioVigencia: string;
    readonly dataFimVigencia?: string | null;
    readonly tiposRetencao?: number[] | null;
    readonly servicos?: RawRetencaoMunicipalPorCodigoServico[] | null;
}
interface RawRetencoes {
    readonly artigoSexto?: RawRetencoesArtigoSexto | null;
    readonly retencoesMunicipais?: RawRetencaoMunicipal[] | null;
}
interface RawResultadoConsultaRetencoes {
    readonly mensagem?: string | null;
    readonly retencoes?: RawRetencoes | null;
}
export declare function parseRetencoesResult(raw: RawResultadoConsultaRetencoes): ConsultaRetencoesResult;
export type { RawResultadoConsultaAliquotas, RawResultadoConsultaBeneficio, RawResultadoConsultaConvenio, RawResultadoConsultaRegimesEspeciais, RawResultadoConsultaRetencoes, };
//# sourceMappingURL=parse.d.ts.map