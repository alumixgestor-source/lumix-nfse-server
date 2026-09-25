import { TipoAmbiente } from '../ambiente.js';
import { gerarDanfse as gerarDanfseLocal } from '../danfse/gerar.js';
import { StatusDistribuicao } from '../dfe/types.js';
import { TimeoutError } from '../errors/http.js';
import { ReceitaRejectionError } from '../errors/receita.js';
import { InvalidChaveAcessoError, InvalidDpsIdError, NotFoundError, } from '../index.js';
import { buildDps } from '../nfse/build-dps.js';
import { buildDpsId } from '../nfse/dps-id.js';
import { FakeState } from './fake-state.js';
import { FakeSeed } from './seed.js';
import { synthChaveAcesso, synthNfse } from './synth.js';
const REGEX_CHAVE = /^\d{50}$/;
const REGEX_ID_DPS = /^DPS\d{42}$/;
/**
 * Dublê em memória do `NfseClient` para testes de consumidores. Expõe a mesma
 * superfície pública, mas:
 *  - **Não abre conexão** com SEFIN/ADN.
 *  - Mantém estado in-memory (emitidas, canceladas, substituídas, parâmetros).
 *  - Oferece API de seed (`fake.seed.*`) e simulação de falhas
 *    (`fake.failNextEmit`, `fake.failNextCancel`).
 *  - **Executa as mesmas validações offline** (CPF/CNPJ, XSD, CEP) que o real
 *    quando `skipValidation` etc. não são passados — assim o consumidor testa
 *    o caminho de validação sem mock adicional.
 *
 * Estrutural-compatível com `NfseClient` — se você tipar suas dependências
 * como `NfseClientLike`, pode injetar qualquer um.
 */
export class NfseClientFake {
    state = new FakeState();
    seed;
    /** Ambiente simulado. Default `ProducaoRestrita`. */
    ambiente;
    constructor(options) {
        this.ambiente = options?.ambiente ?? TipoAmbiente.Homologacao;
        this.seed = new FakeSeed(this.state);
    }
    // -------------------------------------------------------------------------
    // Simulação de falhas
    // -------------------------------------------------------------------------
    /** Próxima chamada de `emitir()` irá falhar com o erro programado. */
    failNextEmit(failure) {
        this.state.nextEmitFailure = failure;
    }
    /** Próxima chamada de `cancelar()` irá falhar com o erro programado. */
    failNextCancel(failure) {
        this.state.nextCancelFailure = failure;
    }
    /** Limpa todo o estado (seeds + failures + emissões). */
    reset() {
        this.state.reset();
    }
    // -------------------------------------------------------------------------
    // Consulta
    // -------------------------------------------------------------------------
    async fetchByChave(chaveAcesso) {
        if (!REGEX_CHAVE.test(chaveAcesso)) {
            throw new InvalidChaveAcessoError(chaveAcesso);
        }
        const nfse = this.state.emitted.get(chaveAcesso);
        if (!nfse) {
            throw new NotFoundError(`chave ${chaveAcesso} não seedada no fake`);
        }
        return {
            chaveAcesso,
            xmlNfse: nfse.xmlNfse,
            nfse: nfse.nfse,
            tipoAmbiente: nfse.tipoAmbiente,
            versaoAplicativo: nfse.versaoAplicativo,
            dataHoraProcessamento: nfse.dataHoraProcessamento,
        };
    }
    async fetchDpsStatus(idDps) {
        if (!REGEX_ID_DPS.test(idDps)) {
            throw new InvalidDpsIdError(idDps);
        }
        for (const nfse of this.state.emitted.values()) {
            if (nfse.idDps === idDps) {
                return {
                    chaveAcesso: nfse.chaveAcesso,
                    idDps,
                    tipoAmbiente: nfse.tipoAmbiente,
                    versaoAplicativo: nfse.versaoAplicativo,
                    dataHoraProcessamento: nfse.dataHoraProcessamento,
                };
            }
        }
        throw new NotFoundError(`idDps ${idDps} não encontrado no fake`);
    }
    async existsDpsStatus(idDps) {
        try {
            await this.fetchDpsStatus(idDps);
            return true;
        }
        catch (err) {
            if (err instanceof NotFoundError)
                return false;
            throw err;
        }
    }
    async fetchByNsu(params) {
        const { ultimoNsu } = params;
        const docs = this.state.dfe.filter((d) => d.nsu > ultimoNsu);
        const finalNsu = docs.length ? (docs[docs.length - 1]?.nsu ?? ultimoNsu) : ultimoNsu;
        return {
            status: docs.length > 0
                ? StatusDistribuicao.DocumentosEncontrados
                : StatusDistribuicao.NenhumDocumento,
            ultimoNsu: finalNsu,
            documentos: [...docs],
            alertas: [],
            erros: [],
            tipoAmbiente: this.ambiente,
            versaoAplicativo: 'NfseClientFake/0.6',
            dataHoraProcessamento: new Date(),
        };
    }
    // -------------------------------------------------------------------------
    // Emissão
    // -------------------------------------------------------------------------
    async emitir(params) {
        const failure = this.consumeFailure('emit');
        if (params.dryRun) {
            const nDPS = params.nDPS ?? '1';
            const dps = buildDps({ ...params, nDPS });
            return {
                dryRun: true,
                xmlDpsAssinado: `<?xml version="1.0"?><DPS versao="1.01"><infDPS Id="${dps.infDPS.Id}"/></DPS>`,
                xmlDpsGZipB64: 'FAKE_GZIP_B64',
            };
        }
        if (failure?.kind === 'rejection') {
            throw new ReceitaRejectionError({
                mensagens: [
                    {
                        codigo: failure.codigo,
                        descricao: failure.descricao,
                        ...(failure.complemento ? { complemento: failure.complemento } : {}),
                    },
                ],
            });
        }
        const nDPS = params.nDPS ?? String(this.state.nextSequential++);
        const idDps = buildDpsId({
            cLocEmi: params.emitente.codMunicipio,
            tipoInsc: 'CNPJ',
            inscricaoFederal: params.emitente.cnpj,
            serie: params.serie,
            nDPS,
        });
        const dps = buildDps({ ...params, nDPS });
        if (failure?.kind === 'transient') {
            const error = new TimeoutError(5000, {
                cause: new Error(failure.message ?? 'fake transient'),
            });
            const pending = {
                id: `emission:${idDps}`,
                kind: 'emission',
                idDps,
                emitenteCnpj: params.emitente.cnpj,
                serie: params.serie,
                nDPS,
                xmlAssinado: '<DPS/>',
                firstAttemptAt: new Date(),
                lastAttemptAt: new Date(),
                lastError: { message: error.message, errorName: error.name, transient: true },
            };
            return { status: 'retry_pending', pending, error };
        }
        const chaveAcesso = synthChaveAcesso(this.state.nextSequential++, params.emitente.cnpj);
        const nfse = synthNfse(dps, chaveAcesso, this.ambiente);
        const result = {
            chaveAcesso,
            idDps,
            xmlNfse: `<NFSe versao="1.01"><infNFSe Id="NFS${chaveAcesso}"/></NFSe>`,
            nfse,
            alertas: [],
            tipoAmbiente: this.ambiente,
            versaoAplicativo: 'NfseClientFake/0.6',
            dataHoraProcessamento: new Date(),
        };
        this.state.emitted.set(chaveAcesso, result);
        return { status: 'ok', nfse: result };
    }
    async emitirDpsPronta(dps, options) {
        if (options?.dryRun) {
            return {
                dryRun: true,
                xmlDpsAssinado: `<?xml version="1.0"?><DPS versao="${dps.versao}"><infDPS Id="${dps.infDPS.Id}"/></DPS>`,
                xmlDpsGZipB64: 'FAKE_GZIP_B64',
            };
        }
        const failure = this.consumeFailure('emit');
        if (failure?.kind === 'rejection') {
            throw new ReceitaRejectionError({
                mensagens: [
                    {
                        codigo: failure.codigo,
                        descricao: failure.descricao,
                        ...(failure.complemento ? { complemento: failure.complemento } : {}),
                    },
                ],
            });
        }
        if (failure?.kind === 'transient') {
            throw new TimeoutError(5000, { cause: new Error(failure.message ?? 'fake transient') });
        }
        const cnpj = 'CNPJ' in dps.infDPS.prest.identificador
            ? dps.infDPS.prest.identificador.CNPJ
            : '00000000000000';
        const chaveAcesso = synthChaveAcesso(this.state.nextSequential++, cnpj);
        const nfse = synthNfse(dps, chaveAcesso, this.ambiente);
        const result = {
            chaveAcesso,
            idDps: dps.infDPS.Id,
            xmlNfse: `<NFSe versao="1.01"><infNFSe Id="NFS${chaveAcesso}"/></NFSe>`,
            nfse,
            alertas: [],
            tipoAmbiente: this.ambiente,
            versaoAplicativo: 'NfseClientFake/0.6',
            dataHoraProcessamento: new Date(),
        };
        this.state.emitted.set(chaveAcesso, result);
        return result;
    }
    async emitirEmLote(dpsList, _options) {
        const items = [];
        let successCount = 0;
        let failureCount = 0;
        for (const dps of dpsList) {
            try {
                const result = await this.emitirDpsPronta(dps);
                items.push({ status: 'success', dps, result });
                successCount++;
            }
            catch (err) {
                items.push({
                    status: 'failure',
                    dps,
                    error: err instanceof Error ? err : new Error(String(err)),
                });
                failureCount++;
            }
        }
        return { items, successCount, failureCount, skippedCount: 0 };
    }
    // -------------------------------------------------------------------------
    // Eventos
    // -------------------------------------------------------------------------
    async cancelar(params) {
        const failure = this.consumeFailure('cancel');
        if (failure?.kind === 'rejection') {
            throw new ReceitaRejectionError({
                mensagens: [
                    {
                        codigo: failure.codigo,
                        descricao: failure.descricao,
                        ...(failure.complemento ? { complemento: failure.complemento } : {}),
                    },
                ],
            });
        }
        if (failure?.kind === 'transient') {
            // Simulate transient — if a retryStore was passed, the real client would
            // persist here. The fake surfaces this by throwing a TimeoutError since
            // the fake doesn't implement the full retry flow.
            throw new TimeoutError(5000, { cause: new Error(failure.message ?? 'fake transient') });
        }
        this.state.cancelled.add(params.chaveAcesso);
        const evento = this.synthEventoResult(params.chaveAcesso, '101101');
        this.state.eventos.push(evento);
        return { status: 'ok', evento };
    }
    async substituir(params) {
        const novaNfse = await this.emitirDpsPronta(params.novaDps);
        this.state.substituted.set(params.chaveOriginal, novaNfse.chaveAcesso);
        // Modela o sistema gerando o evento 105102 (autor=MEmis) que cancela a
        // original — o contribuinte não posta esse evento.
        this.state.cancelled.add(params.chaveOriginal);
        this.state.eventos.push(this.synthEventoResult(params.chaveOriginal, '105102'));
        return { status: 'ok', novaNfse };
    }
    async replayPendingEvents(_override) {
        // Fake não mantém RetryStore complexa — retorna vazio por default.
        // Para testar replay, o consumidor passa um store real.
        return [];
    }
    // -------------------------------------------------------------------------
    // Parâmetros Municipais
    // -------------------------------------------------------------------------
    async consultarAliquota(codigoMunicipio, codigoServico, competencia, _options) {
        const key = `${codigoMunicipio}:${codigoServico}:${String(competencia)}`;
        return this.state.aliquotas.get(key) ?? { aliquotas: {} };
    }
    async consultarHistoricoAliquotas(codigoMunicipio, codigoServico, _options) {
        const key = `${codigoMunicipio}:${codigoServico}`;
        return this.state.historicoAliquotas.get(key) ?? { aliquotas: {} };
    }
    async consultarBeneficio(codigoMunicipio, numeroBeneficio, competencia, _options) {
        const key = `${codigoMunicipio}:${numeroBeneficio}:${String(competencia)}`;
        return this.state.beneficios.get(key) ?? {};
    }
    async consultarConvenio(codigoMunicipio, _options) {
        return this.state.convenios.get(codigoMunicipio) ?? {};
    }
    async consultarRegimesEspeciais(codigoMunicipio, codigoServico, competencia, _options) {
        const key = `${codigoMunicipio}:${codigoServico}:${String(competencia)}`;
        return this.state.regimesEspeciais.get(key) ?? { regimesEspeciais: {} };
    }
    async consultarRetencoes(codigoMunicipio, competencia, _options) {
        const key = `${codigoMunicipio}:${String(competencia)}`;
        return this.state.retencoes.get(key) ?? {};
    }
    // -------------------------------------------------------------------------
    // DANFSe
    // -------------------------------------------------------------------------
    async gerarDanfse(nfse, options) {
        // Fake sempre renderiza localmente (sem rede) — `strategy` é aceito para
        // paridade de assinatura com o NfseClient real, mas 'online'/'auto' caem
        // no mesmo renderer local determinístico.
        return gerarDanfseLocal(nfse, options);
    }
    async consultarDanfse(chaveAcesso) {
        if (!REGEX_CHAVE.test(chaveAcesso)) {
            throw new InvalidChaveAcessoError(chaveAcesso);
        }
        // Fake: sempre gera localmente (sem rede). Se a chave não está seedada,
        // devolve um PDF mínimo com a chave no título para preservar rastreabilidade.
        const seeded = this.state.emitted.get(chaveAcesso);
        if (seeded) {
            return this.gerarDanfse(seeded.nfse);
        }
        // Returns a dummy PDF with just the chave — useful for assertions about calls
        return Buffer.from(`%PDF-1.4\nFake DANFSe for ${chaveAcesso}\n%%EOF\n`);
    }
    async close() {
        // noop
    }
    // -------------------------------------------------------------------------
    // Introspection — read-only views do estado interno para assertions.
    // -------------------------------------------------------------------------
    /** Lista imutável de chaves emitidas (inclui seedadas). */
    get emittedChaves() {
        return Array.from(this.state.emitted.keys());
    }
    /** Chaves canceladas (pelo método `cancelar`). */
    get cancelledChaves() {
        return Array.from(this.state.cancelled);
    }
    /** Pares `original → nova` de substituições feitas. */
    get substituidas() {
        return this.state.substituted;
    }
    /** Eventos emitidos (cancel + substituição). */
    get eventosRegistrados() {
        return this.state.eventos;
    }
    // -------------------------------------------------------------------------
    consumeFailure(kind) {
        if (kind === 'emit') {
            const f = this.state.nextEmitFailure;
            this.state.nextEmitFailure = undefined;
            return f;
        }
        const f = this.state.nextCancelFailure;
        this.state.nextCancelFailure = undefined;
        return f;
    }
    synthEventoResult(chaveAcesso, tipoEvento) {
        return {
            xmlEvento: `<evento versao="1.01"><infEvento Id="EVT${chaveAcesso}${tipoEvento}001"/></evento>`,
            evento: {
                versao: '1.01',
                infEvento: {
                    Id: `EVT${chaveAcesso}${tipoEvento}001`,
                    verAplic: 'NfseClientFake/0.9',
                    ambGer: '2',
                    nSeqEvento: '1',
                    dhProc: new Date(),
                    nDFSe: String(Date.now()),
                    pedRegEvento: {
                        versao: '1.01',
                        infPedReg: {
                            Id: `PRE${chaveAcesso}${tipoEvento}`,
                            tpAmb: '2',
                            verAplic: 'NfseClientFake/0.6',
                            dhEvento: new Date(),
                            autor: { CNPJAutor: '00000000000000' },
                            chNFSe: chaveAcesso,
                            tipoEvento: tipoEvento,
                            detalhe: {
                                e101101: {
                                    xDesc: 'Cancelamento de NFS-e',
                                    cMotivo: '9',
                                    xMotivo: 'Fake',
                                },
                            },
                        },
                    },
                },
                signature: {
                    signatureValue: 'FAKE',
                    digestValue: 'FAKE',
                    x509Certificate: 'FAKE',
                    referenceUri: `#EVT${chaveAcesso}${tipoEvento}001`,
                },
            },
            tipoAmbiente: this.ambiente,
            versaoAplicativo: 'NfseClientFake/0.6',
            dataHoraProcessamento: new Date(),
        };
    }
}
//# sourceMappingURL=nfse-client-fake.js.map