-- Column-level UPDATE grants on public.users are scoped to a hand-picked set of
-- user-editable fields (biography, username, pronouns, profile_picture_url,
-- consent timestamps). Adding the first_name column did NOT extend that grant,
-- so updateFirstName() from the client (authenticated role) failed with
-- "permission denied for table users" even though the row-level policy
-- 'Users can update their own safe fields' would allow it.
--
-- Mirror the existing pattern: explicitly grant UPDATE on first_name to the
-- authenticated role. service_role already has table-level UPDATE.
GRANT UPDATE (first_name) ON public.users TO authenticated;
