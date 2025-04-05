import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  PostTag: a.model({
    tagId: a.id().required(),
    postId: a.id().required(),
    tag: a.belongsTo('Tag', 'tagId'), // Foreign key reference to Tag model
    post: a.belongsTo('Post', 'postId'), // Foreign key reference to Post model
    createdAt: a.datetime(),
  }),

  PostLike: a.model({
    id: a.id(), // Primary Key
    userId: a.id().required(), 
    postId: a.id().required(), 
    user: a.belongsTo('User', 'userId'), 
    post: a.belongsTo('Post', 'postId'), 
    createdAt: a.datetime(), 
  }),

  PostComment: a.model({
    id: a.id(), // Primary Key
    userId: a.id(), 
    postId: a.id(), 
    content: a.string(), 
    parentCommentId: a.id(), // id for nested replies
    user: a.belongsTo('User', 'userId'), 
    post: a.belongsTo('Post', 'postId'), 
    parentComment: a.belongsTo('PostComment', 'parentCommentId'), // Self-referencing relationship for nested replies
    replies: a.hasMany('PostComment', 'parentCommentId'), // Inverse relationship for nested replies
    createdAt: a.datetime(), 
  }),

  Post: a.model({
    id: a.id(), // Primary Key
    userId: a.id(),
    user: a.belongsTo('User', 'userId'), 
    content: a.string(),
    mediaUrl: a.string(), // Store in S3
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    likes: a.hasMany('PostLike', 'postId'),
    comments: a.hasMany('PostComment', 'postId'), // Inverse relationship for PostComment.post
    tags: a.hasMany('PostTag', 'postId'), // Many-to-many relationship with Tag through PostTag
  }),

  User: a.model({ 
    id: a.id(), // Primary Key
    username: a.string().required(),
    pronouns: a.string(),
    biography: a.string(),
    email: a.string().required(),
    password: a.string().required(),
    profilePicture: a.string(), // Store in S3
    post: a.hasMany('Post', 'userId'), // Inverse relationship for Post.user
    likes: a.hasMany('PostLike', 'userId'), // Inverser relationship for PostLike.user
    comments: a.hasMany('PostComment', 'userId'), // Inverse relationship for PostComment.user
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    memberships: a.hasMany('GroupMember', 'userId'), // Relationship to GroupMember
    followers: a.hasMany('UserFollower', 'followingId'), // Users who follow this user
    following: a.hasMany('UserFollower', 'followerId'), // Users this user is following
    progress: a.hasMany('Progress', 'userId'), // Relationship to Progress
  }),

  // Tags used for posts or lessons
  Tag: a.model({
    id: a.id(),
    name: a.string().required(),
    posts: a.hasMany('PostTag', 'tagId'), // Many-to-many relationship with Post through PostTag
  }),

  Group: a.model({
    id: a.id(), // Primary Key
    name: a.string(), 
    description: a.string(), 
    createdAt: a.datetime(), 
    members: a.hasMany('GroupMember', 'groupId'), // Relationship to GroupMember
  }),

  GroupMember: a.model({
    id: a.id(), // Primary Key
    userId: a.id(), 
    groupId: a.id(), 
    user: a.belongsTo('User', 'userId'), // Relationship to User
    group: a.belongsTo('Group', 'groupId'), // Relationship to Group
    joinedAt: a.datetime(), 
  }),

  UserFollower: a.model({
    id: a.id(), // Primary Key
    followerId: a.id(), // ID of the follower (User who follows)
    followingId: a.id(), // ID of the user being followed
    follower: a.belongsTo('User', 'followerId'), // Relationship to the follower User
    following: a.belongsTo('User', 'followingId'), // Relationship to the followed User
    createdAt: a.datetime(),
  }),

  MainTopic: a.model({
    id: a.id(), // Primary Key
    title: a.string(), 
    description: a.string(), 
    createdAt: a.datetime(), 
    subTopics: a.hasMany('SubTopic', 'mainTopicId'), // Relationship to SubTopic
    progress: a.hasMany('Progress', 'mainTopicId'), // Relationship to Progress
  }),

  SubTopic: a.model({
    id: a.id(), // Primary Key
    mainTopicId: a.id(), // Foreign Key referencing MainTopic
    title: a.string(),
    description: a.string(), 
    progressDisplay: a.integer(), // Counted as in percentage, front end display only
    progress: a.hasMany('Progress', 'subTopicId'), // Relationship to Progress
    createdAt: a.datetime(), 
    lessons: a.hasMany('Lesson', 'subTopicId'), // Relationship to Lesson
    mainTopic: a.belongsTo('MainTopic', 'mainTopicId'), // Foreign key reference to MainTopic model
}),

  Lesson: a.model({
    id: a.id(), // Primary Key
    subTopicId: a.id(), // Foreign Key referencing SubTopic
    title: a.string(), 
    description: a.string(), 
    videoUrl: a.string(), // URL for the lesson video (stored in S3)
    content: a.json(), // JSON content for the lesson (supports multiple formats)
    createdAt: a.datetime(), 
    quizzes: a.hasMany('Quiz', 'lessonId'), // Relationship to Quiz
    subtopic: a.belongsTo('SubTopic', 'subTopicId'), // Foreign key reference to SubTopic model
    Progress: a.hasMany('Progress', 'lessonId'), // Relationship to Progress
  }),

  Quiz: a.model({
    id: a.id(), // Primary Key
    lessonId: a.id(), 
    lesson: a.belongsTo('Lesson', 'lessonId'), // Foreign key reference to Lesson model
    title: a.string(), 
    questions: a.json(), // JSON format for questions (supports multiple-choice, open-ended, etc.)
    progress: a.string(), // Status of the quiz ("pass", "fail", or null)
    createdAt: a.datetime(), 
  }),

  // Quiz progress is tracked in quiz model, when all quizes that belongs to a lesson are passed, the lesson is considered passed
  // There are multiple lessons for every sub topic, tracked in subtopic model
  // Create a new progress model for every sub topic, main topic
  // Each user can have multple progress models. e.g: user1 can have progress for main topic 1, sub topic 1, lesson 1, lesson 2, etc.
  
  Progress: a.model({
    id: a.id(), // Primary Key
    userId: a.id(), // Foreign Key referencing User
    user: a.belongsTo('User', 'userId'), // Foreign key reference to User model
    mainTopicId: a.id(), // Foreign Key referencing MainTopic (optional)
    mainTopic: a.belongsTo('MainTopic', 'mainTopicId'), // Foreign key reference to MainTopic model
    subTopicId: a.id(), // Foreign Key referencing SubTopic (optional)
    subTopic: a.belongsTo('SubTopic', 'subTopicId'), // Foreign key reference to SubTopic model
    lessonId: a.id(), // Foreign Key referencing Lesson (optional)
    lesson: a.belongsTo('Lesson', 'lessonId'), // Foreign key reference to Lesson model
    progress: a.integer(), // Progress percentage (0-100)
    completed: a.boolean(), // Whether the item is completed
    lastAccessedAt: a.datetime(), 
    createdAt: a.datetime(), 
    updatedAt: a.datetime(), 
}),
}).authorization((allow) => [allow.authenticated()]); // Allow authenticated users to access the data

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});