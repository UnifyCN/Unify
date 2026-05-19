ALTER TABLE public.users ADD COLUMN first_name text;

COMMENT ON COLUMN public.users.first_name IS
  'User-provided display name shown only on private surfaces (Learn greeting, Companion, Account Settings, ProfileModal, welcome email, push notifications). NULL means the user has not set one yet — surfaces must fall back gracefully. Username remains the public @handle and is unaffected. Validated client-side (1–24 chars, Unicode allowed, no emoji).';
