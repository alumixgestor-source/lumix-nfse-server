export { Ambiente, AMBIENTE_ENDPOINTS, TipoAmbiente } from './ambiente.js';
export { noopLogger } from './logging.js';
export { ClientClosedError, NfseClient } from './client.js';
export { providerFromFile } from './certificate/provider.js';
export { parsePfx } from './certificate/parse.js';
export { OpenNfseError } from './errors/base.js';
export { CertificateError, ExpiredCertificateError, InvalidCertificateError, InvalidCertificatePasswordError, } from './errors/certificate.js';
export { ForbiddenError, HttpError, HttpStatusError, NetworkError, NotFoundError, ServerError, TimeoutError, TooManyRequestsError, UnauthorizedError, } from './errors/http.js';
export { ReceitaRejectionError, receitaRejectionFromPostError, receitaRejectionFromResponseErro, } from './errors/receita.js';
export { InvalidCepError, InvalidChaveAcessoError, InvalidCnpjError, InvalidCpfError, InvalidDpsIdError, InvalidXmlError, RuleViolationError, ValidationError, XsdValidationError, } from './errors/validation.js';
export { AmbienteGerador, AmbienteGeradorEvento, CodigoNaoNif, CST, JustificativaAnaliseFiscalCancelamento, JustificativaAnaliseFiscalCancelamentoDeferido, JustificativaAnaliseFiscalCancelamentoIndeferido, JustificativaCancelamento, TipoEventoNfse, EnvioMDIC, FinalidadeNFSe, IndicadorDestinatario, IndicadorFinal, IndicadorTotalTributos, JustificativaSubstituicao, MecanismoApoioComExPrestador, MecanismoApoioComExTomador, ModoPrestacao, MotivoRejeicaoNfse, MotivoEmissaoTomadorIntermediario, MovimentacaoTemporariaBens, ObjetoLocacao, OpcaoSimplesNacional, ProcessoEmissao, RegimeApuracaoSimplesNacional, RegimeEspecialTributacao, SituacaoNfse, TipoAmbienteDps, TipoBeneficioMunicipal, TipoChaveDFe, TipoDedRed, TipoEmissao, TipoEmitenteDps, TipoEnteGovernamental, TipoExigSuspensa, TipoImunidadeISSQN, TipoOperacao, TipoReembolsoRepasse, TipoRetISSQN, TipoRetPisCofins, TipoTribISSQN, UF, VinculoPrestacao, } from './nfse/enums.js';
export { parseNfseXml } from './nfse/parse-xml.js';
export { buildDpsId, InvalidDpsIdParamError } from './nfse/dps-id.js';
export { buildDpsXml } from './nfse/build-xml.js';
export { buildDps } from './nfse/build-dps.js';
export { signDpsXml, DpsAlreadySignedError } from './nfse/sign-xml.js';
// v0.3 — eventos (cancelamento + substituição)
export { buildCancelamentoXml, buildSubstituicaoXml, } from './eventos/build-event-xml.js';
export { cancelar, substituir } from './eventos/cancelar.js';
export { buildEventoPedidoId, InvalidEventoPedidoIdParamError, } from './eventos/event-id.js';
export { parseEventoXml } from './eventos/parse-event.js';
export { postEvento } from './eventos/post-evento.js';
export { signPedRegEventoXml } from './eventos/sign-event.js';
// retry pipeline — transient classification + persistence + timing policy
export { defaultIsTransient } from './retry/transient.js';
export { createInMemoryRetryStore, isPendingEmission, isPendingEventoCancelamento, MissingRetryStoreError, pendingEmissionId, pendingEventId, } from './retry/store.js';
export { createDefaultRetryPolicy } from './retry/policy.js';
// v0.5 — Parâmetros Municipais
export { createInMemoryParametrosCache, DEFAULT_TTL_MS, } from './parametros-municipais/cache.js';
export { fetchAliquota, fetchBeneficio, fetchConvenio, fetchHistoricoAliquotas, fetchRegimesEspeciais, fetchRetencoes, } from './parametros-municipais/fetch.js';
// v0.7 — DANFSe PDF
export { gerarDanfse } from './danfse/gerar.js';
export { consultarDanfse } from './danfse/fetch.js';
export { validateDpsXml, validateEventoXml, validatePedRegEventoXml, } from './nfse/validate-xml.js';
export { existsDpsStatus, fetchDpsStatus } from './nfse/fetch-dps-status.js';
export { validateCnpj, validateCpf } from './fiscal/validate-cpf-cnpj.js';
export { createViaCepValidator } from './cep/viacep.js';
export { collectCepsFromDps, collectIdentifiersFromDps, } from './nfse/collect-from-dps.js';
export { createInMemoryDpsCounter, MissingDpsCounterError, } from './nfse/dps-counter.js';
export { StatusDistribuicao, TipoDocumento, TipoEvento } from './dfe/types.js';
//# sourceMappingURL=index.js.map