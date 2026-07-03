import { createClient } from '@supabase/supabase-js';

const APP_ROLE_ORDER = {
  usuario: 1,
  moderador: 2,
  admin: 3,
};

function jsonResult(status, payload) {
  return { status, payload };
}

function extractBearerToken(headers = {}) {
  const rawHeader = headers.authorization || headers.Authorization;
  if (typeof rawHeader !== 'string') {
    return null;
  }

  const [scheme, token] = rawHeader.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token.trim();
}

function getSupabaseServerConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY,
  };
}

function createRequestSupabaseClient(token, config = getSupabaseServerConfig()) {
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

export async function authenticateRequest(headers) {
  const token = extractBearerToken(headers);
  if (!token) {
    return jsonResult(401, {
      error: 'Autenticação obrigatória para acessar este endpoint.',
    });
  }

  const requestClient = createRequestSupabaseClient(token);
  if (!requestClient) {
    return jsonResult(503, {
      error: 'Autenticação indisponível no servidor. Configure SUPABASE_URL e SUPABASE_ANON_KEY.',
    });
  }

  const { data: authData, error: authError } = await requestClient.auth.getUser();
  if (authError || !authData.user) {
    return jsonResult(401, {
      error: 'Sessão inválida ou expirada. Entre novamente.',
    });
  }

  const { data: profile, error: profileError } = await requestClient
    .from('users')
    .select('id, email, app_role, is_divulgador, divulgador_enabled_at')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResult(500, {
      error: 'Não foi possível carregar o perfil do usuário autenticado.',
    });
  }

  return {
    token,
    requestClient,
    user: authData.user,
    profile,
    appRole: profile?.app_role ?? 'usuario',
  };
}

export function authorizeAppRole(context, requiredRole) {
  if (APP_ROLE_ORDER[context.appRole] >= APP_ROLE_ORDER[requiredRole]) {
    return context;
  }

  return jsonResult(403, {
    error: requiredRole === 'admin'
      ? 'Acesso restrito a administradores.'
      : 'Acesso restrito a moderadores e administradores.',
  });
}

/**
 * Middleware HOF para proteger rotas com autenticação.
 * Passa o authResult para o handler no terceiro argumento.
 */
export function withAuth(handler) {
  return async (req, res) => {
    const authResult = await authenticateRequest(req.headers);
    if ('status' in authResult) {
      res.status(authResult.status).json(authResult.payload);
      return;
    }
    return handler(req, res, authResult);
  };
}

/**
 * Middleware HOF para proteger rotas com role específica.
 * Já inclui a verificação de autenticação (withAuth internamente).
 */
export function withRole(requiredRole, handler) {
  return withAuth(async (req, res, authResult) => {
    const roleResult = authorizeAppRole(authResult, requiredRole);
    if ('status' in roleResult) {
      res.status(roleResult.status).json(roleResult.payload);
      return;
    }
    return handler(req, res, authResult);
  });
}
