-- Revert auto-trial trigger to fix user creation error
-- The logic is already handled by the API endpoint /api/subscription/status
-- which is safer and doesn't block user signup

DROP TRIGGER IF EXISTS on_auth_user_created_trial ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_trial();
