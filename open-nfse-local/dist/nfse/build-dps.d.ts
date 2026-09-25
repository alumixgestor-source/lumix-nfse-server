import type { DPS } from './domain.js';
import { OpcaoSimplesNacional, TipoRetISSQN, TipoTribISSQN } from './enums.js';
import type { IndicadorTotalTributos, RegimeApuracaoSimplesNacional, RegimeEspecialTributacao, TipoAmbienteDps } from './enums.js';
/** Regime tributário do emitente. Casa com os grupos do `TCRegTrib`. */
export interface RegimeTributario {
    readonly opSimpNac: OpcaoSimplesNacional;
    readonly regEspTrib: RegimeEspecialTributacao;
    /** Obrigatório quando `opSimpNac === MeEpp`. */
    readonly regApTribSN?: RegimeApuracaoSimplesNacional;
}
/** Endereço nacional na forma ergonômica aceita pelo builder. */
export interface EnderecoBr {
    /** Código IBGE do município (7 dígitos). */
    readonly codMunicipio: string;
    /** CEP (8 dígitos sem máscara). */
    readonly cep: string;
    readonly logradouro: string;
    readonly numero: string;
    readonly bairro: string;
    readonly complemento?: string;
}
/**
 * Identificação do emitente prestador.
 *
 * `xNome` (nome/razão social) e endereço **não** são aceitos aqui de propósito:
 * `buildDps` sempre usa `tpEmit='1'` (prestador é o próprio emitente), e a SEFIN
 * rejeita esses campos no bloco `prest` nesse cenário — eles são preenchidos a
 * partir do cadastro do CNPJ. Os mesmos dados aparecem no `NFSe` retornado.
 */
export interface EmitenteInput {
    readonly cnpj: string;
    /** Código IBGE do município emissor (7 dígitos). */
    readonly codMunicipio: string;
    readonly inscricaoMunicipal?: string;
    readonly regime: RegimeTributario;
    readonly email?: string;
    readonly fone?: string;
}
/** Identificação do tomador. */
export interface TomadorInput {
    readonly documento: {
        readonly CNPJ: string;
    } | {
        readonly CPF: string;
    };
    readonly nome: string;
    readonly inscricaoMunicipal?: string;
    readonly email?: string;
    readonly fone?: string;
    readonly endereco?: EnderecoBr;
}
/** Descrição do serviço. */
export interface ServicoInput {
    /** Código nacional do serviço (LC 116 + Anexo). */
    readonly cTribNac: string;
    /**
     * Código NBS do serviço. Opcional — apesar da NT04 declarar o elemento sem
     * `minOccurs`, a SEFIN não rejeita DPS sem `cNBS`. Quando omitido, o
     * `<cNBS>` não é serializado.
     */
    readonly cNBS?: string;
    readonly descricao: string;
    /** Default: `emitente.codMunicipio`. */
    readonly codMunicipioPrestacao?: string;
    readonly cTribMun?: string;
    /** Código interno do contribuinte para essa linha de serviço. */
    readonly codigoInterno?: string;
}
/** Valores e tributação do serviço. */
export interface ValoresInput {
    readonly vServ: number;
    /**
     * **Não use com `buildDps`.** `buildDps` sempre emite `tpEmit=1` (prestador é o
     * emitente), e `vReceb` só é válido com `tpEmit=3` (intermediário) — informá-lo
     * lança `RuleViolationError` (E0424). Para o cenário de intermediário, construa
     * `InfDPS` manualmente.
     */
    readonly vReceb?: number;
    /**
     * Alíquota ISS em **percentual** (ex: `2.5` = 2,5%, NÃO `0.025`). Preenche
     * `tribMun.pAliq` (`TCTribMunicipal`, `minOccurs="0"`). Pelo XSD: se o
     * município de incidência pertence ao Sistema Nacional NFS-e a alíquota é
     * parametrizada e fornecida pelo sistema — nesse caso omita (`undefined`);
     * fora do Sistema Nacional, o emitente fornece. Valores `0 < x < 0.5` são
     * rejeitados em tempo de build (quase sempre erro de fração-vs-percentual).
     *
     * Em termos de serialização: `undefined` não emite `<pAliq>`; um valor
     * definido (inclusive `0`) emite `<pAliq>` com aquele valor.
     */
    readonly aliqIss?: number;
    /** Default `'1'` (operação tributável). */
    readonly tribISSQN?: TipoTribISSQN;
    /** Default `'1'` (sem retenção). */
    readonly tpRetISSQN?: TipoRetISSQN;
    /**
     * Indicador de "sem total de tributos" (`'0'`) do choice `totTrib`. **Válido
     * apenas para MEI** (`opSimpNac=2`): Não Optante e ME/EPP não podem informá-lo
     * (E0713/E0712). Para MEI sem nenhum membro de `totTrib`, este é o default.
     */
    readonly indTotTrib?: IndicadorTotalTributos;
    /**
     * Alíquota aproximada do Simples Nacional (%) — choice `totTrib`. **Válido
     * apenas para ME/EPP** (`opSimpNac=3`): MEI (E0710) e Não Optante (E0713) não
     * podem informá-lo.
     */
    readonly pTotTribSN?: number;
    /**
     * Total aproximado de tributos em **valor** (Lei da Transparência / IBPT) —
     * choice `totTrib`. Válido para qualquer regime; é o membro a usar para **Não
     * Optante** (junto de `pTotTrib`), que não pode usar `indTotTrib`/`pTotTribSN`.
     */
    readonly vTotTrib?: {
        readonly vTotTribFed: number;
        readonly vTotTribEst: number;
        readonly vTotTribMun: number;
    };
    /**
     * Total aproximado de tributos em **percentual** — choice `totTrib`. Válido
     * para qualquer regime (alternativa a `vTotTrib` para Não Optante).
     */
    readonly pTotTrib?: {
        readonly pTotTribFed: number;
        readonly pTotTribEst: number;
        readonly pTotTribMun: number;
    };
}
export interface BuildDpsParams {
    readonly emitente: EmitenteInput;
    readonly serie: string;
    /**
     * Identificador sequencial da DPS na série, como string. **Não preencher com
     * zeros à esquerda** — o `Id` da DPS é composto a partir da string passada
     * aqui, então `'1'` e `'00001'` produzem `Id`s diferentes mesmo representando
     * o mesmo número. O `DpsCounter` (acionado por `NfseClient.emitir`) já segue
     * a convenção sem padding.
     */
    readonly nDPS: string;
    /** Default `'2'` (Homologação). */
    readonly tpAmb?: TipoAmbienteDps;
    /** Default `new Date()`. */
    readonly dhEmi?: Date;
    /**
     * Competência (mês/ano) da prestação do serviço. Default `new Date()` (hoje).
     * Para notas com competência retroativa (ex.: serviço prestado no mês anterior)
     * informe explicitamente — o default não deduz nada de `dhEmi`.
     */
    readonly dCompet?: Date;
    /** Versão do aplicativo emissor. Default `open-nfse/<VERSÃO_ATUAL>`. */
    readonly verAplic?: string;
    readonly servico: ServicoInput;
    readonly valores: ValoresInput;
    readonly tomador?: TomadorInput;
    /**
     * Pula a validação de dígito verificador de CPF/CNPJ (emitente + tomador).
     * Default `false`. `emitir` repassa esta opção para cá, então o escape hatch
     * documentado continua funcionando no caminho seguro.
     */
    readonly skipCpfCnpjValidation?: boolean;
}
/**
 * Constrói uma `DPS` completa a partir de um subconjunto ergonômico de campos.
 * Cobre o caso comum (prestador brasileiro, serviço único, tomador BR opcional)
 * preenchendo todo o boilerplate do layout RTC v1.01.
 *
 * Para cenários avançados — exterior, obra, atvEvento, dedução/redução, IBSCBS —
 * construa `InfDPS` manualmente (todos os tipos da RTC estão exportados).
 */
export declare function buildDps(params: BuildDpsParams): DPS;
//# sourceMappingURL=build-dps.d.ts.map