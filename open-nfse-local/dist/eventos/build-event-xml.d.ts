import type { AmbienteGeradorEvento, JustificativaCancelamento, JustificativaSubstituicao, TipoAmbienteDps } from '../nfse/enums.js';
export interface BuildEventoXmlOptions {
    readonly includeXmlDeclaration?: boolean;
}
/** Identificação do autor do evento — CNPJ ou CPF (discriminated union). */
export type AutorEvento = {
    readonly CNPJ: string;
} | {
    readonly CPF: string;
};
export interface BuildCancelamentoXmlParams {
    readonly chaveAcesso: string;
    readonly autor: AutorEvento;
    readonly cMotivo: JustificativaCancelamento;
    readonly xMotivo: string;
    readonly tpAmb?: TipoAmbienteDps;
    readonly verAplic?: string;
    readonly dhEvento?: Date;
    /** Ambiente gerador do evento. Default `SefinNacional`. */
    readonly ambGer?: AmbienteGeradorEvento;
}
export interface BuildSubstituicaoXmlParams {
    readonly chaveOriginal: string;
    readonly chaveSubstituta: string;
    readonly autor: AutorEvento;
    readonly cMotivo: JustificativaSubstituicao;
    readonly xMotivo?: string;
    readonly tpAmb?: TipoAmbienteDps;
    readonly verAplic?: string;
    readonly dhEvento?: Date;
    readonly ambGer?: AmbienteGeradorEvento;
}
/**
 * Constrói o XML de pedido de registro do evento de **cancelamento** (101101).
 * Segue a sequência do `TCInfPedReg` da RTC v1.01 e coloca o detalhe em `<e101101>`.
 */
export declare function buildCancelamentoXml(params: BuildCancelamentoXmlParams, options?: BuildEventoXmlOptions): string;
/**
 * Constrói o XML de um pedRegEvento de **cancelamento por substituição** (105102).
 *
 * @deprecated O contribuinte **não** registra o evento 105102: ele é gerado
 * pelo Sistema Nacional NFS-e (autor=MEmis) ao receber a nova DPS com
 * `infDPS/subst` via `POST /nfse` — use `substituir()`. Este builder permanece
 * como representação de baixo nível do evento (útil para leitura/inspeção e
 * testes de XSD), mas enviá-lo como contribuinte é rejeitado (E0845/E0813/E2032).
 */
export declare function buildSubstituicaoXml(params: BuildSubstituicaoXmlParams, options?: BuildEventoXmlOptions): string;
//# sourceMappingURL=build-event-xml.d.ts.map