import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Image } from 'expo-image';
import { useResolvedAvatarUrl } from '@/hooks/useResolvedAvatarUrl';

interface AvatarProps {
  profilePictureUrl?: string;
  username: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  showFallbackWhileLoading?: boolean;
}

export const Avatar = ({
  profilePictureUrl,
  username,
  size = 40,
  style,
  fallbackStyle,
  textStyle,
  showFallbackWhileLoading = false,
}: AvatarProps) => {
  const [imageFailed, setImageFailed] = useState(false);
  const { resolvedAvatarUrl, hasAvatarSource, isLoading, isError } =
    useResolvedAvatarUrl(profilePictureUrl);

  useEffect(() => {
    setImageFailed(false);
  }, [resolvedAvatarUrl]);

  const avatarStyle = useMemo(
    () => [
      styles.avatar,
      {
        width: size,
        height: size,
        borderRadius: size / 2,
      },
      style,
    ],
    [size, style]
  );

  if (resolvedAvatarUrl && !imageFailed) {
    return (
      <Image
        source={resolvedAvatarUrl}
        style={avatarStyle as any}
        contentFit='cover'
        cachePolicy='memory-disk'
        transition={120}
        onError={() => setImageFailed(true)}
      />
    );
  }

  const shouldShowFallback =
    !hasAvatarSource ||
    imageFailed ||
    isError ||
    (!isLoading && !resolvedAvatarUrl) ||
    (showFallbackWhileLoading && isLoading);

  if (!shouldShowFallback) {
    return <View style={avatarStyle} />;
  }

  return (
    <View style={[avatarStyle, fallbackStyle]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }, textStyle]}>
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
