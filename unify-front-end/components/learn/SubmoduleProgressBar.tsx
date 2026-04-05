import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';

const BOOKMARK_ICON_SIZE = 22;

interface SubmoduleProgressBarProps {
  currentProgress: number;
  totalPages: number;
  submoduleTitle: string;
  submoduleOrder: number;
  onClose: () => void;
  /** Lesson content pages only: bookmark control (same row as close). */
  onBookmarkPress?: () => void;
  isBookmarked?: boolean;
  bookmarkLoading?: boolean;
}

export default function SubmoduleProgressBar({
  currentProgress,
  totalPages,
  submoduleTitle,
  submoduleOrder,
  onClose,
  onBookmarkPress,
  isBookmarked = false,
  bookmarkLoading = false,
}: SubmoduleProgressBarProps) {
  const progressPercentage =
    totalPages > 0 ? (currentProgress / totalPages) * 100 : 0;

  const showBookmark = typeof onBookmarkPress === 'function';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerSide}
          accessibilityRole='button'
          accessibilityLabel='Close lesson'
        >
          <Feather name='x' size={20} color='#878787' />
        </TouchableOpacity>

        <Text style={styles.title} numberOfLines={2}>
          Section {submoduleOrder}: {submoduleTitle}
        </Text>

        <View style={styles.headerSide}>
          {showBookmark ? (
            <TouchableOpacity
              onPress={onBookmarkPress}
              disabled={bookmarkLoading}
              style={styles.bookmarkButton}
              accessibilityRole='button'
              accessibilityLabel={
                isBookmarked ? 'Remove saved lesson page' : 'Save lesson page'
              }
            >
              {bookmarkLoading ? (
                <ActivityIndicator size='small' color='#878787' />
              ) : isBookmarked ? (
                <Save_Fill
                  width={BOOKMARK_ICON_SIZE}
                  height={BOOKMARK_ICON_SIZE}
                />
              ) : (
                <Save width={BOOKMARK_ICON_SIZE} height={BOOKMARK_ICON_SIZE} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={['#797977', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: `${Math.min(progressPercentage, 100)}%` },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const SIDE_WIDTH = 44;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingTop: 30,
    marginBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: '2%',
  },
  headerSide: {
    width: SIDE_WIDTH,
    minHeight: SIDE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkButton: {
    padding: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#343434',
    textAlign: 'center',
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#EEEEEE',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
});
