-- Acesso gratuito para divulgadores
-- Objetivos:
-- 1) armazenar o status de divulgador em public.users
-- 2) impedir autoelevacao do proprio usuario via cliente
-- 3) permitir alteracao controlada por admin ou service_role

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS is_divulgador BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS divulgador_enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS divulgador_enabled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS divulgador_notes TEXT;

CREATE OR REPLACE FUNCTION public.prevent_sensitive_divulgador_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
  bypass_guard TEXT := COALESCE(current_setting('app.bypass_divulgador_guard', true), '');
  is_sensitive_insert BOOLEAN :=
    COALESCE(NEW.is_divulgador, FALSE)
    OR NEW.divulgador_enabled_at IS NOT NULL
    OR NEW.divulgador_enabled_by IS NOT NULL
    OR NULLIF(BTRIM(COALESCE(NEW.divulgador_notes, '')), '') IS NOT NULL;
  is_sensitive_update BOOLEAN :=
    NEW.is_divulgador IS DISTINCT FROM OLD.is_divulgador
    OR NEW.divulgador_enabled_at IS DISTINCT FROM OLD.divulgador_enabled_at
    OR NEW.divulgador_enabled_by IS DISTINCT FROM OLD.divulgador_enabled_by
    OR NEW.divulgador_notes IS DISTINCT FROM OLD.divulgador_notes;
BEGIN
  IF jwt_role = 'service_role' OR bypass_guard = 'on' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND is_sensitive_insert THEN
    RAISE EXCEPTION 'Somente processos administrativos podem definir o status de divulgador.'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'UPDATE' AND is_sensitive_update THEN
    RAISE EXCEPTION 'Somente processos administrativos podem alterar o status de divulgador.'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_sensitive_divulgador_change ON public.users;

CREATE TRIGGER trg_prevent_sensitive_divulgador_change
BEFORE INSERT OR UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.prevent_sensitive_divulgador_change();

CREATE OR REPLACE FUNCTION public.admin_set_user_divulgador(
  target_user_id UUID,
  enabled BOOLEAN,
  notes TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role TEXT := COALESCE(current_setting('request.jwt.claim.role', true), '');
  actor_uid UUID := auth.uid();
  actor_app_role TEXT;
  sanitized_notes TEXT := NULLIF(BTRIM(COALESCE(notes, '')), '');
  updated_user public.users;
BEGIN
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Informe o usuario alvo.'
      USING ERRCODE = '22023';
  END IF;

  IF actor_role <> 'service_role' THEN
    IF actor_uid IS NULL THEN
      RAISE EXCEPTION 'Usuario nao autenticado.'
        USING ERRCODE = '42501';
    END IF;

    SELECT u.app_role
    INTO actor_app_role
    FROM public.users AS u
    WHERE u.id = actor_uid;

    IF actor_app_role IS DISTINCT FROM 'admin' THEN
      RAISE EXCEPTION 'Somente administradores podem alterar o status de divulgador.'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  PERFORM set_config('app.bypass_divulgador_guard', 'on', true);

  UPDATE public.users
  SET
    is_divulgador = enabled,
    divulgador_enabled_at = CASE
      WHEN enabled THEN COALESCE(divulgador_enabled_at, NOW())
      ELSE divulgador_enabled_at
    END,
    divulgador_enabled_by = CASE
      WHEN enabled AND actor_uid IS NOT NULL THEN COALESCE(divulgador_enabled_by, actor_uid)
      ELSE divulgador_enabled_by
    END,
    divulgador_notes = CASE
      WHEN notes IS NULL THEN divulgador_notes
      ELSE sanitized_notes
    END
  WHERE id = target_user_id
  RETURNING *
  INTO updated_user;

  IF updated_user.id IS NULL THEN
    RAISE EXCEPTION 'Usuario alvo nao encontrado.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN updated_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_divulgador_by_email(
  target_email TEXT,
  enabled BOOLEAN,
  notes TEXT DEFAULT NULL
)
RETURNS public.users
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT := NULLIF(LOWER(BTRIM(COALESCE(target_email, ''))), '');
  target_user_id UUID;
BEGIN
  IF normalized_email IS NULL THEN
    RAISE EXCEPTION 'Informe o email do usuario alvo.'
      USING ERRCODE = '22023';
  END IF;

  SELECT u.id
  INTO target_user_id
  FROM public.users AS u
  WHERE LOWER(u.email) = normalized_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Nao foi encontrado usuario com o email informado.'
      USING ERRCODE = 'P0002';
  END IF;

  RETURN public.admin_set_user_divulgador(target_user_id, enabled, notes);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_user_divulgador(UUID, BOOLEAN, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_user_divulgador_by_email(TEXT, BOOLEAN, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_set_user_divulgador(UUID, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_divulgador(UUID, BOOLEAN, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_set_user_divulgador_by_email(TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_divulgador_by_email(TEXT, BOOLEAN, TEXT) TO service_role;
