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

  User: a.model({ // Ensure the model name is singular
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
    // lessonProgress: a.hasMany(() => a.ref('LessonProgress'), 'userID'),
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

}).authorization((allow) => [allow.guest()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});