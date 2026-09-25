export var StatusDistribuicao;
(function (StatusDistribuicao) {
    StatusDistribuicao["Rejeicao"] = "REJEICAO";
    StatusDistribuicao["NenhumDocumento"] = "NENHUM_DOCUMENTO_LOCALIZADO";
    StatusDistribuicao["DocumentosEncontrados"] = "DOCUMENTOS_LOCALIZADOS";
})(StatusDistribuicao || (StatusDistribuicao = {}));
export var TipoDocumento;
(function (TipoDocumento) {
    TipoDocumento["Nenhum"] = "NENHUM";
    TipoDocumento["Dps"] = "DPS";
    TipoDocumento["PedidoRegistroEvento"] = "PEDIDO_REGISTRO_EVENTO";
    TipoDocumento["Nfse"] = "NFSE";
    TipoDocumento["Evento"] = "EVENTO";
    TipoDocumento["Cnc"] = "CNC";
})(TipoDocumento || (TipoDocumento = {}));
export var TipoEvento;
(function (TipoEvento) {
    TipoEvento["Cancelamento"] = "CANCELAMENTO";
    TipoEvento["SolicitacaoCancelamentoAnaliseFiscal"] = "SOLICITACAO_CANCELAMENTO_ANALISE_FISCAL";
    TipoEvento["CancelamentoPorSubstituicao"] = "CANCELAMENTO_POR_SUBSTITUICAO";
    TipoEvento["CancelamentoDeferidoAnaliseFiscal"] = "CANCELAMENTO_DEFERIDO_ANALISE_FISCAL";
    TipoEvento["CancelamentoIndeferidoAnaliseFiscal"] = "CANCELAMENTO_INDEFERIDO_ANALISE_FISCAL";
    TipoEvento["ConfirmacaoPrestador"] = "CONFIRMACAO_PRESTADOR";
    TipoEvento["RejeicaoPrestador"] = "REJEICAO_PRESTADOR";
    TipoEvento["ConfirmacaoTomador"] = "CONFIRMACAO_TOMADOR";
    TipoEvento["RejeicaoTomador"] = "REJEICAO_TOMADOR";
    TipoEvento["ConfirmacaoIntermediario"] = "CONFIRMACAO_INTERMEDIARIO";
    TipoEvento["RejeicaoIntermediario"] = "REJEICAO_INTERMEDIARIO";
    TipoEvento["ConfirmacaoTacita"] = "CONFIRMACAO_TACITA";
    TipoEvento["AnulacaoRejeicao"] = "ANULACAO_REJEICAO";
    TipoEvento["CancelamentoPorOficio"] = "CANCELAMENTO_POR_OFICIO";
    TipoEvento["BloqueioPorOficio"] = "BLOQUEIO_POR_OFICIO";
    TipoEvento["DesbloqueioPorOficio"] = "DESBLOQUEIO_POR_OFICIO";
    TipoEvento["InclusaoNfseDan"] = "INCLUSAO_NFSE_DAN";
    TipoEvento["TributosNfseRecolhidos"] = "TRIBUTOS_NFSE_RECOLHIDOS";
})(TipoEvento || (TipoEvento = {}));
//# sourceMappingURL=types.js.map