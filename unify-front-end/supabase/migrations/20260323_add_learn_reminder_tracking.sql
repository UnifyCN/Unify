-- ============================================================================
-- Add reminder tracking columns to user_lesson_progress
-- Used by send-learn-reminders edge function to avoid duplicate reminders
-- ============================================================================

alter table public.user_lesson_progress
  add column if not exists last_reminder_sent_at timestamptz,
  add column if not exists reminder_tier smallint not null default 0;

-- Index for the reminder query: find in-progress, incomplete lessons by tier
create index if not exists user_lesson_progress_reminder_idx
  on public.user_lesson_progress (is_in_progress, is_completed, reminder_tier, last_accessed_at)
  where is_in_progress = true and is_completed = false;
