import { authenticateRequest, authorizeAppRole } from '../../server/auth.js';
import { readJsonBody } from '../../server/billing-store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
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
    const { userId, enabled, notes } = await readJsonBody(req);

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({ error: 'Informe o usuario alvo.' });
      return;
    }

    if (typeof enabled !== 'boolean') {
      res.status(400).json({ error: 'Informe se o acesso de divulgador deve ser ativado ou removido.' });
      return;
    }

    const { data, error } = await authResult.requestClient.rpc('admin_set_user_divulgador', {
      target_user_id: userId,
      enabled,
      notes: typeof notes === 'string' ? notes : null,
    });

    if (error) {
      throw error;
    }

    res.status(200).json({
      user: data,
      message: enabled
        ? 'Usuario promovido a divulgador com sucesso.'
        : 'Acesso de divulgador removido com sucesso.',
    });
  } catch (error) {
    console.error('Erro ao atualizar acesso de divulgador:', error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : 'Falha ao atualizar o acesso de divulgador.',
    });
  }
}
