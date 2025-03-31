import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  PostLike: a.model({
    id: a.id(), // Primary Key
    userId: a.id().required(), 
    postId: a.id().required(), 
    user: a.belongsTo('User', 'userId'), 
    post: a.belongsTo('Post', 'postId'), 
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
    // comments: a.hasMany(() => a.ref('PostComment'), 'postID'),
    // tags: a.manyToMany(() => a.ref('Tag'), () => a.ref('PostTag')),
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
    likes: a.hasMany('PostLike', 'userId'), // Corrected reference to userId
    createdAt: a.datetime(),
    updatedAt: a.datetime(),
    // groups: a.hasMany(() => a.ref('GroupMember'), 'userID'),
    // followers: a.hasMany(() => a.ref('UserFollower'), 'followerID'),
    // following: a.hasMany(() => a.ref('UserFollower'), 'followingID'),
    // lessonProgress: a.hasMany(() => a.ref('LessonProgress'), 'userID'),
  }),
}).authorization((allow) => [allow.guest()]);

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});