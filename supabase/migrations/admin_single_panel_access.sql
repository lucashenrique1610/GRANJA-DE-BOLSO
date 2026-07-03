-- Administrador unico da plataforma
-- Objetivos:
-- 1) garantir que apenas resellr7@gmail.com seja admin
-- 2) impedir a existencia de mais de um app_role = 'admin'

DO $$
DECLARE
  target_admin_id UUID;
BEGIN
  SELECT u.id
  INTO target_admin_id
  FROM public.users AS u
  WHERE LOWER(BTRIM(u.email)) = 'resellr7@gmail.com'
  LIMIT 1;

  IF target_admin_id IS NULL THEN
    RAISE EXCEPTION 'Nao foi encontrado o usuario administrador esperado: resellr7@gmail.com'
      USING ERRCODE = 'P0002';
  END IF;

  ALTER TABLE public.users DISABLE TRIGGER trg_prevent_user_app_role_self_change;

  UPDATE public.users
  SET app_role = 'usuario'
  WHERE app_role = 'admin'
    AND id <> target_admin_id;

  UPDATE public.users
  SET app_role = 'admin'
  WHERE id = target_admin_id;

  ALTER TABLE public.users ENABLE TRIGGER trg_prevent_user_app_role_self_change;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS users_single_admin_idx
ON public.users ((TRUE))
WHERE app_role = 'admin';
