import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  profilePictureUrl?: string;
  username: string;
  size?: number;
  style?: any;
}

export const Avatar = ({
  profilePictureUrl,
  username,
  size = 40,
  style,
}: AvatarProps) => {
  const avatarStyle = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  if (profilePictureUrl) {
    return (
      <Image
        source={{ uri: profilePictureUrl }}
        style={avatarStyle}
        resizeMode='cover'
      />
    );
  }

  return (
    <View style={avatarStyle}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
        {username.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  avatarText: {
    fontWeight: 'bold',
    color: '#666',
  },
});
