function formatTime() {
  return new Date().toISOString();
}

function logJson(level: 'info' | 'warn' | 'error', message: string, fields: Record<string, unknown> = {}) {
  const entry = { ts: formatTime(), level, message, logger: 'granja-de-bolso-client', ...fields };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const clientLogger = {
  info: (message: string, fields = {}) => logJson('info', message, fields),
  warn: (message: string, fields = {}) => logJson('warn', message, fields),
  error: (message: string, error?: unknown, fields = {}) =>
    logJson('error', message, {
      ...fields,
      error: error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : String(error),
    }),
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly requestId: string | null,
    public readonly status: number,
    public readonly url?: string,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

/** Formata a mensagem de erro para exibicao, anexando o requestId do servidor quando existir. */
export function formatApiError(error: unknown): string {
  if (error instanceof ApiRequestError && error.requestId) {
    return `${error.message} [requestId: ${error.requestId}]`;
  }
  return error instanceof Error ? error.message : String(error);
}

export interface ApiFetchOptions extends RequestInit {
  label?: string;
}

/**
 * Busca com rastreabilidade fim-a-fim:
 * mede duracao, registra log JSON (sucesso/erro), propaga o requestId
 * retornado pelo servidor (header X-Request-ID) e lanca ApiRequestError
 * com a mensagem do servidor + id de correlacao.
 */
export async function apiFetch<T = unknown>(
  input: RequestInfo | URL,
  init: ApiFetchOptions = {},
): Promise<T> {
  const startedAt = performance.now();
  const label = init.label || String(input);

  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    clientLogger.error('client.fetch_failed', error, { url: label, durationMs: performance.now() - startedAt });
    throw error;
  }

  const durationMs = performance.now() - startedAt;
  const requestId = response.headers.get('x-request-id');

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String((payload as Record<string, unknown>).error)
        : `Falha na requisicao (HTTP ${response.status}).`;
    clientLogger.error('api.request_failed', undefined, {
      url: label,
      status: response.status,
      requestId,
      durationMs,
    });
    throw new ApiRequestError(message, requestId, response.status, label);
  }

  clientLogger.info('api.request_ok', { url: label, status: response.status, requestId, durationMs });
  return payload as T;
}