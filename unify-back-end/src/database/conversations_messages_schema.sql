-- ============================================
-- CONVERSATIONS AND MESSAGES TABLES
-- ============================================

-- Conversations table - stores conversation metadata
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    conversation_identifier UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT, -- Optional title, can be auto-generated from first message or user-provided
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table - stores individual messages within conversations
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    conversation_id INT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB, -- Optional: stores source documents from RAG (array of {document_id, document_title, url})
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Index for fetching conversations by user (ordered by most recent)
CREATE INDEX idx_conversations_user_id_updated_at ON conversations(user_id, updated_at DESC);

-- Index for looking up conversations by identifier (for URL queries)
CREATE INDEX idx_conversations_identifier ON conversations(conversation_identifier);

-- Index for fetching messages by conversation (ordered by created_at)
CREATE INDEX idx_messages_conversation_id_created_at ON messages(conversation_id, created_at ASC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update conversation's updated_at timestamp when a message is added
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger AS $$
BEGIN
    UPDATE conversations 
    SET updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to update conversation timestamp when a message is added
CREATE TRIGGER on_message_insert_update_conversation
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_timestamp();

-- ============================================
-- MIGRATION: Fix DEFAULT for existing tables
-- ============================================
-- If the table already exists with the old DEFAULT, run this:
-- ALTER TABLE messages ALTER COLUMN created_at SET DEFAULT NOW();
