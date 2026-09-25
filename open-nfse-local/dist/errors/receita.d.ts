import { TipoAmbiente } from '../ambiente.js';
import { OpenNfseError } from './base.js';
/** Uma única mensagem de processamento retornada pela Receita (código + descrição). */
export interface MensagemProcessamento {
    readonly codigo: string;
    readonly descricao: string;
    readonly complemento?: string;
}
export interface ReceitaRejectionErrorOptions {
    /** Lista de mensagens retornadas. Deve ter ao menos uma entrada. */
    readonly mensagens: readonly MensagemProcessamento[];
    /** Identificador do DPS quando a Receita conseguiu extraí-lo do XML rejeitado. */
    readonly idDps?: string;
    readonly tipoAmbiente?: TipoAmbiente;
    readonly versaoAplicativo?: string;
    readonly dataHoraProcessamento?: Date;
    readonly cause?: unknown;
}
/**
 * Rejeição retornada pela Receita após o processamento de uma DPS, evento ou
 * consulta. Carrega a lista completa de mensagens — quando houver apenas uma,
 * os acessores `codigo`/`descricao`/`complemento` retornam essa entrada.
 *
 * Mensagem formatada por `Error.message`: `Rejeição da Receita [E001]: descrição (+N erros)`.
 */
export declare class ReceitaRejectionError extends OpenNfseError {
    readonly mensagens: readonly MensagemProcessamento[];
    readonly idDps: string | undefined;
    readonly tipoAmbiente: TipoAmbiente | undefined;
    readonly versaoAplicativo: string | undefined;
    readonly dataHoraProcessamento: Date | undefined;
    constructor(options: ReceitaRejectionErrorOptions);
    private get primeira();
    /** Código da primeira mensagem (shortcut para `mensagens[0].codigo`). */
    get codigo(): string;
    /** Descrição da primeira mensagem (shortcut para `mensagens[0].descricao`). */
    get descricao(): string;
    /** Complemento da primeira mensagem, se houver. */
    get complemento(): string | undefined;
}
/** Corpo bruto de `POST /nfse` quando a DPS é rejeitada (NFSePostResponseErro). */
export interface RawNfsePostErrorBody {
    readonly tipoAmbiente?: 1 | 2;
    readonly versaoAplicativo?: string;
    readonly dataHoraProcessamento?: string;
    readonly idDPS?: string;
    readonly erros?: ReadonlyArray<Partial<MensagemProcessamento>>;
}
/**
 * Corpo bruto genérico (`ResponseErro`) retornado pelos GETs do SEFIN e pelo
 * `POST /nfse/{chave}/eventos`. O Swagger oficial declara `erro` como objeto
 * único (`MensagemProcessamento`), mas o SEFIN Nacional em produção devolve
 * eventos rejeitados com `erro` como **array** — então aceitamos as duas
 * formas para não perder a mensagem real.
 */
export interface RawResponseErroBody {
    readonly tipoAmbiente?: 1 | 2;
    readonly versaoAplicativo?: string;
    readonly dataHoraProcessamento?: string;
    readonly erro?: Partial<MensagemProcessamento> | ReadonlyArray<Partial<MensagemProcessamento>>;
}
/**
 * Converte o corpo de um `POST /nfse` rejeitado em `ReceitaRejectionError`.
 * Retorna `undefined` se o corpo não carregar nenhuma mensagem reconhecível.
 */
export declare function receitaRejectionFromPostError(body: RawNfsePostErrorBody, options?: {
    cause?: unknown;
}): ReceitaRejectionError | undefined;
/**
 * Converte o corpo `ResponseErro` (mensagem única) em `ReceitaRejectionError`.
 * Retorna `undefined` se o corpo não carregar uma mensagem reconhecível.
 */
export declare function receitaRejectionFromResponseErro(body: RawResponseErroBody, options?: {
    cause?: unknown;
}): ReceitaRejectionError | undefined;
//# sourceMappingURL=receita.d.ts.map