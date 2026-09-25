import { TipoAmbiente } from '../ambiente.js';
import type { A1Certificate } from '../certificate/types.js';
import type { HttpClient } from '../http/client.js';
import type { EventoProcessado } from './parse-event.js';
/** Resultado do POST de um evento (cancelamento ou substituição). */
export interface EventoResult {
    /** XML cru do `<evento>` retornado pela Sefin, assinado. */
    readonly xmlEvento: string;
    /** Árvore tipada do evento. */
    readonly evento: EventoProcessado;
    readonly tipoAmbiente: TipoAmbiente;
    readonly versaoAplicativo: string;
    readonly dataHoraProcessamento: Date;
}
/**
 * Assina (se ainda não estiver), comprime em gzip+base64 e posta um XML de
 * `<pedRegEvento>` no SEFIN. Retorna o evento processado ou lança
 * `ReceitaRejectionError` com o corpo `ResponseErro`.
 *
 * Passe `xmlJaAssinado: true` quando estiver reenviando um XML que já veio
 * assinado do RetryStore — nesse caso a assinatura é preservada.
 */
export declare function postEvento(httpClient: HttpClient, certificate: A1Certificate, chaveAcesso: string, xmlPedido: string, options?: {
    xmlJaAssinado?: boolean;
}): Promise<EventoResult & {
    xmlAssinado: string;
}>;
//# sourceMappingURL=post-evento.d.ts.map