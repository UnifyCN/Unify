-- Fix: daily_tips.user_id FK was added without ON DELETE CASCADE in
-- 20260411_daily_tips_per_user.sql, which blocked delete_user() RPC with
-- FK violation 23503. All other auth.users FKs in this project cascade.

ALTER TABLE daily_tips
  DROP CONSTRAINT daily_tips_user_id_fkey;

ALTER TABLE daily_tips
  ADD CONSTRAINT daily_tips_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
