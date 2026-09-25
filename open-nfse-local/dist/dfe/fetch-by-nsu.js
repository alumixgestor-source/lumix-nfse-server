import { NetworkError } from '../errors/http.js';
import { gzipBase64DecodeToText } from '../http/encoding.js';
export async function fetchByNsu(httpClient, ultimoNsu, options) {
    // ADN Contribuintes returns 400/404 with the full LoteDistribuicaoNSUResponse
    // body when the request is rejected or there are no pending documents. The
    // HTTP status isn't an error signal for this endpoint — the StatusProcessamento
    // field inside the body is.
    const raw = await httpClient.get(buildPath(ultimoNsu, options), {
        acceptedStatuses: [400, 404],
    });
    // Sanity-check the body shape. Se um proxy/WAF na frente do ADN responder
    // 400/404 com um HTML/JSON genérico, os campos obrigatórios não vêm — tratar
    // como "caught up" silenciosamente esconderia um problema de infra. Ao
    // invés, lança `NetworkError` para o caller ver.
    if (raw === null || typeof raw !== 'object' || typeof raw.StatusProcessamento !== 'string') {
        throw new NetworkError('response do ADN sem campo `StatusProcessamento` — provavelmente proxy/WAF respondeu no lugar do serviço');
    }
    const documentos = (raw.LoteDFe ?? []).map(mapDocument);
    return {
        status: raw.StatusProcessamento,
        documentos,
        alertas: (raw.Alertas ?? []).map(mapMessage),
        erros: (raw.Erros ?? []).map(mapMessage),
        ultimoNsu: documentos.reduce((max, doc) => Math.max(max, doc.nsu), ultimoNsu),
        tipoAmbiente: raw.TipoAmbiente,
        versaoAplicativo: raw.VersaoAplicativo,
        dataHoraProcessamento: new Date(raw.DataHoraProcessamento),
    };
}
function buildPath(ultimoNsu, options) {
    const query = new URLSearchParams();
    if (options?.cnpjConsulta !== undefined) {
        query.set('cnpjConsulta', options.cnpjConsulta);
    }
    if (options?.lote !== undefined) {
        query.set('lote', String(options.lote));
    }
    const suffix = query.toString();
    return `/DFe/${ultimoNsu}${suffix ? `?${suffix}` : ''}`;
}
function mapDocument(wire) {
    return {
        nsu: wire.NSU ?? 0,
        chaveAcesso: wire.ChaveAcesso ?? '',
        tipoDocumento: wire.TipoDocumento,
        tipoEvento: wire.TipoEvento,
        xmlDocumento: wire.ArquivoXml ? gzipBase64DecodeToText(wire.ArquivoXml) : '',
        dataHoraGeracao: wire.DataHoraGeracao ? new Date(wire.DataHoraGeracao) : new Date(0),
    };
}
function mapMessage(wire) {
    return {
        codigo: wire.Codigo ?? '',
        descricao: wire.Descricao ?? '',
        complemento: wire.Complemento,
    };
}
//# sourceMappingURL=fetch-by-nsu.js.map