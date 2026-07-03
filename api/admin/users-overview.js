import { listAdminUsersOverview } from '../../server/admin-store.js';
import { authenticateRequest, authorizeAppRole } from '../../server/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Metodo nao permitido.' });
    return;
  }

  const authResult = await authenticateRequest(req.headers);
  if ('status' in authResult) {
    res.status(authResult.status).json(authResult.payload);
    return;
  }

  const authorizationResult = authorizeAppRole(authResult, 'admin');
  if ('status' in authorizationResult) {
    res.status(authorizationResult.status).json(authorizationResult.payload);
    return;
  }

  try {
    const payload = await listAdminUsersOverview();
    res.status(200).json(payload);
  } catch (error) {
    console.error('Erro ao carregar overview administrativo:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao carregar o painel administrativo.',
    });
  }
}
