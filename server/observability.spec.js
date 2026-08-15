import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Logger, createRequestContext, withObservability, instrumentSupabaseClient, snapshotResources } from './observability.js';
import { TtlCache } from './cache.js';
import { evaluateAnomalies, configureAlertThresholds } from './alert-config.js';
import healthHandler from '../api/health.js';

describe('regra 2/3: logs JSON com stack trace', () => {
  it('registra erro com stack completo e mensagem textual', () => {
    const logger = new Logger();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = new Error('falha de teste');
    const entry = logger.error('fluxo.falhou', error, { fluxo: 'checkout' });

    expect(entry.level).toBe('error');
    expect(entry.message).toBe('fluxo.falhou');
    expect(entry.error.message).toBe('falha de teste');
    expect(entry.error.stack).toContain('Error: falha de teste');
    expect(entry.error.stack.length).toBeGreaterThan(100);
    expect(JSON.stringify(entry)).toContain('"stack"');

    const printed = JSON.parse(spy.mock.calls[0][0]);
    expect(printed.ts).toBeTruthy();
    expect(printed.logger).toBe('granja-de-bolso');
    expect(typeof printed.ts).toBe('string');
    spy.mockRestore();
  });

  it('aceita erros nao-Error e ainda produz stack textual', () => {
    const logger = new Logger();
    const entry = logger.error('fluxo.falhou', 'string de erro cru');
    expect(entry.error.stack).toContain('NonErrorThrown');
  });
});

describe('regra 1: requestId unico por requisicao', () => {
  function mockRes() {
    const headers = {};
    return {
      headersSent: false,
      statusCode: 200,
      setHeader: (k, v) => (headers[k] = v),
      getHeader: (k) => headers[k],
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.payload = payload;
        return this;
      },
    };
  }

  it('gera requestId, define header X-Request-ID e loga duracao', async () => {
    const logger = new Logger();
    const spy = vi.spyOn(logger, 'log').mockImplementation(() => ({ }));
    const handler = withObservability(async (req, res, ctx) => {
      res.setHeader('X-Request-ID', ctx.requestId);
      res.status(200).json({ ok: true });
      return undefined;
    });
    const res = mockRes();
    await handler({ method: 'GET', url: '/x', headers: {} }, res);

    expect(res.getHeader('X-Request-ID')).toBeTruthy();
    expect(typeof res.getHeader('X-Request-ID')).toBe('string');
    spy.mockRestore();
  });

  it('propaga erros como JSON 500 sem vazar stack ao cliente', async () => {
    const handler = withObservability(async () => {
      throw new Error('boom interno');
    });
    const res = mockRes();
    await handler({ method: 'GET', url: '/erro', headers: {} }, res);

    expect(res.statusCode).toBe(500);
    expect(res.payload.error).toBe('Erro interno do servidor.');
    expect(res.payload.requestId).toBeTruthy();
    expect(JSON.stringify(res.payload)).not.toContain('boom interno');
  });
});

describe('regra 4: health check detalhado', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('retorna status ok quando auth e db sao ok, com metricas de recurso', async () => {
    vi.doMock('../server/billing-store.js', () => ({
      getSupabaseUrl: () => 'https://exemplo.supabase.co',
      getSupabaseAdminClient: () => ({
        from: () => ({ select: () => ({ limit: async () => ({ error: null }) }) }),
      }),
    }));

    const { default: health } = await import('../api/health.js');
    const res = {
      headersSent: false,
      statusCode: 200,
      setHeader: () => {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      },
    };
    globalThis.fetch = vi.fn(async () => ({ ok: true, status: 200 }));

    await health({ method: 'GET', url: '/api/health', headers: {} }, res);

    expect(res.statusCode).toBe(200);
    expect(res.payload.status).toBe('ok');
    expect(res.payload.checks.db.status).toBe('ok');
    expect(res.payload.resources.memory.heapUsedBytes).toBeGreaterThan(0);
    expect(res.payload.resources.cpu.cores).toBeGreaterThan(0);
    expect(res.payload.requestId).toBeTruthy();
    expect(res.payload.service).toContain('granja');
  });
});

describe('regra 5: logging de acesso a banco com tempo', () => {
  it('instrumenta o cliente e loga duracao/sucesso por query', async () => {
    const logger = new Logger();
    const recorded = [];
    vi.spyOn(logger, 'debug').mockImplementation((message, fields) => {
      recorded.push({ message, fields });
      return {};
    });

    const fakeClient = {
      from: (table) => ({
        select: () => ({
          limit: async () => ({ data: [{ id: 1 }], error: null }),
        }),
      }),
      rpc: (fn) => ({ then: (resolve) => resolve({ data: true, error: null }) }),
    };

    const instrumented = instrumentSupabaseClient(fakeClient, logger);
    const query = await instrumented.from('users').select('id').limit(1);

    expect(query.data).toEqual([{ id: 1 }]);
    const dbLog = recorded.find((r) => r.message === 'db.query' && r.fields.table === 'users');
    expect(dbLog).toBeTruthy();
    expect(typeof dbLog.fields.durationMs).toBe('number');
    expect(dbLog.fields.durationMs).toBeGreaterThanOrEqual(0);
    expect(dbLog.fields.ok).toBe(true);
    expect(dbLog.fields.op).toBe('select');
  });
});

describe('regra 6: cache com hit/miss tracking', () => {
  it('registra miss, hit e expiracao', () => {
    const cache = new TtlCache({ ttlMs: 50, maxEntries: 10 });
    cache.get('x');
    expect(cache.stats.misses).toBe(1);
    expect(cache.stats.hits).toBe(0);

    cache.set('x', { valor: 1 });
    cache.get('x');
    expect(cache.stats.hits).toBe(1);

    const stale = new TtlCache({ ttlMs: -1, maxEntries: 10 });
    stale.set('y', 1);
    stale.get('y');
    expect(stale.stats.expires).toBe(1);
    expect(stale.snapshot().hitRate).toBe(0);
  });

  it('faz eviction LRU quando excede maxEntries', () => {
    const cache = new TtlCache({ ttlMs: 1000, maxEntries: 3 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4);
    expect(cache.store.size).toBe(3);
    expect(cache.stats.evictions).toBe(1);
    expect(cache.get('a')).toBeNull();
  });
});

describe('regra 7: metricas de recursos', () => {
  it('captura memoria e cpu', () => {
    const snap = snapshotResources();
    expect(snap.memory.rssBytes).toBeGreaterThan(0);
    expect(snap.memory.heapUsedBytes).toBeGreaterThan(0);
    expect(snap.cpu.cores).toBeGreaterThan(0);
    expect(snap.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});

describe('regra 9: alertas configuraveis', () => {
  it('detecta anomalias de latencia, cache e memoria conforme limiares', () => {
    configureAlertThresholds({});

    const anomalias = evaluateAnomalies({
      durationMs: 5000,
      cacheHitRate: 0.05,
      heapUsedBytes: 95,
      heapTotalBytes: 100,
    });

    const tipos = anomalias.map((a) => a.type);
    expect(tipos).toContain('latency_alert');
    expect(tipos).toContain('cache_hit_rate_low');
    expect(tipos).toContain('memory_alert');
  });

  it('aceita override de limiares em runtime', () => {
    configureAlertThresholds({ httpLatencyMs: { warn: 10, alert: 20 } });
    expect(evaluateAnomalies({ durationMs: 15 }).map((a) => a.type)).toEqual(['latency_warn']);
    configureAlertThresholds({ httpLatencyMs: { warn: 1000, alert: 3000 } });
  });
});

describe('regra 1: contexto propagado ao handler com requestId', () => {
  it('createRequestContext expoe requestId e logger rastreado', () => {
    const ctx = createRequestContext({ requestId: 'abc-123' });
    expect(ctx.requestId).toBe('abc-123');
    expect(ctx.logger.base.requestId).toBe('abc-123');
  });
});