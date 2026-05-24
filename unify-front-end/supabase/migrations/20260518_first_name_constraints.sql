-- Defense-in-depth: enforce length and reject control characters at the DB
-- level so a client that bypasses sanitizeFirstName (e.g. a direct PATCH from
-- a malicious session) cannot store a hostile value used later in prompts,
-- email HTML, or push bodies.
--
-- The client validates 1–24 chars and strips emoji/control chars; the DB cap
-- is intentionally looser (100) to absorb any future client relaxation
-- without another migration, while still bounding worst-case storage.

ALTER TABLE public.users
  ADD CONSTRAINT users_first_name_length_check
  CHECK (first_name IS NULL OR char_length(first_name) <= 100);

ALTER TABLE public.users
  ADD CONSTRAINT users_first_name_no_control_chars_check
  CHECK (first_name IS NULL OR first_name !~ '[[:cntrl:]]');
