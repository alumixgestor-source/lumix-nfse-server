import type { Signature } from '../nfse/domain.js';
import type { AmbienteGeradorEvento, JustificativaAnaliseFiscalCancelamento, JustificativaAnaliseFiscalCancelamentoDeferido, JustificativaAnaliseFiscalCancelamentoIndeferido, JustificativaCancelamento, JustificativaSubstituicao, MotivoRejeicaoNfse, TipoAmbienteDps, TipoEventoNfse } from '../nfse/enums.js';
import { type XmlObject } from '../xml/parser.js';
/**
 * `<evento>` retornado pela Receita após o processamento de um pedido de
 * registro de evento. Carrega o pedido original + metadados de processamento +
 * assinatura da Sefin.
 */
export interface EventoProcessado {
    readonly versao: string;
    readonly infEvento: InfEvento;
    readonly signature: Signature;
}
export interface InfEvento {
    readonly Id: string;
    readonly verAplic: string;
    readonly ambGer: AmbienteGeradorEvento;
    readonly nSeqEvento: string;
    readonly dhProc: Date;
    /**
     * Número do DF-e gerado pelo ambiente gerador. A SEFIN em produção emite este
     * valor no elemento `<nDFSe>` (com S) — mesmo nome usado no documento NFS-e.
     * O XSD bundled e versões ≤0.8.6 liam `<nDFe>` (sem S) e rejeitavam respostas
     * de cancelamento já aceitas pela SEFIN. Ver `parseInfEvento`.
     */
    readonly nDFSe: string;
    readonly pedRegEvento: PedRegEvento;
}
export interface PedRegEvento {
    readonly versao: string;
    readonly infPedReg: InfPedRegEvento;
    readonly signature?: Signature;
}
/** Identificação do autor — CNPJ ou CPF. */
export type AutorEventoParsed = {
    readonly CNPJAutor: string;
} | {
    readonly CPFAutor: string;
};
/** Informações comuns aos eventos de rejeição (202205 / 203206 / 204207). */
export interface InfoEventoRejeicao {
    readonly cMotivo: MotivoRejeicaoNfse;
    readonly xMotivo?: string;
}
/** Informações do evento de anulação de rejeição (205208). */
export interface InfoEventoAnulacaoRejeicao {
    readonly CPFAgTrib: string;
    readonly idEvManifRej: string;
    readonly xMotivo: string;
}
/**
 * Detalhe do evento — discriminated union cobrindo todos os 16 tipos definidos
 * em `tiposEventos_v1.01.xsd` + uma variante `unknown` que preserva o nó XML
 * bruto para variantes que a lib ainda não modelou (defensivo — a Receita
 * pode adicionar novos tipos por Nota Técnica).
 *
 * Narrow via `in` operator:
 * ```ts
 * if ('e101101' in detalhe) { ... detalhe.e101101.xMotivo ... }
 * ```
 */
export type DetalheEvento = {
    readonly e101101: {
        readonly xDesc: string;
        readonly cMotivo: JustificativaCancelamento;
        readonly xMotivo: string;
    };
} | {
    readonly e105102: {
        readonly xDesc: string;
        readonly cMotivo: JustificativaSubstituicao;
        readonly xMotivo?: string;
        readonly chSubstituta: string;
    };
} | {
    readonly e101103: {
        readonly xDesc: string;
        readonly cMotivo: JustificativaAnaliseFiscalCancelamento;
        readonly xMotivo: string;
    };
} | {
    readonly e105104: {
        readonly xDesc: string;
        readonly CPFAgTrib: string;
        readonly nProcAdm?: string;
        readonly cMotivo: JustificativaAnaliseFiscalCancelamentoDeferido;
        readonly xMotivo: string;
    };
} | {
    readonly e105105: {
        readonly xDesc: string;
        readonly CPFAgTrib: string;
        readonly nProcAdm?: string;
        readonly cMotivo: JustificativaAnaliseFiscalCancelamentoIndeferido;
        readonly xMotivo: string;
    };
} | {
    readonly e202201: {
        readonly xDesc: string;
    };
} | {
    readonly e203202: {
        readonly xDesc: string;
    };
} | {
    readonly e204203: {
        readonly xDesc: string;
    };
} | {
    readonly e205204: {
        readonly xDesc: string;
    };
} | {
    readonly e202205: {
        readonly xDesc: string;
    } & InfoEventoRejeicao;
} | {
    readonly e203206: {
        readonly xDesc: string;
    } & InfoEventoRejeicao;
} | {
    readonly e204207: {
        readonly xDesc: string;
    } & InfoEventoRejeicao;
} | {
    readonly e205208: {
        readonly xDesc: string;
    } & InfoEventoAnulacaoRejeicao;
} | {
    readonly e305101: {
        readonly xDesc: string;
        readonly CPFAgTrib: string;
        readonly nProcAdm: string;
        readonly xProcAdm: string;
    };
} | {
    readonly e305102: {
        readonly xDesc: string;
        readonly CPFAgTrib: string;
        readonly codEvento: string;
        readonly xMotivo: string;
    };
} | {
    readonly e305103: {
        readonly xDesc: string;
        readonly CPFAgTrib: string;
        readonly idBloqOfic: string;
    };
} | {
    readonly unknown: {
        readonly elementName: string;
        readonly tipoEvento: string;
        readonly raw: XmlObject;
    };
};
export interface InfPedRegEvento {
    readonly Id: string;
    readonly tpAmb: TipoAmbienteDps;
    readonly verAplic: string;
    readonly dhEvento: Date;
    readonly autor: AutorEventoParsed;
    readonly chNFSe: string;
    readonly tipoEvento: TipoEventoNfse;
    readonly detalhe: DetalheEvento;
}
export declare function parseEventoXml(xml: string): EventoProcessado;
//# sourceMappingURL=parse-event.d.ts.map