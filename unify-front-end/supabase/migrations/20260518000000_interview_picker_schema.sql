-- Add opt-out columns to public.users
ALTER TABLE public.users
  ADD COLUMN do_not_contact boolean NOT NULL DEFAULT false,
  ADD COLUMN do_not_contact_at timestamptz,
  ADD COLUMN do_not_contact_reason text
    CHECK (do_not_contact_reason IN ('unsubscribed','hard_bounce','manual')
           OR do_not_contact_reason IS NULL);

-- Create interview_invites pipeline table
CREATE TABLE public.interview_invites (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email               text NOT NULL,
  name                text,
  tier                text NOT NULL CHECK (tier IN ('C','B')),
  surfaces_14d        int  NOT NULL,
  events_14d          int  NOT NULL,
  companion_msgs_14d  int  NOT NULL,
  picked_at           timestamptz NOT NULL DEFAULT now(),
  status              text NOT NULL DEFAULT 'pending_approval'
    CHECK (status IN (
      'pending_approval','approved','sent','skipped',
      'booked','unsubscribed','bounced','expired'
    )),
  email_subject       text,
  email_body          text,
  resend_email_id     text,
  approved_at         timestamptz,
  sent_at             timestamptz,
  booked_at           timestamptz,
  cal_booking_id      text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Cooldown lookup index
CREATE INDEX idx_invites_user_picked
  ON public.interview_invites(user_id, picked_at DESC);

-- In-flight status lookup
CREATE INDEX idx_invites_status
  ON public.interview_invites(status)
  WHERE status IN ('pending_approval','approved','sent');

-- Match by email (cal.com webhook)
CREATE INDEX idx_invites_email_sent
  ON public.interview_invites(email, sent_at DESC)
  WHERE status = 'sent';

-- Match by resend_email_id (bounce webhook)
CREATE INDEX idx_invites_resend_id
  ON public.interview_invites(resend_email_id)
  WHERE resend_email_id IS NOT NULL;

-- Auto-touch updated_at
CREATE OR REPLACE FUNCTION public.tg_interview_invites_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_interview_invites_updated_at
BEFORE UPDATE ON public.interview_invites
FOR EACH ROW EXECUTE FUNCTION public.tg_interview_invites_updated_at();

-- Lock down to service-role only (no policies = no anon/authenticated access)
ALTER TABLE public.interview_invites ENABLE ROW LEVEL SECURITY;
