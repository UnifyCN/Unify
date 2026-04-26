-- Allow the actor (the user who triggered a notification) to read back the
-- row they just inserted. Without this, .insert(...).select('id').single()
-- in services/notifications/createXxxNotification.ts fails RLS on the
-- RETURNING clause and Postgres rejects the entire INSERT with 42501,
-- silently breaking social push notifications for likes, comments, and
-- comment replies. Existing recipient SELECT policy stays unchanged.
drop policy if exists community_notifications_select_actor
    on public.community_notifications;

create policy community_notifications_select_actor
    on public.community_notifications
    for select
    using (auth.uid() = triggered_by_user_id);
