-- Push notification tokens table
-- Stores Expo push tokens for each user to enable push notifications

CREATE TABLE IF NOT EXISTS public.push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Users can insert their own tokens
CREATE POLICY push_tokens_insert_own ON public.push_tokens
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own tokens
CREATE POLICY push_tokens_select_own ON public.push_tokens
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY push_tokens_update_own ON public.push_tokens
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY push_tokens_delete_own ON public.push_tokens
    FOR DELETE USING (auth.uid() = user_id);
