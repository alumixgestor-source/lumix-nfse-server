import type { TipoAmbiente } from '../ambiente.js';
import type { DPS, NFSe } from '../nfse/domain.js';
/** Chave de acesso sintética de 50 dígitos. Deterministicamente única por sequential. */
export declare function synthChaveAcesso(sequential: number, cnpj: string): string;
/**
 * Constrói um `NFSe` sintético mínimo a partir de uma DPS e uma chaveAcesso.
 * Preserva todos os campos da DPS originais (util pra consumers que inspecionam
 * `nfse.infNFSe.DPS.infDPS.*` em testes).
 */
export declare function synthNfse(dps: DPS, chaveAcesso: string, ambiente: TipoAmbiente): NFSe;
//# sourceMappingURL=synth.d.ts.map