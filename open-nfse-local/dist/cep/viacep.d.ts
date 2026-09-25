import { type Dispatcher } from 'undici';
import type { CepInfo, CepValidator } from './types.js';
export interface ViaCepOptions {
    /** Endpoint base (default `https://viacep.com.br/ws`). */
    readonly endpoint?: string;
    /** Timeout por lookup em ms. Default 5000. */
    readonly timeoutMs?: number;
    /** Dispatcher undici opcional — útil para reuso de pool ou testes (MockAgent). */
    readonly dispatcher?: Dispatcher;
    /**
     * Cache em memória compartilhada para deduplicar lookups. Use o mesmo Map
     * em chamadas repetidas (lote) para cortar RTT e respeitar rate-limit do
     * ViaCEP. Default: `new Map()` por validador.
     */
    readonly cache?: Map<string, CepInfo>;
}
/**
 * Validador de CEP baseado no [ViaCEP](https://viacep.com.br/) — gratuito, sem
 * chave, usado como default pela lib. Cacheia resultados em memória por
 * instância (passe `cache` custom para compartilhar entre validadores).
 */
export declare function createViaCepValidator(options?: ViaCepOptions): CepValidator;
//# sourceMappingURL=viacep.d.ts.map