import {
  uniqueUsernameGenerator,
  Config,
  adjectives,
  nouns,
} from 'unique-username-generator';

// Configuration for Reddit-style usernames: adjective + noun + number
const usernameConfig: Config = {
  dictionaries: [adjectives, nouns],
  separator: '', // No separator between words
  style: 'pascalCase', // Capitalize first letter of each word
  randomDigits: 1,
  length: 16, // Max length
};

export const generateUsername = (): string => {
  return uniqueUsernameGenerator(usernameConfig);
};
