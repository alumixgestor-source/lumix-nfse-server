export var Ambiente;
(function (Ambiente) {
    Ambiente["ProducaoRestrita"] = "PRODUCAO_RESTRITA";
    Ambiente["Producao"] = "PRODUCAO";
})(Ambiente || (Ambiente = {}));
export var TipoAmbiente;
(function (TipoAmbiente) {
    TipoAmbiente["Producao"] = "PRODUCAO";
    TipoAmbiente["Homologacao"] = "HOMOLOGACAO";
})(TipoAmbiente || (TipoAmbiente = {}));
export const AMBIENTE_ENDPOINTS = {
    [Ambiente.ProducaoRestrita]: {
        sefin: 'https://sefin.producaorestrita.nfse.gov.br/SefinNacional',
        adn: 'https://adn.producaorestrita.nfse.gov.br/contribuintes',
        danfse: 'https://adn.producaorestrita.nfse.gov.br/danfse',
        parametrosMunicipais: 'https://adn.producaorestrita.nfse.gov.br/parametrizacao',
    },
    [Ambiente.Producao]: {
        sefin: 'https://sefin.nfse.gov.br/SefinNacional',
        adn: 'https://adn.nfse.gov.br/contribuintes',
        danfse: 'https://adn.nfse.gov.br/danfse',
        parametrosMunicipais: 'https://adn.nfse.gov.br/parametrizacao',
    },
};
//# sourceMappingURL=ambiente.js.map