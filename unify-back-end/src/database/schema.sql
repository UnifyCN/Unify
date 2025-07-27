-- Users table
CREATE TABLE users (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    username VARCHAR(8) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9]{8}$'),
    pronouns TEXT,
    biography TEXT,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Likes table
CREATE TABLE post_likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,    
    PRIMARY KEY (user_id, post_id)
);

-- Post Saves table
CREATE TABLE post_saves (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, post_id)
);

-- Post Comments table
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_comment_id INT REFERENCES post_comments(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags table
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    tag_name VARCHAR(100) UNIQUE NOT NULL
);

-- Post Tags table (Many-to-Many relationship between posts and tags)
CREATE TABLE post_tags (
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Groups table
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    group_name VARCHAR(100) UNIQUE NOT NULL,
    groups_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group Members table (Many-to-Many relationship between users and groups)
CREATE TABLE group_members (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
);

-- Chatbot usage table, to track how many messages in the past day and rate limit (will only be upserting)
CREATE TABLE chatbot_usage (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- might need to add 'premium BOOLEAN' in the future to account for multiple limits but for now assume all have a limit
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMP DEFAULT NOW() -- Will be UTC times, so usage resets based on UTC midnight
);

-- Main Topics table
CREATE TABLE main_topics (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    main_topic_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Main topics tags
CREATE TABLE main_topic_tags (
    main_topic_id INT REFERENCES main_topics(id) ON DELETE CASCADE,
    tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (main_topic_id, tag_id)
);

-- Sub Topics table
CREATE TABLE sub_topics (
    id SERIAL PRIMARY KEY,
    main_topic_id INT REFERENCES main_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sub_topic_description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sub topics progress table
CREATE TABLE sub_topic_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sub_topic_id INT REFERENCES sub_topics(id) ON DELETE CASCADE,
    progress INT CHECK (progress BETWEEN 0 AND 3) DEFAULT 0,
    sub_topic_completed BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, sub_topic_id)
);

-- Lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    sub_topic_id INT REFERENCES sub_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    lesson_description TEXT,
    content JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lesson Progress table
CREATE TABLE lesson_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    progress INT CHECK (progress BETWEEN 0 AND 100) DEFAULT 0,
    lesson_completed BOOLEAN DEFAULT FALSE,
    quiz_completed BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id)
);

-- User Followers table (Tracks followers/following relationships)
CREATE TABLE user_followers (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

-- Quiz table
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz progress table
CREATE TABLE quiz_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    progress TEXT CHECK (progress IN ('pass', 'fail')) DEFAULT NULL,
    PRIMARY KEY (user_id, quiz_id)
);

-- ============================================
-- FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, username, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    substr(md5(random()::text), 1, 8), -- PLACEHOLDER: Generate a random 8-character username
    NEW.created_at,
    NEW.updated_at
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.update_post_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment like count when a like is added
    UPDATE posts 
    SET like_count = like_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement like count when a like is removed
    UPDATE posts 
    SET like_count = like_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();