-- Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(8) UNIQUE NOT NULL CHECK (username ~ '^[a-zA-Z0-9]{8}$'),
    pronouns TEXT,
    biography TEXT,
    email VARCHAR(100) UNIQUE NOT NULL,
    user_password TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Post Likes table
CREATE TABLE post_likes (
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    post_id INT REFERENCES posts(id) ON DELETE CASCADE,    
    PRIMARY KEY (user_id, post_id)
);

-- Post Comments table
CREATE TABLE post_comments (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
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
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    group_id INT REFERENCES groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, group_id)
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
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
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
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    lesson_id INT REFERENCES lessons(id) ON DELETE CASCADE,
    progress INT CHECK (progress BETWEEN 0 AND 100) DEFAULT 0,
    lesson_completed BOOLEAN DEFAULT FALSE,
    quiz_completed BOOLEAN DEFAULT FALSE,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, lesson_id)
);

-- User Followers table (Tracks followers/following relationships)
CREATE TABLE user_followers (
    follower_id INT REFERENCES users(id) ON DELETE CASCADE,
    following_id INT REFERENCES users(id) ON DELETE CASCADE,
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
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    quiz_id INT REFERENCES quizzes(id) ON DELETE CASCADE,
    progress TEXT CHECK (progress IN ('pass', 'fail')) DEFAULT NULL,
    PRIMARY KEY (user_id, quiz_id)
);
