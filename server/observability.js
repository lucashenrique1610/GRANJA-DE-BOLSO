import { randomUUID } from 'node:crypto';
import os from 'node:os';
import { AsyncLocalStorage } from 'node:async_hooks';

const requestContextStore = new AsyncLocalStorage();
const nowMs = () => Date.now();

function formatTime(tsMs) {
  return new Date(tsMs).toISOString();
}

function safeStack(error) {
  if (error instanceof Error) {
    return error.stack || `${error.name}: ${error.message}`;
  }
  const text = typeof error === 'string' ? error : JSON.stringify(error);
  return `NonErrorThrown: ${text}`;
}

export class Logger {
  constructor(fields = {}) {
    this.base = { logger: 'granja-de-bolso', ...fields };
  }

  child(fields) {
    return new Logger({ ...this.base, ...fields });
  }

  log(level, message, fields = {}) {
    const activeRequestContext = requestContextStore.getStore();
    const entry = {
      ts: formatTime(nowMs()),
      level,
      message,
      ...(activeRequestContext ? { requestId: activeRequestContext.requestId } : {}),
      ...this.base,
      ...fields,
    };
    if (level === 'error' || level === 'alert') {
      console.error(JSON.stringify(entry));
    } else {
      console.log(JSON.stringify(entry));
    }
    return entry;
  }

  debug(message, fields) {
    return this.log('debug', message, fields);
  }

  info(message, fields) {
    return this.log('info', message, fields);
  }

  warn(message, fields) {
    return this.log('warn', message, fields);
  }

  error(message, error, fields = {}) {
    return this.log('error', message, {
      ...fields,
      error: {
        name: error instanceof Error ? error.name : typeof error,
        message: error instanceof Error ? error.message : String(error),
        stack: safeStack(error),
      },
    });
  }

  alert(message, fields = {}) {
    return this.log('alert', message, { severity: 'high', ...fields });
  }
}

export function snapshotResources() {
  const memory = process.memoryUsage();
  const loadavg = os.loadavg();
  return {
    memory: {
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
      externalBytes: memory.external,
    },
    cpu: {
      cores: os.cpus().length,
      loadavg1m: loadavg[0],
      loadavg5m: loadavg[1],
      loadavg15m: loadavg[2],
    },
    uptimeSeconds: Math.round(process.uptime()),
    hostUptimeSeconds: Math.round(os.uptime()),
  };
}

function summarizeDbResult(result) {
  if (result && typeof result === 'object' && 'error' in result) {
    return { ok: !result.error, error: result.error?.message || null };
  }
  return { ok: true };
}

function wrapBuilder(builder, table, op, logger) {
  const wrap = (target, currentOp) =>
    new Proxy(target, {
      get(proxyTarget, prop) {
        const original = Reflect.get(proxyTarget, prop);
        if (typeof original !== 'function') return original;

        if (prop === 'then' || prop === 'catch' || prop === 'finally') {
          return (...args) => {
            const startedAt = nowMs();
            const result = original.apply(proxyTarget, args);
            const report = (outcome) =>
              logger.debug('db.query', {
                table,
                op: currentOp,
                durationMs: nowMs() - startedAt,
                ...outcome,
              });

            if (prop === 'then') {
              const [onFulfilled, onRejected] = args;
              return proxyTarget.then(
                (value) => {
                  const summary = summarizeDbResult(value);
                  report(summary);
                  return onFulfilled ? onFulfilled(value) : value;
                },
                (reason) => {
                  report({ ok: false, error: reason?.message || String(reason) });
                  if (onRejected) return onRejected(reason);
                  throw reason;
                },
              );
            }
            return result;
          };
        }

        if (prop === 'select' || prop === 'insert' || prop === 'update' || prop === 'delete' || prop === 'upsert') {
          return (...args) => {
            const result = original.apply(proxyTarget, args);
            return wrap(result, prop);
          };
        }

        return (...args) => {
          const result = original.apply(proxyTarget, args);
          if (result && (typeof result === 'object' || typeof result === 'function')) {
            return wrap(result, currentOp);
          }
          return result;
        };
      },
    });

  return wrap(builder, op);
}

export function instrumentSupabaseClient(client, logger = new Logger()) {
  return new Proxy(client, {
    get(target, prop) {
      if (prop === 'from') {
        return (table) => wrapBuilder(target.from(table), table, 'read', logger);
      }
      if (prop === 'rpc') {
        return (fnName, ...args) => {
          const result = target.rpc(fnName, ...args);
          return wrapBuilder(result, fnName, 'rpc', logger);
        };
      }
      const original = Reflect.get(target, prop);
      return typeof original === 'function' ? original.bind(target) : original;
    },
  });
}

export function createRequestContext({ requestId = randomUUID(), logger = new Logger() } = {}) {
  const now = nowMs();
  return {
    requestId,
    startedAt: now,
    logger: logger.child({ requestId }),
    info(message, fields) {
      return this.logger.info(message, fields);
    },
    warn(message, fields) {
      return this.logger.warn(message, fields);
    },
    error(message, error, fields = {}) {
      return this.logger.error(message, error, fields);
    },
    metric(label, fields = {}) {
      return this.logger.debug('metric', {
        metric: label,
        durationMs: nowMs() - this.startedAt,
        ...fields,
      });
    },
  };
}

export function withObservability(handler) {
  return async (req, res) => {
    const incomingRequestId = req.headers['x-request-id'];
    const requestId =
      typeof incomingRequestId === 'string' && incomingRequestId.trim() ? incomingRequestId.trim() : randomUUID();
    const ctx = createRequestContext({ requestId });
    const startedAt = ctx.startedAt;

    res.setHeader('X-Request-ID', requestId);

    return requestContextStore.run(ctx, async () => {
      try {
        const result = await handler(req, res, ctx);
        ctx.metric('request.completed', {
          method: req.method,
          path: req.url,
          status: res.statusCode || 200,
        });
        return result;
      } catch (error) {
        ctx.error('request.failed', error, {
          method: req.method,
          path: req.url,
        });
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.status(500).json({
            error: 'Erro interno do servidor.',
            requestId,
          });
        }
        return undefined;
      }
    });
  };
}

export function createJsonLogMiddleware() {
  const logger = new Logger();
  return function jsonLogMiddleware(req, res, next) {
    const requestId = req.headers['x-request-id'];
    res.setHeader('X-Request-ID', typeof requestId === 'string' ? requestId : randomUUID());
    const startedAt = nowMs();
    const originalJson = res.json;
    res.json = function jsonWithLog(payload) {
      logger.info('http.response', {
        method: req.method,
        path: req.url,
        status: res.statusCode,
        durationMs: nowMs() - startedAt,
      });
      return originalJson.call(this, payload);
    };
    if (typeof next === 'function') next();
  };
}