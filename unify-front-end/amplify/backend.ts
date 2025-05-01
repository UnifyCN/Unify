import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from './data/resource';

defineBackend({
  auth,
  data,
});

// Configure the API client
export const client = generateClient<Schema>({
  authMode: 'userPool', // Use Cognito User Pool for authentication
});