-- Migration: Add Day 13 reminder tracking column
-- Created: 2025-01-09

-- Add column to track if Day 13 reminder has been sent
ALTER TABLE public.community_circles 
ADD COLUMN IF NOT EXISTS day_13_reminder_sent BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for efficient querying of circles needing reminders
CREATE INDEX IF NOT EXISTS community_circles_reminder_idx 
ON public.community_circles (status, ends_at, day_13_reminder_sent)
WHERE status = 'active' AND day_13_reminder_sent = FALSE;
