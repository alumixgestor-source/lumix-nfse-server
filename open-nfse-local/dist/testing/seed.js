/**
 * API fluente para pré-popular o estado do `NfseClientFake`. Use em testes
 * para montar cenários antes de exercitar o código em teste.
 *
 * ```ts
 * const fake = new NfseClientFake();
 * fake.seed.nfse('21113...', mockNfseResult);
 * fake.seed.aliquota('2111300', '250101', '2026-03-01', [{ ... }]);
 *
 * // código em teste consome `fake` e verifica via assertions
 * ```
 */
export class FakeSeed {
    state;
    constructor(state) {
        this.state = state;
    }
    /** Preenche uma NFS-e para ser retornada em `fetchByChave(chave)`. */
    nfse(chave, result) {
        this.state.emitted.set(chave, result);
    }
    /** Adiciona documentos à fila de distribuição DF-e. Ordenados por NSU. */
    dfe(documentos) {
        this.state.dfe.push(...documentos);
        this.state.dfe.sort((a, b) => a.nsu - b.nsu);
    }
    /** Alíquota para município + serviço + competência específica. */
    aliquota(codigoMunicipio, codigoServico, competencia, result) {
        const key = `${codigoMunicipio}:${codigoServico}:${String(competencia)}`;
        this.state.aliquotas.set(key, result);
    }
    /** Histórico de alíquotas (independente de competência). */
    historicoAliquotas(codigoMunicipio, codigoServico, result) {
        const key = `${codigoMunicipio}:${codigoServico}`;
        this.state.historicoAliquotas.set(key, result);
    }
    /** Benefício municipal. */
    beneficio(codigoMunicipio, numeroBeneficio, competencia, result) {
        const key = `${codigoMunicipio}:${numeroBeneficio}:${String(competencia)}`;
        this.state.beneficios.set(key, result);
    }
    /** Convênio do município. */
    convenio(codigoMunicipio, result) {
        this.state.convenios.set(codigoMunicipio, result);
    }
    /** Regimes especiais para município + serviço + competência. */
    regimesEspeciais(codigoMunicipio, codigoServico, competencia, result) {
        const key = `${codigoMunicipio}:${codigoServico}:${String(competencia)}`;
        this.state.regimesEspeciais.set(key, result);
    }
    /** Retenções do município para competência. */
    retencoes(codigoMunicipio, competencia, result) {
        const key = `${codigoMunicipio}:${String(competencia)}`;
        this.state.retencoes.set(key, result);
    }
}
//# sourceMappingURL=seed.js.map