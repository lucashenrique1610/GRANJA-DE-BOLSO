-- RBAC básico de aplicação
-- Objetivos:
-- 1) adicionar o papel do usuário no perfil
-- 2) impedir autoelevação de privilégio via cliente autenticado
-- 3) garantir pelo menos um administrador inicial

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS app_role TEXT;

UPDATE public.users
SET app_role = 'usuario'
WHERE app_role IS NULL;

ALTER TABLE public.users
  ALTER COLUMN app_role SET DEFAULT 'usuario';

ALTER TABLE public.users
  ALTER COLUMN app_role SET NOT NULL;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_app_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_app_role_check
  CHECK (app_role IN ('usuario', 'moderador', 'admin'));

DO $$
DECLARE
  bootstrap_admin_id UUID;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE app_role = 'admin') THEN
    SELECT COALESCE(
      (
        SELECT u.id
        FROM public.users u
        INNER JOIN public.granjas g ON g.user_id = u.id
        ORDER BY u.created_at ASC NULLS LAST
        LIMIT 1
      ),
      (
        SELECT u.id
        FROM public.users u
        ORDER BY u.created_at ASC NULLS LAST
        LIMIT 1
      )
    )
    INTO bootstrap_admin_id;

    IF bootstrap_admin_id IS NOT NULL THEN
      UPDATE public.users
      SET app_role = 'admin'
      WHERE id = bootstrap_admin_id;
    END IF;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.prevent_user_app_role_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.app_role IS DISTINCT FROM OLD.app_role THEN
    IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
      RAISE EXCEPTION 'Somente processos administrativos podem alterar o papel do usuário.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_user_app_role_self_change ON public.users;

CREATE TRIGGER trg_prevent_user_app_role_self_change
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_user_app_role_self_change();
