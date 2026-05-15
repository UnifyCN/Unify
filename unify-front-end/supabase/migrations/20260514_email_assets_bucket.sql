-- supabase/migrations/20260514_email_assets_bucket.sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-assets', 'email-assets', true)
ON CONFLICT (id) DO NOTHING;
