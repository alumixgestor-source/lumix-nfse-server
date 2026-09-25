import { TipoAmbiente } from '../ambiente.js';
import { OpenNfseError } from './base.js';
/**
 * Rejeição retornada pela Receita após o processamento de uma DPS, evento ou
 * consulta. Carrega a lista completa de mensagens — quando houver apenas uma,
 * os acessores `codigo`/`descricao`/`complemento` retornam essa entrada.
 *
 * Mensagem formatada por `Error.message`: `Rejeição da Receita [E001]: descrição (+N erros)`.
 */
export class ReceitaRejectionError extends OpenNfseError {
    mensagens;
    idDps;
    tipoAmbiente;
    versaoAplicativo;
    dataHoraProcessamento;
    constructor(options) {
        const primeira = options.mensagens[0];
        if (!primeira) {
            throw new Error('ReceitaRejectionError requer ao menos uma mensagem.');
        }
        const extras = options.mensagens.length - 1;
        const sufixo = extras > 0 ? ` (+${extras} erro${extras > 1 ? 's' : ''})` : '';
        super(`Rejeição da Receita [${primeira.codigo}]: ${primeira.descricao}${sufixo}`, {
            cause: options.cause,
        });
        this.mensagens = options.mensagens;
        this.idDps = options.idDps;
        this.tipoAmbiente = options.tipoAmbiente;
        this.versaoAplicativo = options.versaoAplicativo;
        this.dataHoraProcessamento = options.dataHoraProcessamento;
    }
    get primeira() {
        // safe: constructor rejects empty arrays
        return this.mensagens[0];
    }
    /** Código da primeira mensagem (shortcut para `mensagens[0].codigo`). */
    get codigo() {
        return this.primeira.codigo;
    }
    /** Descrição da primeira mensagem (shortcut para `mensagens[0].descricao`). */
    get descricao() {
        return this.primeira.descricao;
    }
    /** Complemento da primeira mensagem, se houver. */
    get complemento() {
        return this.primeira.complemento;
    }
}
/**
 * Converte o corpo de um `POST /nfse` rejeitado em `ReceitaRejectionError`.
 * Retorna `undefined` se o corpo não carregar nenhuma mensagem reconhecível.
 */
export function receitaRejectionFromPostError(body, options) {
    const b = body;
    const erros = (body.erros ?? b.Erros ?? []);
    const mensagens = erros.flatMap(toMensagem);
    if (mensagens.length === 0)
        return undefined;
    const tipoAmbiente = toTipoAmbiente(body.tipoAmbiente);
    const dataHora = toDate(body.dataHoraProcessamento);
    return new ReceitaRejectionError({
        mensagens,
        ...(body.idDPS ? { idDps: body.idDPS } : {}),
        ...(tipoAmbiente ? { tipoAmbiente } : {}),
        ...(body.versaoAplicativo ? { versaoAplicativo: body.versaoAplicativo } : {}),
        ...(dataHora ? { dataHoraProcessamento: dataHora } : {}),
        ...(options?.cause !== undefined ? { cause: options.cause } : {}),
    });
}
/**
 * Converte o corpo `ResponseErro` (mensagem única) em `ReceitaRejectionError`.
 * Retorna `undefined` se o corpo não carregar uma mensagem reconhecível.
 */
export function receitaRejectionFromResponseErro(body, options) {
    const b = body;
    const erro = body.erro ?? b.Erro;
    // SEFIN devolve `erro` ora como objeto (swagger), ora como array (eventos em
    // produção) — normalizamos pra lista única antes de mapear.
    const erros = !erro
        ? []
        : Array.isArray(erro)
            ? erro
            : [erro];
    const mensagens = erros.flatMap(toMensagem);
    if (mensagens.length === 0)
        return undefined;
    const tipoAmbiente = toTipoAmbiente(body.tipoAmbiente);
    const dataHora = toDate(body.dataHoraProcessamento);
    return new ReceitaRejectionError({
        mensagens,
        ...(tipoAmbiente ? { tipoAmbiente } : {}),
        ...(body.versaoAplicativo ? { versaoAplicativo: body.versaoAplicativo } : {}),
        ...(dataHora ? { dataHoraProcessamento: dataHora } : {}),
        ...(options?.cause !== undefined ? { cause: options.cause } : {}),
    });
}
function pickStr(obj, ...keys) {
    for (const k of keys) {
        const v = obj[k];
        if (typeof v === 'string' && v.length > 0)
            return v;
    }
    return undefined;
}
function toMensagem(raw) {
    if (!raw)
        return [];
    const r = raw;
    const codigo = pickStr(r, 'codigo', 'Codigo');
    const descricao = pickStr(r, 'descricao', 'Descricao');
    if (!codigo && !descricao)
        return [];
    const complemento = pickStr(r, 'complemento', 'Complemento');
    return [
        {
            codigo: codigo ?? 'UNKNOWN',
            descricao: descricao ?? '(sem descrição)',
            ...(complemento ? { complemento } : {}),
        },
    ];
}
function toTipoAmbiente(v) {
    if (v === 1)
        return TipoAmbiente.Producao;
    if (v === 2)
        return TipoAmbiente.Homologacao;
    return undefined;
}
function toDate(v) {
    if (!v)
        return undefined;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? undefined : d;
}
//# sourceMappingURL=receita.js.map