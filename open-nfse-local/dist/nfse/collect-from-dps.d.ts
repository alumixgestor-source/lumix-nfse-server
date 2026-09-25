import type { DPS } from './domain.js';
export interface CollectedCep {
    /** Caminho legível dentro da DPS — usado em mensagens de erro. */
    readonly path: string;
    readonly cep: string;
}
export interface CollectedIdentifier {
    readonly path: string;
    readonly type: 'CNPJ' | 'CPF';
    readonly value: string;
}
/**
 * Caminha na árvore de uma DPS e extrai todos os CEPs encontrados em endereços
 * nacionais ou simples. Usado pelo pré-validador antes do envio ao SEFIN.
 */
export declare function collectCepsFromDps(dps: DPS): readonly CollectedCep[];
/**
 * Caminha na árvore da DPS e extrai todos os CNPJ/CPF (os identificadores
 * federais com dígito verificador). NIF e cNaoNIF são omitidos por não terem
 * dígito verificador brasileiro.
 */
export declare function collectIdentifiersFromDps(dps: DPS): readonly CollectedIdentifier[];
//# sourceMappingURL=collect-from-dps.d.ts.map