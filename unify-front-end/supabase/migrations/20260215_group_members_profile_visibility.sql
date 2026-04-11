-- Allow authenticated users to read group memberships for profile pages.
-- Without this, querying another user's memberships returns zero rows under self-only RLS.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'group_members'
      and policyname = 'Authenticated users can view group memberships'
  ) then
    create policy "Authenticated users can view group memberships"
      on public.group_members
      for select
      to authenticated
      using (true);
  end if;
end $$;
