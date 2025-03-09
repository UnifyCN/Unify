-- Insert users
INSERT INTO users (username, pronouns, biography, email, user_password)
VALUES ('paulph1m', 'he/him', 'testing lol', 'test@12345.com', 'password');

-- Insert posts
INSERT INTO posts (user_id, content)
VALUES (1, 'Excited to share my new project on dino tracking!');

-- Insert post likes
INSERT INTO post_likes (user_id, post_id)
VALUES (1, 1);

-- Insert post comments
INSERT INTO post_comments (user_id, post_id, content)
VALUES (1, 1, 'This looks awesome! Can’t wait to see more.');

-- Insert tags
INSERT INTO tags (tag_name)
VALUES ('Finance'), ('Employment');

-- Insert post tags
INSERT INTO post_tags (post_id, tag_id)
VALUES (1, 1);

-- Insert groups
INSERT INTO groups (group_name, groups_description)
VALUES ('Tests', 'A community for Unify.');

-- Insert group members
INSERT INTO group_members (user_id, group_id)
VALUES (1, 1);

-- Insert main topics
INSERT INTO main_topics (title, main_topic_description)
VALUES ('Pathway to Finance', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sapien curabitur nec praesent, vel quis.');

-- Insert main topic tags
INSERT INTO main_topic_tags (main_topic_id, tag_id)
VALUES (1, 1);

-- Insert sub topics
INSERT INTO sub_topics (main_topic_id, title, sub_topic_description)
VALUES (1, 'Budgeting 101', 'Lorem ipsum odor amet, consectetuer adipiscing elit. Sapien curabitur nec praesent, vel quis.');

-- Insert sub topic progress
INSERT INTO sub_topic_progress (user_id, sub_topic_id, progress)
VALUES (1, 1, 2); -- progress here is out of 3?

-- Insert lessons
INSERT INTO lessons (sub_topic_id, title, lesson_description, content)
VALUES (1, 'What is Budgeting', 'orem ipsum odor amet, consectetuer adipiscing elit. Sapien curabitur nec praesent, vel quis.', '{"text": "test."}');

-- Insert lesson progress
INSERT INTO lesson_progress (user_id, lesson_id, progress, lesson_completed, quiz_completed)
VALUES (1, 1, 80, FALSE, FALSE);

-- Insert user followers
INSERT INTO user_followers (follower_id, following_id)
VALUES (1, 2);

-- Insert quizzes
INSERT INTO quizzes (lesson_id, title, questions)
VALUES (1, 'Basic  Quiz', '{"q1": "What is test?", "q2": "Name one test."}');

-- Insert quiz progress
INSERT INTO quiz_progress (user_id, quiz_id, progress)
VALUES (1, 1, 'pass');
