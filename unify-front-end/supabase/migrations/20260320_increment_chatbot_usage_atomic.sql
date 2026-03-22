create or replace function public.increment_chatbot_usage(
  p_user_id uuid,
  p_tokens bigint,
  p_cost double precision
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.chatbot_usage (
    user_id,
    total_tokens_used,
    total_estimated_cost_usd,
    last_message_at
  )
  values (
    p_user_id,
    coalesce(p_tokens, 0),
    coalesce(p_cost, 0),
    now()
  )
  on conflict (user_id) do update
  set
    total_tokens_used =
      coalesce(public.chatbot_usage.total_tokens_used, 0) +
      coalesce(excluded.total_tokens_used, 0),
    total_estimated_cost_usd =
      coalesce(public.chatbot_usage.total_estimated_cost_usd, 0) +
      coalesce(excluded.total_estimated_cost_usd, 0),
    last_message_at = excluded.last_message_at;
$$;
