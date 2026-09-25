import { Ambiente } from '../ambiente.js';
import type { NFSe } from '../nfse/domain.js';
export interface GerarDanfseOptions {
    /**
     * URL base do portal público onde o tomador consulta a NFS-e. O QR Code e
     * o link de verificação usam este URL. Default: produção (
     * `https://adn.nfse.gov.br/contribuintes/consulta`). Para homologação passe
     * `https://adn.producaorestrita.nfse.gov.br/contribuintes/consulta`.
     */
    readonly urlConsultaPublica?: string;
    /** Ambiente — ajusta a URL default e marca "HOMOLOGAÇÃO" visualmente. */
    readonly ambiente?: Ambiente;
    /** Observações extras que aparecem na área "Outras informações". */
    readonly observacoes?: string;
}
/**
 * Gera o DANFSe (Documento Auxiliar da NFS-e) em PDF a partir de uma `NFSe`
 * tipada — geralmente a resposta de `cliente.emitir()` ou `fetchByChave()`.
 *
 * Layout A4 portrait, com:
 * - Cabeçalho com chave de acesso + tipo de ambiente
 * - Dados do emitente (prestador)
 * - Dados do tomador quando presente
 * - Descrição do serviço + códigos (cTribNac, cNBS, cClassTrib)
 * - Valores e tributação (ISS, retenções, IBS/CBS quando presente)
 * - QR Code de verificação + URL
 * - Rodapé com protocolo, data/hora de processamento e chave formatada
 *
 * Não tenta reproduzir pixel-perfect o template oficial — mantém os **campos
 * obrigatórios** legíveis em uma folha. Para customização além do `options`,
 * consumidores podem parsear o XML e gerar PDF próprio.
 */
export declare function gerarDanfse(nfse: NFSe, options?: GerarDanfseOptions): Promise<Buffer>;
//# sourceMappingURL=gerar.d.ts.map