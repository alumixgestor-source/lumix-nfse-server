export var AmbienteGerador;
(function (AmbienteGerador) {
    AmbienteGerador["Prefeitura"] = "1";
    AmbienteGerador["SefinNacional"] = "2";
})(AmbienteGerador || (AmbienteGerador = {}));
export var TipoEmissao;
(function (TipoEmissao) {
    TipoEmissao["Normal"] = "1";
    TipoEmissao["TranscricaoLeiauteMunicipal"] = "2";
})(TipoEmissao || (TipoEmissao = {}));
export var ProcessoEmissao;
(function (ProcessoEmissao) {
    ProcessoEmissao["WebService"] = "1";
    ProcessoEmissao["Web"] = "2";
    ProcessoEmissao["App"] = "3";
})(ProcessoEmissao || (ProcessoEmissao = {}));
/**
 * Situação da NFS-e (`TStat`), campo `InfNFSe/cStat`. Valor gerado pela Sefin —
 * presente apenas no documento autorizado (caminho de leitura), nunca emitido.
 */
export var SituacaoNfse;
(function (SituacaoNfse) {
    SituacaoNfse["Gerada"] = "100";
    SituacaoNfse["DecisaoJudicial"] = "102";
    SituacaoNfse["Avulsa"] = "103";
    SituacaoNfse["Mei"] = "107";
})(SituacaoNfse || (SituacaoNfse = {}));
export var TipoAmbienteDps;
(function (TipoAmbienteDps) {
    TipoAmbienteDps["Producao"] = "1";
    TipoAmbienteDps["Homologacao"] = "2";
})(TipoAmbienteDps || (TipoAmbienteDps = {}));
/** Código do evento NFS-e (RTC v1.01). Subconjunto usado hoje. */
export var TipoEventoNfse;
(function (TipoEventoNfse) {
    TipoEventoNfse["Cancelamento"] = "101101";
    TipoEventoNfse["SolicitacaoAnaliseFiscalCancelamento"] = "101103";
    TipoEventoNfse["CancelamentoPorSubstituicao"] = "105102";
    TipoEventoNfse["CancelamentoDeferidoAnaliseFiscal"] = "105104";
    TipoEventoNfse["CancelamentoIndeferidoAnaliseFiscal"] = "105105";
    TipoEventoNfse["ConfirmacaoPrestador"] = "202201";
    TipoEventoNfse["ConfirmacaoTomador"] = "203202";
    TipoEventoNfse["ConfirmacaoIntermediario"] = "204203";
    TipoEventoNfse["ConfirmacaoTacita"] = "205204";
    TipoEventoNfse["RejeicaoPrestador"] = "202205";
    TipoEventoNfse["RejeicaoTomador"] = "203206";
    TipoEventoNfse["RejeicaoIntermediario"] = "204207";
    TipoEventoNfse["AnulacaoRejeicao"] = "205208";
    TipoEventoNfse["CancelamentoPorOficio"] = "305101";
    TipoEventoNfse["BloqueioPorOficio"] = "305102";
    TipoEventoNfse["DesbloqueioPorOficio"] = "305103";
    /**
     * Eventos sistêmicos da Sefin não declarados em `tiposEventos_v1.01.xsd`.
     * Aparecem no enum `tipoEvento` do endpoint `GET /nfse/{chave}/eventos/{tipoEvento}/{numSeqEvento}`.
     * Parser cai no fallback `unknown` ao recebê-los (shape exato não publicada).
     */
    TipoEventoNfse["EventoSistemico467201"] = "467201";
    TipoEventoNfse["EventoSistemico907201"] = "907201";
})(TipoEventoNfse || (TipoEventoNfse = {}));
/** Ambiente gerador do evento. Per XSD `TSAmbGeradorEvt`. */
export var AmbienteGeradorEvento;
(function (AmbienteGeradorEvento) {
    AmbienteGeradorEvento["Prefeitura"] = "1";
    AmbienteGeradorEvento["SefinNacional"] = "2";
    AmbienteGeradorEvento["AmbienteNacional"] = "3";
})(AmbienteGeradorEvento || (AmbienteGeradorEvento = {}));
/**
 * Códigos de justificativa para cancelamento (evento 101101). Per XSD
 * `TSCodJustCanc`.
 */
export var JustificativaCancelamento;
(function (JustificativaCancelamento) {
    JustificativaCancelamento["ErroEmissao"] = "1";
    JustificativaCancelamento["ServicoNaoPrestado"] = "2";
    JustificativaCancelamento["Outros"] = "9";
})(JustificativaCancelamento || (JustificativaCancelamento = {}));
export var TipoEmitenteDps;
(function (TipoEmitenteDps) {
    TipoEmitenteDps["Prestador"] = "1";
    TipoEmitenteDps["Tomador"] = "2";
    TipoEmitenteDps["Intermediario"] = "3";
})(TipoEmitenteDps || (TipoEmitenteDps = {}));
export var MotivoEmissaoTomadorIntermediario;
(function (MotivoEmissaoTomadorIntermediario) {
    MotivoEmissaoTomadorIntermediario["ImportacaoServico"] = "1";
    MotivoEmissaoTomadorIntermediario["TomadorObrigadoEmitir"] = "2";
    MotivoEmissaoTomadorIntermediario["RecusaEmissaoPrestador"] = "3";
    MotivoEmissaoTomadorIntermediario["RejeicaoNfsePrestador"] = "4";
})(MotivoEmissaoTomadorIntermediario || (MotivoEmissaoTomadorIntermediario = {}));
export var OpcaoSimplesNacional;
(function (OpcaoSimplesNacional) {
    OpcaoSimplesNacional["NaoOptante"] = "1";
    OpcaoSimplesNacional["Mei"] = "2";
    OpcaoSimplesNacional["MeEpp"] = "3";
})(OpcaoSimplesNacional || (OpcaoSimplesNacional = {}));
export var RegimeApuracaoSimplesNacional;
(function (RegimeApuracaoSimplesNacional) {
    RegimeApuracaoSimplesNacional["FederalEMunicipalPeloSN"] = "1";
    RegimeApuracaoSimplesNacional["FederalPeloSNMunicipalFora"] = "2";
    RegimeApuracaoSimplesNacional["FederalEMunicipalFora"] = "3";
})(RegimeApuracaoSimplesNacional || (RegimeApuracaoSimplesNacional = {}));
/** Regime especial de tributação (`TSRegEspTrib`). */
export var RegimeEspecialTributacao;
(function (RegimeEspecialTributacao) {
    RegimeEspecialTributacao["Nenhum"] = "0";
    RegimeEspecialTributacao["AtoCooperado"] = "1";
    RegimeEspecialTributacao["Estimativa"] = "2";
    RegimeEspecialTributacao["MicroempresaMunicipal"] = "3";
    RegimeEspecialTributacao["NotarioRegistrador"] = "4";
    RegimeEspecialTributacao["ProfissionalAutonomo"] = "5";
    RegimeEspecialTributacao["SociedadeProfissionais"] = "6";
    RegimeEspecialTributacao["Outros"] = "9";
})(RegimeEspecialTributacao || (RegimeEspecialTributacao = {}));
export var CodigoNaoNif;
(function (CodigoNaoNif) {
    CodigoNaoNif["NaoInformado"] = "0";
    CodigoNaoNif["Dispensado"] = "1";
    CodigoNaoNif["NaoExigido"] = "2";
})(CodigoNaoNif || (CodigoNaoNif = {}));
export var TipoTribISSQN;
(function (TipoTribISSQN) {
    TipoTribISSQN["OperacaoTributavel"] = "1";
    TipoTribISSQN["Imunidade"] = "2";
    TipoTribISSQN["ExportacaoServico"] = "3";
    TipoTribISSQN["NaoIncidencia"] = "4";
})(TipoTribISSQN || (TipoTribISSQN = {}));
export var TipoImunidadeISSQN;
(function (TipoImunidadeISSQN) {
    TipoImunidadeISSQN["NaoInformado"] = "0";
    TipoImunidadeISSQN["PatrimonioRendaServicos"] = "1";
    TipoImunidadeISSQN["TemplosDeCulto"] = "2";
    TipoImunidadeISSQN["PartidosPoliticos"] = "3";
    TipoImunidadeISSQN["LivrosJornais"] = "4";
    TipoImunidadeISSQN["FonogramasVideofonogramas"] = "5";
})(TipoImunidadeISSQN || (TipoImunidadeISSQN = {}));
export var TipoBeneficioMunicipal;
(function (TipoBeneficioMunicipal) {
    TipoBeneficioMunicipal["Isencao"] = "1";
    TipoBeneficioMunicipal["ReducaoPercentual"] = "2";
    TipoBeneficioMunicipal["ReducaoMonetaria"] = "3";
    TipoBeneficioMunicipal["AliquotaDiferenciada"] = "4";
})(TipoBeneficioMunicipal || (TipoBeneficioMunicipal = {}));
export var TipoExigSuspensa;
(function (TipoExigSuspensa) {
    TipoExigSuspensa["DecisaoJudicial"] = "1";
    TipoExigSuspensa["ProcessoAdministrativo"] = "2";
})(TipoExigSuspensa || (TipoExigSuspensa = {}));
export var TipoRetISSQN;
(function (TipoRetISSQN) {
    TipoRetISSQN["NaoRetido"] = "1";
    TipoRetISSQN["RetidoPeloTomador"] = "2";
    TipoRetISSQN["RetidoPeloIntermediario"] = "3";
})(TipoRetISSQN || (TipoRetISSQN = {}));
/**
 * Código de Situação Tributária do PIS/COFINS (`TSTipoCST`). Domínio completo
 * conforme NT SE/CGNFS-e nº 007 (em produção desde 2026-02-09) — antes a lib
 * só cobria `00`–`09` e rotulava `07` como "Tributável da Contribuição"
 * (errado: `07` é Isenta).
 */
export var CST;
(function (CST) {
    CST["Nenhum"] = "00";
    CST["TributavelAliquotaBasica"] = "01";
    CST["TributavelAliquotaDiferenciada"] = "02";
    CST["TributavelAliquotaPorUnidade"] = "03";
    CST["TributavelMonofasicaRevendaAliquotaZero"] = "04";
    CST["TributavelSubstituicaoTributaria"] = "05";
    CST["TributavelAliquotaZero"] = "06";
    CST["IsentaDaContribuicao"] = "07";
    CST["SemIncidenciaDaContribuicao"] = "08";
    CST["SuspensaoDaContribuicao"] = "09";
    CST["OutrasOperacoesDeSaida"] = "49";
    CST["CreditoVinculadoExclusivamenteReceitaTributadaMI"] = "50";
    CST["CreditoVinculadoExclusivamenteReceitaNaoTributadaMI"] = "51";
    CST["CreditoVinculadoExclusivamenteReceitaExportacao"] = "52";
    CST["CreditoVinculadoReceitasTributadasNaoTributadasMI"] = "53";
    CST["CreditoVinculadoReceitasTributadasMIExportacao"] = "54";
    CST["CreditoVinculadoReceitasNaoTributadasMIExportacao"] = "55";
    CST["CreditoVinculadoReceitasTributadasNaoTributadasMIExportacao"] = "56";
    CST["CreditoPresumidoAquisicaoExclusivamenteReceitaTributadaMI"] = "60";
    CST["CreditoPresumidoAquisicaoExclusivamenteReceitaNaoTributadaMI"] = "61";
    CST["CreditoPresumidoAquisicaoExclusivamenteReceitaExportacao"] = "62";
    CST["CreditoPresumidoAquisicaoReceitasTributadasNaoTributadasMI"] = "63";
    CST["CreditoPresumidoAquisicaoReceitasTributadasMIExportacao"] = "64";
    CST["CreditoPresumidoAquisicaoReceitasNaoTributadasMIExportacao"] = "65";
    CST["CreditoPresumidoAquisicaoReceitasTributadasNaoTributadasMIExportacao"] = "66";
    CST["CreditoPresumidoOutrasOperacoes"] = "67";
    CST["AquisicaoSemDireitoCredito"] = "70";
    CST["AquisicaoComIsencao"] = "71";
    CST["AquisicaoComSuspensao"] = "72";
    CST["AquisicaoAliquotaZero"] = "73";
    CST["AquisicaoSemIncidenciaContribuicao"] = "74";
    CST["AquisicaoSubstituicaoTributaria"] = "75";
    CST["OutrasOperacoesDeEntrada"] = "98";
    CST["OutrasOperacoes"] = "99";
})(CST || (CST = {}));
/**
 * Tipo de retenção de PIS/COFINS e CSLL (`TSTipoRetPISCofins`). Domínio
 * expandido pela NT SE/CGNFS-e nº 007 (em produção desde 2026-02-09): antes a
 * lib (e o schema) só aceitavam `1`/`2`; agora `0` e `3`–`9` cobrem também a
 * CSLL. Os códigos `1`/`2` serão suprimidos quando o grupo `IBSCBS` se tornar
 * obrigatório — mantidos por ora para a transição.
 */
export var TipoRetPisCofins;
(function (TipoRetPisCofins) {
    TipoRetPisCofins["PisCofinsCsllNaoRetidos"] = "0";
    TipoRetPisCofins["PisCofinsRetidos"] = "1";
    TipoRetPisCofins["PisCofinsNaoRetidos"] = "2";
    TipoRetPisCofins["PisCofinsCsllRetidos"] = "3";
    TipoRetPisCofins["PisCofinsRetidosCsllNaoRetido"] = "4";
    TipoRetPisCofins["PisRetidoCofinsCsllNaoRetido"] = "5";
    TipoRetPisCofins["CofinsRetidoPisCsllNaoRetido"] = "6";
    TipoRetPisCofins["PisNaoRetidoCofinsCsllRetidos"] = "7";
    TipoRetPisCofins["PisCofinsNaoRetidosCsllRetido"] = "8";
    TipoRetPisCofins["CofinsNaoRetidoPisCsllRetidos"] = "9";
})(TipoRetPisCofins || (TipoRetPisCofins = {}));
export var IndicadorTotalTributos;
(function (IndicadorTotalTributos) {
    IndicadorTotalTributos["Nao"] = "0";
})(IndicadorTotalTributos || (IndicadorTotalTributos = {}));
export var TipoDedRed;
(function (TipoDedRed) {
    TipoDedRed["AlimentacaoBebidas"] = "1";
    TipoDedRed["Materiais"] = "2";
    TipoDedRed["ProducaoExterna"] = "3";
    TipoDedRed["ReembolsoDespesas"] = "4";
    TipoDedRed["RepasseConsorciado"] = "5";
    TipoDedRed["RepassePlanoSaude"] = "6";
    TipoDedRed["Servicos"] = "7";
    TipoDedRed["SubempreitadaMaoObra"] = "8";
    TipoDedRed["ProfissionalParceiro"] = "9";
    TipoDedRed["Outras"] = "99";
})(TipoDedRed || (TipoDedRed = {}));
export var JustificativaSubstituicao;
(function (JustificativaSubstituicao) {
    JustificativaSubstituicao["DesenquadramentoSN"] = "01";
    JustificativaSubstituicao["EnquadramentoSN"] = "02";
    JustificativaSubstituicao["InclusaoImunidadeIsencao"] = "03";
    JustificativaSubstituicao["ExclusaoImunidadeIsencao"] = "04";
    JustificativaSubstituicao["RejeicaoTomadorIntermediario"] = "05";
    JustificativaSubstituicao["Outros"] = "99";
})(JustificativaSubstituicao || (JustificativaSubstituicao = {}));
/**
 * Código do motivo da solicitação de análise fiscal para cancelamento de
 * NFS-e (evento 101103). Per XSD `TSCodJustAnaliseFiscalCanc`.
 */
export var JustificativaAnaliseFiscalCancelamento;
(function (JustificativaAnaliseFiscalCancelamento) {
    JustificativaAnaliseFiscalCancelamento["ErroEmissao"] = "1";
    JustificativaAnaliseFiscalCancelamento["ServicoNaoPrestado"] = "2";
    JustificativaAnaliseFiscalCancelamento["Outros"] = "9";
})(JustificativaAnaliseFiscalCancelamento || (JustificativaAnaliseFiscalCancelamento = {}));
/**
 * Resposta da análise da solicitação de cancelamento extemporâneo — deferido
 * (evento 105104). Per XSD `TSCodJustAnaliseFiscalCancDef`.
 */
export var JustificativaAnaliseFiscalCancelamentoDeferido;
(function (JustificativaAnaliseFiscalCancelamentoDeferido) {
    JustificativaAnaliseFiscalCancelamentoDeferido["Deferido"] = "1";
})(JustificativaAnaliseFiscalCancelamentoDeferido || (JustificativaAnaliseFiscalCancelamentoDeferido = {}));
/**
 * Resposta da análise da solicitação de cancelamento extemporâneo —
 * indeferido (evento 105105). Per XSD `TSCodJustAnaliseFiscalCancIndef`.
 */
export var JustificativaAnaliseFiscalCancelamentoIndeferido;
(function (JustificativaAnaliseFiscalCancelamentoIndeferido) {
    JustificativaAnaliseFiscalCancelamentoIndeferido["Indeferido"] = "1";
    JustificativaAnaliseFiscalCancelamentoIndeferido["IndeferidoSemAnaliseDeMerito"] = "2";
})(JustificativaAnaliseFiscalCancelamentoIndeferido || (JustificativaAnaliseFiscalCancelamentoIndeferido = {}));
/**
 * Motivo da rejeição de NFS-e pelo prestador/tomador/intermediário
 * (eventos 202205, 203206, 204207, no campo `infRej.cMotivo`). Per XSD
 * `TSCodMotivoRejeicao`.
 */
export var MotivoRejeicaoNfse;
(function (MotivoRejeicaoNfse) {
    MotivoRejeicaoNfse["Duplicidade"] = "1";
    MotivoRejeicaoNfse["JaEmitidaPeloTomador"] = "2";
    MotivoRejeicaoNfse["SemFatoGerador"] = "3";
    MotivoRejeicaoNfse["ErroResponsabilidadeTributaria"] = "4";
    MotivoRejeicaoNfse["ErroValorOuDataFatoGerador"] = "5";
    MotivoRejeicaoNfse["Outros"] = "9";
})(MotivoRejeicaoNfse || (MotivoRejeicaoNfse = {}));
export var ModoPrestacao;
(function (ModoPrestacao) {
    ModoPrestacao["Desconhecido"] = "0";
    ModoPrestacao["Transfronteirico"] = "1";
    ModoPrestacao["ConsumoNoBrasil"] = "2";
    ModoPrestacao["PresencaComercialExterior"] = "3";
    ModoPrestacao["MovimentoTemporarioPF"] = "4";
})(ModoPrestacao || (ModoPrestacao = {}));
export var VinculoPrestacao;
(function (VinculoPrestacao) {
    VinculoPrestacao["SemVinculo"] = "0";
    VinculoPrestacao["Controlada"] = "1";
    VinculoPrestacao["Controladora"] = "2";
    VinculoPrestacao["Coligada"] = "3";
    VinculoPrestacao["Matriz"] = "4";
    VinculoPrestacao["FilialSucursal"] = "5";
    VinculoPrestacao["OutroVinculo"] = "6";
    VinculoPrestacao["Desconhecido"] = "9";
})(VinculoPrestacao || (VinculoPrestacao = {}));
export var MovimentacaoTemporariaBens;
(function (MovimentacaoTemporariaBens) {
    MovimentacaoTemporariaBens["Desconhecido"] = "0";
    MovimentacaoTemporariaBens["Nao"] = "1";
    MovimentacaoTemporariaBens["DeclaracaoImportacao"] = "2";
    MovimentacaoTemporariaBens["DeclaracaoExportacao"] = "3";
})(MovimentacaoTemporariaBens || (MovimentacaoTemporariaBens = {}));
export var EnvioMDIC;
(function (EnvioMDIC) {
    EnvioMDIC["NaoEnviar"] = "0";
    EnvioMDIC["Enviar"] = "1";
})(EnvioMDIC || (EnvioMDIC = {}));
/**
 * Mecanismo de apoio/fomento ao Comércio Exterior utilizado pelo **prestador**
 * (`TSMecAFComExPrest`), campo `comExt/mecAFComexP`.
 */
export var MecanismoApoioComExPrestador;
(function (MecanismoApoioComExPrestador) {
    MecanismoApoioComExPrestador["Desconhecido"] = "00";
    MecanismoApoioComExPrestador["Nenhum"] = "01";
    /** ACC — Adiantamento sobre Contrato de Câmbio. */
    MecanismoApoioComExPrestador["Acc"] = "02";
    /** ACE — Adiantamento sobre Cambiais Entregues. */
    MecanismoApoioComExPrestador["Ace"] = "03";
    MecanismoApoioComExPrestador["BndesEximPosEmbarque"] = "04";
    MecanismoApoioComExPrestador["BndesEximPreEmbarque"] = "05";
    /** FGE — Fundo de Garantia à Exportação. */
    MecanismoApoioComExPrestador["Fge"] = "06";
    MecanismoApoioComExPrestador["ProexEqualizacao"] = "07";
    MecanismoApoioComExPrestador["ProexFinanciamento"] = "08";
})(MecanismoApoioComExPrestador || (MecanismoApoioComExPrestador = {}));
/**
 * Mecanismo de apoio/fomento ao Comércio Exterior utilizado pelo **tomador**
 * (`TSMecAFComExToma`), campo `comExt/mecAFComexT`.
 */
export var MecanismoApoioComExTomador;
(function (MecanismoApoioComExTomador) {
    MecanismoApoioComExTomador["Desconhecido"] = "00";
    MecanismoApoioComExTomador["Nenhum"] = "01";
    MecanismoApoioComExTomador["AdmPublicaReprInternacional"] = "02";
    MecanismoApoioComExTomador["AlugueisArrendMercantilMaquinas"] = "03";
    MecanismoApoioComExTomador["ArrendamentoMercantilAeronaveTransporteAereo"] = "04";
    MecanismoApoioComExTomador["ComissaoAgentesExternosExportacao"] = "05";
    MecanismoApoioComExTomador["DespesasArmazenagemTransporteCargaExterior"] = "06";
    MecanismoApoioComExTomador["EventosFifaSubsidiaria"] = "07";
    MecanismoApoioComExTomador["EventosFifa"] = "08";
    MecanismoApoioComExTomador["FretesArrendamentosEmbarcacoesAeronaves"] = "09";
    MecanismoApoioComExTomador["MaterialAeronautico"] = "10";
    MecanismoApoioComExTomador["PromocaoBensExterior"] = "11";
    MecanismoApoioComExTomador["PromocaoDestinosTuristicosBrasileiros"] = "12";
    MecanismoApoioComExTomador["PromocaoBrasilExterior"] = "13";
    MecanismoApoioComExTomador["PromocaoServicosExterior"] = "14";
    MecanismoApoioComExTomador["Recine"] = "15";
    MecanismoApoioComExTomador["Recopa"] = "16";
    MecanismoApoioComExTomador["RegistroManutencaoMarcasPatentes"] = "17";
    MecanismoApoioComExTomador["Reicomp"] = "18";
    MecanismoApoioComExTomador["Reidi"] = "19";
    MecanismoApoioComExTomador["Repenec"] = "20";
    MecanismoApoioComExTomador["Repes"] = "21";
    MecanismoApoioComExTomador["Retaero"] = "22";
    MecanismoApoioComExTomador["Retid"] = "23";
    MecanismoApoioComExTomador["RoyaltiesAssistenciaTecnicaCientifica"] = "24";
    MecanismoApoioComExTomador["ServicosAvaliacaoConformidadeOMC"] = "25";
    MecanismoApoioComExTomador["Zpe"] = "26";
})(MecanismoApoioComExTomador || (MecanismoApoioComExTomador = {}));
export var ObjetoLocacao;
(function (ObjetoLocacao) {
    ObjetoLocacao["Ferrovia"] = "1";
    ObjetoLocacao["Rodovia"] = "2";
    ObjetoLocacao["Postes"] = "3";
    ObjetoLocacao["Cabos"] = "4";
    ObjetoLocacao["Dutos"] = "5";
    ObjetoLocacao["CondutosOutros"] = "6";
})(ObjetoLocacao || (ObjetoLocacao = {}));
export var FinalidadeNFSe;
(function (FinalidadeNFSe) {
    FinalidadeNFSe["Regular"] = "0";
})(FinalidadeNFSe || (FinalidadeNFSe = {}));
export var IndicadorFinal;
(function (IndicadorFinal) {
    IndicadorFinal["Nao"] = "0";
    IndicadorFinal["Sim"] = "1";
})(IndicadorFinal || (IndicadorFinal = {}));
/**
 * Indicador do destinatário dos serviços (`TSRTCIndDest`), campo
 * `IBSCBS/.../indDest`.
 */
export var IndicadorDestinatario;
(function (IndicadorDestinatario) {
    /** O destinatário é o próprio tomador/adquirente (tomador = adquirente = destinatário). */
    IndicadorDestinatario["TomadorEhDestinatario"] = "0";
    /** O destinatário não é o próprio adquirente (tomador = adquirente ≠ destinatário). */
    IndicadorDestinatario["DestinatarioDistinto"] = "1";
})(IndicadorDestinatario || (IndicadorDestinatario = {}));
export var TipoOperacao;
(function (TipoOperacao) {
    TipoOperacao["FornecimentoComPagamentoPosterior"] = "1";
    TipoOperacao["RecebimentoPagamentoFornecimentoRealizado"] = "2";
    TipoOperacao["FornecimentoComPagamentoJaRealizado"] = "3";
    TipoOperacao["RecebimentoPagamentoFornecimentoPosterior"] = "4";
    TipoOperacao["FornecimentoRecebimentoConcomitantes"] = "5";
})(TipoOperacao || (TipoOperacao = {}));
/** Tipo de ente governamental (`TSRTCTpEnteGov`). */
export var TipoEnteGovernamental;
(function (TipoEnteGovernamental) {
    TipoEnteGovernamental["Uniao"] = "1";
    TipoEnteGovernamental["Estado"] = "2";
    TipoEnteGovernamental["DistritoFederal"] = "3";
    TipoEnteGovernamental["Municipio"] = "4";
})(TipoEnteGovernamental || (TipoEnteGovernamental = {}));
/** Tipo de reembolso/repasse/ressarcimento (`TSRTCTpReeRepRes`). */
export var TipoReembolsoRepasse;
(function (TipoReembolsoRepasse) {
    TipoReembolsoRepasse["RepasseIntermediacaoImoveis"] = "01";
    TipoReembolsoRepasse["RepasseFornecedorAgenciaTurismo"] = "02";
    TipoReembolsoRepasse["ReembolsoAgenciaPublicidadeProducaoExterna"] = "03";
    TipoReembolsoRepasse["ReembolsoAgenciaPublicidadeMidia"] = "04";
    TipoReembolsoRepasse["Outros"] = "99";
})(TipoReembolsoRepasse || (TipoReembolsoRepasse = {}));
/** Tipo da chave do documento fiscal referenciado (`TSRTCTipoChaveDFe`). */
export var TipoChaveDFe;
(function (TipoChaveDFe) {
    TipoChaveDFe["Nfse"] = "1";
    TipoChaveDFe["NFe"] = "2";
    TipoChaveDFe["CTe"] = "3";
    TipoChaveDFe["Outro"] = "9";
})(TipoChaveDFe || (TipoChaveDFe = {}));
export var UF;
(function (UF) {
    UF["AC"] = "AC";
    UF["AL"] = "AL";
    UF["AP"] = "AP";
    UF["AM"] = "AM";
    UF["BA"] = "BA";
    UF["CE"] = "CE";
    UF["DF"] = "DF";
    UF["ES"] = "ES";
    UF["GO"] = "GO";
    UF["MA"] = "MA";
    UF["MT"] = "MT";
    UF["MS"] = "MS";
    UF["MG"] = "MG";
    UF["PA"] = "PA";
    UF["PB"] = "PB";
    UF["PR"] = "PR";
    UF["PE"] = "PE";
    UF["PI"] = "PI";
    UF["RJ"] = "RJ";
    UF["RN"] = "RN";
    UF["RS"] = "RS";
    UF["RO"] = "RO";
    UF["RR"] = "RR";
    UF["SC"] = "SC";
    UF["SP"] = "SP";
    UF["SE"] = "SE";
    UF["TO"] = "TO";
})(UF || (UF = {}));
//# sourceMappingURL=enums.js.map