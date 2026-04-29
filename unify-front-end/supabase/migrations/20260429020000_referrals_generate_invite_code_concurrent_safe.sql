-- Make generate_invite_code resilient to concurrent collisions.
--
-- The previous version's UPDATE inside the retry loop could raise
-- unique_violation if two concurrent sessions happened to generate the same
-- candidate at the same moment, aborting the function. Wrap the UPDATE in a
-- BEGIN ... EXCEPTION WHEN unique_violation block so the loop can keep trying.
-- Re-reads at the top of the loop body are unchanged so an already-set code
-- short-circuits.

create or replace function public.generate_invite_code(target_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  existing_code text;
  candidate text;
  attempt int;
begin
  if auth.uid() is not null and auth.uid() <> target_user_id then
    raise exception 'Cannot generate invite code for another user';
  end if;

  -- Already has one?
  select invite_code into existing_code
    from public.users
    where id = target_user_id;

  if existing_code is not null then
    return existing_code;
  end if;

  -- Generate + retry on collision (max 5 attempts; collision probability negligible).
  for attempt in 1..5 loop
    candidate := '';
    for i in 1..6 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;

    -- Wrap the UPDATE so a unique_violation on invite_code (concurrent insert
    -- of the same candidate by another session) is caught and we retry.
    begin
      update public.users
        set invite_code = candidate
        where id = target_user_id
          and invite_code is null;

      if found then
        return candidate;
      end if;
    exception
      when unique_violation then
        -- Candidate collided with another user's freshly-set code. Loop and
        -- generate a new candidate.
        null;
    end;

    -- Either no row was updated (someone else set invite_code for this user
    -- concurrently) or we hit a collision and retried. Re-read.
    select invite_code into existing_code
      from public.users
      where id = target_user_id;

    if existing_code is not null then
      return existing_code;
    end if;
  end loop;

  raise exception 'Failed to generate unique invite code after 5 attempts';
end;
$$;

revoke all on function public.generate_invite_code(uuid) from public;
grant execute on function public.generate_invite_code(uuid) to authenticated;
