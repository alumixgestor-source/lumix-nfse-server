import { TipoAmbiente } from '../ambiente.js';
import type { FetchByNsuParams, ReplayItem } from '../client.js';
import { type GerarDanfseOptions } from '../danfse/gerar.js';
import type { NsuQueryResult } from '../dfe/types.js';
import type { CancelarParams, CancelarResult, SubstituirParams, SubstituirResult } from '../eventos/cancelar.js';
import type { EventoResult } from '../eventos/post-evento.js';
import { type DpsStatusResult } from '../index.js';
import type { DPS, NFSe } from '../nfse/domain.js';
import type { DpsDryRunResult, EmitLoteOptions, EmitLoteResult, EmitOptions, EmitirParams, EmitirResult, NfseEmitResult } from '../nfse/emit.js';
import type { NfseQueryResult } from '../nfse/types.js';
import type { ConsultaOptions } from '../parametros-municipais/fetch.js';
import type { ConsultaAliquotasResult, ConsultaBeneficioResult, ConsultaConvenioResult, ConsultaRegimesEspeciaisResult, ConsultaRetencoesResult } from '../parametros-municipais/types.js';
import type { RetryStore } from '../retry/store.js';
import { type ProgrammedFailure } from './fake-state.js';
import { FakeSeed } from './seed.js';
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
export declare class NfseClientFake {
    private readonly state;
    readonly seed: FakeSeed;
    /** Ambiente simulado. Default `ProducaoRestrita`. */
    readonly ambiente: TipoAmbiente;
    constructor(options?: {
        readonly ambiente?: TipoAmbiente;
    });
    /** Próxima chamada de `emitir()` irá falhar com o erro programado. */
    failNextEmit(failure: ProgrammedFailure): void;
    /** Próxima chamada de `cancelar()` irá falhar com o erro programado. */
    failNextCancel(failure: ProgrammedFailure): void;
    /** Limpa todo o estado (seeds + failures + emissões). */
    reset(): void;
    fetchByChave(chaveAcesso: string): Promise<NfseQueryResult>;
    fetchDpsStatus(idDps: string): Promise<DpsStatusResult>;
    existsDpsStatus(idDps: string): Promise<boolean>;
    fetchByNsu(params: FetchByNsuParams): Promise<NsuQueryResult>;
    emitir(params: EmitirParams): Promise<EmitirResult | DpsDryRunResult>;
    emitirDpsPronta(dps: DPS, options?: EmitOptions & {
        dryRun?: false;
    }): Promise<NfseEmitResult>;
    emitirDpsPronta(dps: DPS, options: EmitOptions & {
        dryRun: true;
    }): Promise<DpsDryRunResult>;
    emitirEmLote(dpsList: readonly DPS[], _options?: EmitLoteOptions): Promise<EmitLoteResult>;
    cancelar(params: CancelarParams): Promise<CancelarResult>;
    substituir(params: SubstituirParams): Promise<SubstituirResult>;
    replayPendingEvents(_override?: RetryStore): Promise<ReplayItem[]>;
    consultarAliquota(codigoMunicipio: string, codigoServico: string, competencia: Date | string, _options?: ConsultaOptions): Promise<ConsultaAliquotasResult>;
    consultarHistoricoAliquotas(codigoMunicipio: string, codigoServico: string, _options?: ConsultaOptions): Promise<ConsultaAliquotasResult>;
    consultarBeneficio(codigoMunicipio: string, numeroBeneficio: string, competencia: Date | string, _options?: ConsultaOptions): Promise<ConsultaBeneficioResult>;
    consultarConvenio(codigoMunicipio: string, _options?: ConsultaOptions): Promise<ConsultaConvenioResult>;
    consultarRegimesEspeciais(codigoMunicipio: string, codigoServico: string, competencia: Date | string, _options?: ConsultaOptions): Promise<ConsultaRegimesEspeciaisResult>;
    consultarRetencoes(codigoMunicipio: string, competencia: Date | string, _options?: ConsultaOptions): Promise<ConsultaRetencoesResult>;
    gerarDanfse(nfse: NFSe, options?: GerarDanfseOptions & {
        strategy?: 'auto' | 'online' | 'local';
    }): Promise<Buffer>;
    consultarDanfse(chaveAcesso: string): Promise<Buffer>;
    close(): Promise<void>;
    /** Lista imutável de chaves emitidas (inclui seedadas). */
    get emittedChaves(): readonly string[];
    /** Chaves canceladas (pelo método `cancelar`). */
    get cancelledChaves(): readonly string[];
    /** Pares `original → nova` de substituições feitas. */
    get substituidas(): ReadonlyMap<string, string>;
    /** Eventos emitidos (cancel + substituição). */
    get eventosRegistrados(): readonly EventoResult[];
    private consumeFailure;
    private synthEventoResult;
}
//# sourceMappingURL=nfse-client-fake.d.ts.map