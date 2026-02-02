import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getProfilePictureUrl } from '@/services/s3/uploadProfilePicture';

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
  const shouldSignUrl =
    !!profilePictureUrl && !profilePictureUrl.startsWith('http');
  const { data: signedProfileUrl } = useQuery({
    queryKey: ['profilePictureSignedUrl', profilePictureUrl],
    enabled: shouldSignUrl,
    queryFn: () => getProfilePictureUrl(profilePictureUrl as string),
    staleTime: 4 * 60 * 1000,
  });
  const effectiveProfileUrl = shouldSignUrl
    ? signedProfileUrl
    : profilePictureUrl;

  const avatarStyle = [
    styles.avatar,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
    },
    style,
  ];

  if (effectiveProfileUrl) {
    return (
      <Image
        source={{ uri: effectiveProfileUrl }}
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
