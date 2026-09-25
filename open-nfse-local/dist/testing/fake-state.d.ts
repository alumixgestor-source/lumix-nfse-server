import type { DistributedDocument } from '../dfe/types.js';
import type { EventoResult } from '../eventos/post-evento.js';
import type { NfseEmitResult } from '../nfse/emit.js';
import type { ConsultaAliquotasResult, ConsultaBeneficioResult, ConsultaConvenioResult, ConsultaRegimesEspeciaisResult, ConsultaRetencoesResult } from '../parametros-municipais/types.js';
/** Próxima falha programada para o `emitir`/`cancelar`. */
export type ProgrammedFailure = {
    readonly kind: 'rejection';
    readonly codigo: string;
    readonly descricao: string;
    readonly complemento?: string;
} | {
    readonly kind: 'transient';
    readonly message?: string;
};
/** Estado interno mutável do `NfseClientFake`. Não exposto ao público. */
export declare class FakeState {
    /** NFS-e emitidas ou pré-populadas via `seed.nfse`. Chave: chaveAcesso. */
    readonly emitted: Map<string, NfseEmitResult>;
    /** NFS-e canceladas. */
    readonly cancelled: Set<string>;
    /** `chaveOriginal → chaveNova` — pares de substituição. */
    readonly substituted: Map<string, string>;
    /** Eventos registrados (cancelamento, substituição). */
    readonly eventos: EventoResult[];
    /** Documentos de distribuição DF-e ordenados por NSU. */
    readonly dfe: DistributedDocument[];
    /** Último NSU por CNPJ consultante — default 0. */
    readonly nsuByCnpj: Map<string, number>;
    /** Parâmetros municipais seedados. */
    readonly aliquotas: Map<string, ConsultaAliquotasResult>;
    readonly historicoAliquotas: Map<string, ConsultaAliquotasResult>;
    readonly beneficios: Map<string, ConsultaBeneficioResult>;
    readonly convenios: Map<string, ConsultaConvenioResult>;
    readonly regimesEspeciais: Map<string, ConsultaRegimesEspeciaisResult>;
    readonly retencoes: Map<string, ConsultaRetencoesResult>;
    /** Próxima falha programada para `emitir()` — consumida na próxima chamada. */
    nextEmitFailure: ProgrammedFailure | undefined;
    /** Próxima falha para `cancelar()`. */
    nextCancelFailure: ProgrammedFailure | undefined;
    /** Contador auto-incrementado para gerar chaves/idDps determinísticos. */
    nextSequential: number;
    reset(): void;
}
//# sourceMappingURL=fake-state.d.ts.map