-- Allow authenticated user to delete their own auth row (SECURITY DEFINER).
-- public.users and all dependent rows cascade from auth.users ON DELETE CASCADE.
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM auth.users WHERE id = auth.uid();
$$;
