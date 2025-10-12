-- Users table
CREATE TABLE users (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9]{1,20}$'),
    pronouns TEXT,
    biography TEXT,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    PRIMARY KEY (id)
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    like_count INTEGER DEFAULT 0
);

-- Comment Likes table
CREATE TABLE comment_likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    comment_id INT REFERENCES post_comments(id) ON DELETE CASCADE,    
    PRIMARY KEY (user_id, comment_id)
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
    group_description TEXT,
    member_count INTEGER DEFAULT 0,
    cover_photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
);

-- Group Members table (Many-to-Many relationship between users and groups)
CREATE TABLE group_members (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    PRIMARY KEY (user_id, group_id)
);

-- Chatbot usage table, to track how many messages in the past day and rate limit (will only be upserting)
CREATE TABLE chatbot_usage (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    -- might need to add 'premium BOOLEAN' in the future to account for multiple limits but for now assume all have a limit
    message_count INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZZ DEFAULT NOW() -- Will be UTC times, so usage resets based on UTC midnight
);

-- Main Topics table
CREATE TABLE main_topics (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    main_topic_description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
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
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
);

-- Sub topics progress table
CREATE TABLE sub_topic_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sub_topic_id INT REFERENCES sub_topics(id) ON DELETE CASCADE,
    progress INT CHECK (progress BETWEEN 0 AND 3) DEFAULT 0,
    sub_topic_completed BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    PRIMARY KEY (user_id, sub_topic_id)
);

-- Lessons table
CREATE TABLE lessons (
    id SERIAL PRIMARY KEY,
    sub_topic_id INT REFERENCES sub_topics(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    lesson_description TEXT,
    content JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
);

-- Lesson Progress table
CREATE TABLE lesson_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    progress INT CHECK (progress BETWEEN 0 AND 100) DEFAULT 0,
    lesson_completed BOOLEAN DEFAULT FALSE,
    quiz_completed BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    PRIMARY KEY (user_id, lesson_id)
);

-- User Followers table (Tracks followers/following relationships)
CREATE TABLE user_followers (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    PRIMARY KEY (follower_id, following_id)
);

-- Quiz table
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    questions JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
);

-- Quiz progress table
CREATE TABLE quiz_progress (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    progress TEXT CHECK (progress IN ('pass', 'fail')) DEFAULT NULL,
    PRIMARY KEY (user_id, quiz_id)
);

CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    event_datetime TIMESTAMPTZ NOT NULL, -- This includes both date and time
    event_end_datetime TIMESTAMPTZ,
    location TEXT NOT NULL,
    address TEXT NOT NULL,
    event_type TEXT CHECK (event_type IN ('in-person', 'online', 'hybrid')) NOT NULL,
    cover_photo_url TEXT,
    external_link TEXT,
    max_attendees INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMPTZ
);


-- ============================================
-- FUNCTIONS
-- ============================================

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

CREATE OR REPLACE FUNCTION public.update_comment_like_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
  -- Increment like count when a like is removed
    UPDATE post_comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
  -- Decrement like count when a like is removed
    UPDATE post_comments
    SET like_count = like_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment member count when someone joins a group
    UPDATE groups 
    SET member_count = member_count + 1 
    WHERE id = NEW.group_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement member count when someone leaves a group
    UPDATE groups 
    SET member_count = member_count - 1 
    WHERE id = OLD.group_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER on_post_like_change
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_post_like_count();

CREATE TRIGGER on_group_member_change
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

CREATE TRIGGER on_comment_like_change
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_comment_like_count();