import generateRandomUsername from 'generate-random-username';

export const generateUsername = (): string => {
  const maxLength = 15; // Maximum allowed length
  const maxAttempts = 50; // Prevent infinite loops

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const username = generateRandomUsername({
      capitalize: true,
      separator: '',
      digits: 1,
    });

    // Check if username is within our length limit
    if (username.length <= maxLength) {
      return username;
    }
  }

  // Fallback: if we can't generate a short enough username, truncate the last one
  const fallbackUsername = generateRandomUsername({
    capitalize: true,
    separator: '',
    digits: 1,
  });
  return fallbackUsername.substring(0, maxLength);
};
