import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
    })
    .authorization((allow) => [allow.guest()]),
  
  Users: a 
    .model({
      username: a.string().required(),
      pronouns: a.string(),
      biography: a.string(),
      email: a.string().required(),
      password: a.string(),
      profilePicture: a.string(), // Store in S3
      // posts: a.hasMany(() => a.ref('Post'), 'userID'),
      // groups: a.hasMany(() => a.ref('GroupMember'), 'userID'),
      // followers: a.hasMany(() => a.ref('UserFollower'), 'followerID'),
      // following: a.hasMany(() => a.ref('UserFollower'), 'followingID'),
      // lessonProgress: a.hasMany(() => a.ref('LessonProgress'), 'userID'),
    })
    .identifier(['username']) //Primary key is user name
    .authorization((allow) => [allow.guest()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'iam',
  },
});

