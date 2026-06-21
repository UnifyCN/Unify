-- Fix AI Companion message counting (investigation findings 1-3)
--
-- Background: a successful Companion message was being counted TWICE.
--   - check_and_increment_chatbot_usage (rate limit, runs before generation)
--     increments message_count.
--   - increment_chatbot_usage (token/cost persist, runs after generation) ALSO
--     incremented message_count.
-- Net: every successful message bumped message_count by 2, so with the client's
-- 6/day cap users were actually cut off after ~3 messages. Root cause was an
-- incomplete refactor: when check_and_increment_chatbot_usage was introduced as
-- the atomic counter, the message_count bump was never removed from
-- increment_chatbot_usage.
--
-- This migration makes check_and_increment_chatbot_usage the SINGLE owner of
-- message_count, turns increment_chatbot_usage into a tokens+cost-only writer,
-- adds a refund path so a failed/aborted generation gives the slot back, and
-- lowers the default daily cap to 6 to match the product limit.

-- =============================================================================
-- 1. increment_chatbot_usage: tokens + cost only (NO message_count).
--    check_and_increment_chatbot_usage owns the counter now.
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
  -- message_count starts at 0 on insert: this RPC never owns the counter.
  -- In practice the row already exists (check_and_increment ran first), so the
  -- INSERT branch is only a defensive fallback.
  INSERT INTO public.chatbot_usage (user_id, message_count, last_message_at, total_tokens_used, total_estimated_cost_usd)
  VALUES (p_user_id, 0, now(), p_tokens, p_cost)
  ON CONFLICT (user_id) DO UPDATE SET
    total_tokens_used = chatbot_usage.total_tokens_used + p_tokens,
    total_estimated_cost_usd = chatbot_usage.total_estimated_cost_usd + p_cost,
    last_message_at = now();
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_chatbot_usage(uuid, bigint, double precision) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_chatbot_usage(uuid, bigint, double precision) TO service_role;

-- =============================================================================
-- 2. refund_chatbot_message: give back one slot when a counted request fails.
--    check_and_increment increments BEFORE generation; if generation then fails
--    (upstream busy, error, or client disconnect) the slot must be returned so
--    users are not charged for a response they never saw. Floored at 0 and
--    scoped to today's row so it can never push the count negative or refund a
--    stale day.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.refund_chatbot_message(
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chatbot_usage
    SET message_count = GREATEST(message_count - 1, 0)
    WHERE user_id = p_user_id
      AND last_message_at::date = current_date;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.refund_chatbot_message(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refund_chatbot_message(uuid) TO service_role;

-- =============================================================================
-- 3. check_and_increment_chatbot_usage: unchanged logic, default cap 30 -> 6.
--    The edge function passes the limit explicitly; this default is defense in
--    depth so the server cap can never silently disagree with the product cap.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.check_and_increment_chatbot_usage(
  p_user_id uuid,
  p_daily_limit integer DEFAULT 6
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
    RETURN false;  -- unknown user -> deny
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
