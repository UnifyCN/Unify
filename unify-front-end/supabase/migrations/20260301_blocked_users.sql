-- Blocked users table for user blocking functionality
CREATE TABLE IF NOT EXISTS blocked_users (
    id SERIAL PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- RLS policies
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own blocks"
    ON blocked_users FOR SELECT
    USING ((select auth.uid()) = blocker_id);

CREATE POLICY "Users can block others"
    ON blocked_users FOR INSERT
    WITH CHECK ((select auth.uid()) = blocker_id);

CREATE POLICY "Users can unblock others"
    ON blocked_users FOR DELETE
    USING ((select auth.uid()) = blocker_id);
