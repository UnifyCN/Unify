-- Security hardening migration
-- Fixes: privilege escalation via users table, missing RLS on community_matching_runs,
--        client-writable chatbot usage counter, server-side content filter for posts

-- =============================================================================
-- 1. CRITICAL: Restrict users table UPDATE — prevent self-promotion to admin
--    or self-granting premium status.
--    The old policy "Users can update their own record" allows unrestricted
--    column updates, so any authenticated user can set permissions='admin'.
-- =============================================================================

DROP POLICY IF EXISTS "Users can update their own record" ON public.users;

-- New policy: users can update their own row, but permissions and is_premium
-- must remain unchanged (only service_role / admin triggers can modify those).
CREATE POLICY "Users can update their own safe fields"
  ON public.users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND permissions IS NOT DISTINCT FROM (SELECT u.permissions FROM public.users u WHERE u.id = auth.uid())
    AND is_premium  IS NOT DISTINCT FROM (SELECT u.is_premium  FROM public.users u WHERE u.id = auth.uid())
  );

-- =============================================================================
-- 2. CRITICAL: Enable RLS on community_matching_runs
--    Currently has no RLS and full anon+authenticated grants.
-- =============================================================================

ALTER TABLE public.community_matching_runs ENABLE ROW LEVEL SECURITY;

-- Revoke broad grants — only service_role should manage matching runs
REVOKE ALL ON public.community_matching_runs FROM anon;
REVOKE ALL ON public.community_matching_runs FROM authenticated;

-- Allow authenticated users to read (for UI status display), nothing else
GRANT SELECT ON public.community_matching_runs TO authenticated;

CREATE POLICY "Authenticated users can view matching runs"
  ON public.community_matching_runs FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================================
-- 3. HIGH: Make chatbot_usage.message_count non-writable by clients
--    Replace the permissive UPDATE policy with one that only allows updating
--    last_message_at (cosmetic). The actual count increment happens via an
--    atomic RPC function called from the edge function.
-- =============================================================================

DROP POLICY IF EXISTS "Auth users can update their own usage counts" ON public.chatbot_usage;

-- Users can still read their own usage (existing SELECT policy stays)
-- Users can still insert their initial row (existing INSERT policy stays)
-- But UPDATE is now restricted: message_count and cost fields cannot change
CREATE POLICY "Users can update own usage timestamp only"
  ON public.chatbot_usage FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND message_count IS NOT DISTINCT FROM (SELECT cu.message_count FROM public.chatbot_usage cu WHERE cu.user_id = auth.uid())
    AND total_tokens_used IS NOT DISTINCT FROM (SELECT cu.total_tokens_used FROM public.chatbot_usage cu WHERE cu.user_id = auth.uid())
    AND total_estimated_cost_usd IS NOT DISTINCT FROM (SELECT cu.total_estimated_cost_usd FROM public.chatbot_usage cu WHERE cu.user_id = auth.uid())
  );

-- RPC function for edge functions to atomically increment usage (service_role only)
CREATE OR REPLACE FUNCTION public.increment_chatbot_usage(
  p_user_id uuid,
  p_tokens bigint DEFAULT 0,
  p_cost double precision DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.chatbot_usage (user_id, message_count, last_message_at, total_tokens_used, total_estimated_cost_usd)
  VALUES (p_user_id, 1, now(), p_tokens, p_cost)
  ON CONFLICT (user_id) DO UPDATE SET
    message_count = chatbot_usage.message_count + 1,
    last_message_at = now(),
    total_tokens_used = chatbot_usage.total_tokens_used + p_tokens,
    total_estimated_cost_usd = chatbot_usage.total_estimated_cost_usd + p_cost;
END;
$$;

-- Only service_role can call this function
REVOKE EXECUTE ON FUNCTION public.increment_chatbot_usage(uuid, bigint, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_chatbot_usage(uuid, bigint, double precision) TO service_role;

-- =============================================================================
-- 4. HIGH: Server-side content filter for posts
--    Rejects posts containing banned words, matching the client-side filter.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_post_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  normalized text;
  banned text[] := ARRAY[
    'nigger','nigga','chink','gook','spic','wetback','kike','beaner','coon',
    'darkie','raghead','towelhead','redskin','injun','jap','cracker','honky',
    'gringo','paki','faggot','fag','dyke','tranny','cunt','whore','slut',
    'kill yourself','kys','go die','heil hitler','white power',
    'white supremacy','death to'
  ];
  word text;
BEGIN
  -- Normalize: lowercase, strip zero-width chars, basic l33t speak
  normalized := lower(NEW.content);
  normalized := regexp_replace(normalized, '[\u200B\u200C\u200D\u2060\uFEFF\u00AD]', '', 'g');
  normalized := translate(normalized, '013457@$', 'oieatsa');

  FOREACH word IN ARRAY banned LOOP
    IF normalized ~* ('\m' || word || '\M') THEN
      RAISE EXCEPTION 'Content violates community guidelines'
        USING ERRCODE = 'check_violation';
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_post_content ON public.posts;
CREATE TRIGGER trg_check_post_content
  BEFORE INSERT OR UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_post_content();
