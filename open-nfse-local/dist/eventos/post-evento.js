import { TipoAmbiente } from '../ambiente.js';
import { ReceitaRejectionError, receitaRejectionFromResponseErro } from '../errors/receita.js';
import { gzipBase64DecodeToText, gzipBase64Encode } from '../http/encoding.js';
import { parseEventoXml } from './parse-event.js';
import { signPedRegEventoXml } from './sign-event.js';
/**
 * Assina (se ainda não estiver), comprime em gzip+base64 e posta um XML de
 * `<pedRegEvento>` no SEFIN. Retorna o evento processado ou lança
 * `ReceitaRejectionError` com o corpo `ResponseErro`.
 *
 * Passe `xmlJaAssinado: true` quando estiver reenviando um XML que já veio
 * assinado do RetryStore — nesse caso a assinatura é preservada.
 */
export async function postEvento(httpClient, certificate, chaveAcesso, xmlPedido, options) {
    const xmlAssinado = options?.xmlJaAssinado
        ? xmlPedido
        : signPedRegEventoXml(xmlPedido, certificate);
    const pedidoRegistroEventoXmlGZipB64 = gzipBase64Encode(xmlAssinado);
    const body = await httpClient.post(`/nfse/${chaveAcesso}/eventos`, { pedidoRegistroEventoXmlGZipB64 }, { acceptedStatuses: [400, 422] });
    if (isSuccessBody(body)) {
        const xmlEvento = gzipBase64DecodeToText(body.eventoXmlGZipB64);
        return {
            xmlAssinado: xmlAssinado,
            xmlEvento,
            evento: parseEventoXml(xmlEvento),
            tipoAmbiente: body.tipoAmbiente === 1 ? TipoAmbiente.Producao : TipoAmbiente.Homologacao,
            versaoAplicativo: body.versaoAplicativo,
            dataHoraProcessamento: new Date(body.dataHoraProcessamento),
        };
    }
    const rejection = receitaRejectionFromResponseErro(body);
    if (rejection)
        throw rejection;
    throw new ReceitaRejectionError({
        mensagens: [
            {
                codigo: 'UNKNOWN',
                descricao: `Corpo de erro sem mensagens reconhecíveis: ${JSON.stringify(body)}`,
            },
        ],
    });
}
function isSuccessBody(body) {
    return typeof body.eventoXmlGZipB64 === 'string';
}
//# sourceMappingURL=post-evento.js.map