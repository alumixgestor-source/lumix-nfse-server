/**
 * Valida um CPF conforme o algoritmo oficial da Receita Federal:
 * formato (11 dígitos) + dígitos verificadores (módulo 11 sobre os 9 primeiros,
 * depois sobre os 10 primeiros).
 *
 * Lança `InvalidCpfError` com `reason: 'format' | 'known_invalid' | 'check_digit'`.
 */
export declare function validateCpf(cpf: string): void;
/**
 * Valida um CNPJ conforme o algoritmo oficial da Receita Federal, incluindo o
 * CNPJ alfanumérico (IN RFB nº 2.229/2024): 12 posições `[A-Z0-9]` + 2 dígitos
 * verificadores numéricos (módulo 11 com pesos `[5,4,3,2,9,8,7,6,5,4,3,2]` e
 * depois `[6,5,4,3,2,9,8,7,6,5,4,3,2]`). No cálculo do DV cada caractere vale
 * seu código ASCII menos 48 (dígitos mantêm 0–9; A=17 … Z=42).
 *
 * Nota: o leiaute da NFS-e Nacional só passa a aceitar CNPJ alfanumérico na
 * DPS com a NT 009/2026 (campos N → C); até lá, um CNPJ com letras é válido
 * aqui mas rejeitado na validação XSD da emissão.
 *
 * Lança `InvalidCnpjError` com `reason: 'format' | 'known_invalid' | 'check_digit'`.
 */
export declare function validateCnpj(cnpj: string): void;
//# sourceMappingURL=validate-cpf-cnpj.d.ts.map