-- Fix remaining FK constraints to users that block delete_user() RPC.
-- Found during full audit after the daily_tips cascade fix surfaced more
-- missing constraints. Policy:
--   - Personal/transient data (notifications): CASCADE
--   - Moderation records (reports): SET NULL on actor columns to preserve
--     the audit trail while honoring the deleted user's right to erasure.

-- 1. community_notifications.triggered_by_user_id — CASCADE
ALTER TABLE community_notifications
  DROP CONSTRAINT community_notifications_triggered_by_user_id_fkey;
ALTER TABLE community_notifications
  ADD CONSTRAINT community_notifications_triggered_by_user_id_fkey
  FOREIGN KEY (triggered_by_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. post_report.reporter_id — SET NULL
ALTER TABLE post_report
  DROP CONSTRAINT post_report_reporter_id_fkey;
ALTER TABLE post_report
  ADD CONSTRAINT post_report_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. user_reports.reporter_id — SET NULL
ALTER TABLE user_reports
  DROP CONSTRAINT user_reports_reporter_id_fkey;
ALTER TABLE user_reports
  ADD CONSTRAINT user_reports_reporter_id_fkey
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. user_reports.reported_id — SET NULL
ALTER TABLE user_reports
  DROP CONSTRAINT user_reports_reported_id_fkey;
ALTER TABLE user_reports
  ADD CONSTRAINT user_reports_reported_id_fkey
  FOREIGN KEY (reported_id) REFERENCES users(id) ON DELETE SET NULL;
