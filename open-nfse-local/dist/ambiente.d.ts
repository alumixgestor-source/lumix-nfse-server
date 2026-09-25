export declare enum Ambiente {
    ProducaoRestrita = "PRODUCAO_RESTRITA",
    Producao = "PRODUCAO"
}
export declare enum TipoAmbiente {
    Producao = "PRODUCAO",
    Homologacao = "HOMOLOGACAO"
}
export interface AmbienteEndpoints {
    readonly sefin: string;
    readonly adn: string;
    readonly danfse: string;
    readonly parametrosMunicipais: string;
}
export declare const AMBIENTE_ENDPOINTS: {
    readonly PRODUCAO_RESTRITA: {
        readonly sefin: "https://sefin.producaorestrita.nfse.gov.br/SefinNacional";
        readonly adn: "https://adn.producaorestrita.nfse.gov.br/contribuintes";
        readonly danfse: "https://adn.producaorestrita.nfse.gov.br/danfse";
        readonly parametrosMunicipais: "https://adn.producaorestrita.nfse.gov.br/parametrizacao";
    };
    readonly PRODUCAO: {
        readonly sefin: "https://sefin.nfse.gov.br/SefinNacional";
        readonly adn: "https://adn.nfse.gov.br/contribuintes";
        readonly danfse: "https://adn.nfse.gov.br/danfse";
        readonly parametrosMunicipais: "https://adn.nfse.gov.br/parametrizacao";
    };
};
//# sourceMappingURL=ambiente.d.ts.map