/** Estado interno mutável do `NfseClientFake`. Não exposto ao público. */
export class FakeState {
    /** NFS-e emitidas ou pré-populadas via `seed.nfse`. Chave: chaveAcesso. */
    emitted = new Map();
    /** NFS-e canceladas. */
    cancelled = new Set();
    /** `chaveOriginal → chaveNova` — pares de substituição. */
    substituted = new Map();
    /** Eventos registrados (cancelamento, substituição). */
    eventos = [];
    /** Documentos de distribuição DF-e ordenados por NSU. */
    dfe = [];
    /** Último NSU por CNPJ consultante — default 0. */
    nsuByCnpj = new Map();
    /** Parâmetros municipais seedados. */
    aliquotas = new Map();
    historicoAliquotas = new Map();
    beneficios = new Map();
    convenios = new Map();
    regimesEspeciais = new Map();
    retencoes = new Map();
    /** Próxima falha programada para `emitir()` — consumida na próxima chamada. */
    nextEmitFailure;
    /** Próxima falha para `cancelar()`. */
    nextCancelFailure;
    /** Contador auto-incrementado para gerar chaves/idDps determinísticos. */
    nextSequential = 1;
    reset() {
        this.emitted.clear();
        this.cancelled.clear();
        this.substituted.clear();
        this.eventos.length = 0;
        this.dfe.length = 0;
        this.nsuByCnpj.clear();
        this.aliquotas.clear();
        this.historicoAliquotas.clear();
        this.beneficios.clear();
        this.convenios.clear();
        this.regimesEspeciais.clear();
        this.retencoes.clear();
        this.nextEmitFailure = undefined;
        this.nextCancelFailure = undefined;
        this.nextSequential = 1;
    }
}
//# sourceMappingURL=fake-state.js.map