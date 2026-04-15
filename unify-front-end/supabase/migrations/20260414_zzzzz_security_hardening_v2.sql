-- Security hardening v2 — fixes from code review
-- 1. Drop client UPDATE on chatbot_usage entirely (last_message_at was still writable)
-- 2. Fix increment_chatbot_usage to reset message_count on new day
-- 3. Create atomic check_and_increment_chatbot_usage RPC (fail-closed)

-- =============================================================================
-- 1. Remove ALL client UPDATE access to chatbot_usage
--    The v1 policy still allowed clients to modify last_message_at, which
--    could be used to game the daily counter reset logic.
-- =============================================================================

DROP POLICY IF EXISTS "Users can update own usage timestamp only" ON public.chatbot_usage;
-- No replacement — only service_role (via SECURITY DEFINER RPCs) can mutate rows.

-- =============================================================================
-- 2. Fix increment_chatbot_usage: reset message_count on day rollover
--    Previously always incremented the lifetime total. After 30+ messages,
--    users would be permanently blocked on the next day.
-- =============================================================================

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
    message_count = CASE
      WHEN chatbot_usage.last_message_at::date = current_date
        THEN chatbot_usage.message_count + 1
      ELSE 1
    END,
    last_message_at = now(),
    total_tokens_used = chatbot_usage.total_tokens_used + p_tokens,
    total_estimated_cost_usd = chatbot_usage.total_estimated_cost_usd + p_cost;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_chatbot_usage(uuid, bigint, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_chatbot_usage(uuid, bigint, double precision) TO service_role;

-- =============================================================================
-- 3. Atomic check-and-increment: single RPC that either allows (increments +
--    returns true) or denies (returns false). Fail-closed on any error.
--    This replaces the separate SELECT + later increment in rag-query.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_and_increment_chatbot_usage(
  p_user_id uuid,
  p_daily_limit integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_premium boolean;
  v_today_count integer;
BEGIN
  -- Check premium status (fail-closed: treat lookup failure as non-premium)
  SELECT coalesce(is_premium, false) INTO v_is_premium
    FROM public.users
    WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;  -- unknown user → deny
  END IF;

  -- Upsert usage row and get updated count atomically
  INSERT INTO public.chatbot_usage (user_id, message_count, last_message_at)
  VALUES (p_user_id, 1, now())
  ON CONFLICT (user_id) DO UPDATE SET
    message_count = CASE
      WHEN chatbot_usage.last_message_at::date = current_date
        THEN chatbot_usage.message_count + 1
      ELSE 1
    END,
    last_message_at = now()
  RETURNING message_count INTO v_today_count;

  -- Premium users are always allowed
  IF v_is_premium THEN
    RETURN true;
  END IF;

  -- Non-premium: check the (already incremented) count against the limit.
  -- If over, roll back the increment so it doesn't consume a slot.
  IF v_today_count > p_daily_limit THEN
    UPDATE public.chatbot_usage
      SET message_count = message_count - 1
      WHERE user_id = p_user_id;
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_and_increment_chatbot_usage(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_increment_chatbot_usage(uuid, integer) TO service_role;
