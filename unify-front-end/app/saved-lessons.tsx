import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import { useSavedLessonPages } from '@/hooks/learn/useSavedLessonPages';
import type { SavedLessonPageRow } from '@/services/learn/lessonPageSaves';
import { useSanityModules } from '@/hooks/sanity/useSanityModules';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import { Theme } from '@/constants/Theme';
import { formatRelativeTime } from '@/helpers/dateHelpers';

const DEFAULT_COLOR = '#F0F0F0';
const DEFAULT_ACCENT = Theme.textInput;

// Same icon map used by LessonHeroCard / PathwayCard
const mapIconName = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    account_balance: 'bank-outline',
    assignment_ind: 'account-tie-outline',
    cottage: 'home-outline',
    article: 'file-document-outline',
    passport: 'passport',
    school: 'school-outline',
    book: 'book-outline',
    work: 'briefcase-outline',
    computer: 'laptop-outline',
    business: 'office-building-outline',
    science: 'flask-outline',
    language: 'translate',
    history: 'clock-time-four-outline',
    psychology: 'brain',
    menu_book: 'book-open-page-variant',
    auto_stories: 'book-open-outline',
    calculate: 'calculator',
    palette: 'palette-outline',
    music_note: 'music-note-outline',
    sports_esports: 'gamepad-variant-outline',
  };
  return iconMap[iconName] || 'book-outline';
};

interface SavedLessonCardProps {
  item: SavedLessonPageRow;
  accentColor: string;
  iconName: string;
  moduleTitle: string;
  onPress: () => void;
}

const SavedLessonCard = React.memo(function SavedLessonCard({
  item,
  accentColor,
  iconName,
  moduleTitle,
  onPress,
}: SavedLessonCardProps) {
  const pageTitle =
    item.pageTitleSnapshot?.trim() || `Page ${item.pageNumber}`;
  const lessonTitle = item.lessonTitleSnapshot?.trim() || 'Lesson';
  const timeAgo = formatRelativeTime(item.createdAt);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${pageTitle} from ${lessonTitle}`}
    >
      {/* Colored accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.cardContent}>
        {/* Icon */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: accentColor + '18' },
          ]}
        >
          <MaterialCommunityIcons
            name={iconName as any}
            size={22}
            color={accentColor}
          />
        </View>

        {/* Text content */}
        <View style={styles.textContent}>
          <Text style={styles.moduleLabel} numberOfLines={1}>
            {moduleTitle}
          </Text>
          <Text style={styles.pageTitle} numberOfLines={2}>
            {pageTitle}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.lessonTitle} numberOfLines={1}>
              {lessonTitle}
            </Text>
            <Text style={styles.dotSeparator}>·</Text>
            <Text style={styles.timeAgo}>{timeAgo}</Text>
          </View>
        </View>

        {/* Chevron */}
        <Feather
          name="chevron-right"
          size={18}
          color={Theme.textInactiveTab}
          style={styles.chevron}
        />
      </View>
    </Pressable>
  );
});

export default function SavedLessonsPage() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } =
    useSavedLessonPages();
  const { data: modules } = useSanityModules();

  // Build a lookup from moduleId → { color, icon, title }
  const moduleMap = useMemo(() => {
    const map: Record<
      string,
      { color: string; icon: string; title: string }
    > = {};
    if (modules) {
      for (const m of modules) {
        map[m._id] = {
          color: m.colorTheme?.hex || DEFAULT_ACCENT,
          icon: m.icon || 'book',
          title: m.title,
        };
      }
    }
    return map;
  }, [modules]);

  const openLessonPage = useCallback(
    (item: SavedLessonPageRow) => {
      router.push({
        pathname:
          '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
        params: {
          moduleId: item.moduleId,
          submoduleId: item.submoduleId,
          lessonId: item.lessonId,
          pageNum: String(item.pageNumber),
        },
      });
    },
    [router]
  );

  const renderItem = useCallback(
    ({ item }: { item: SavedLessonPageRow }) => {
      const mod = moduleMap[item.moduleId];
      const accentColor = mod?.color || DEFAULT_ACCENT;
      const iconName = mapIconName(mod?.icon || 'book');
      const moduleTitle = mod?.title || 'Lesson';

      return (
        <SavedLessonCard
          item={item}
          accentColor={accentColor}
          iconName={iconName}
          moduleTitle={moduleTitle}
          onPress={() => openLessonPage(item)}
        />
      );
    },
    [moduleMap, openLessonPage]
  );

  const keyExtractor = useCallback((item: SavedLessonPageRow) => item.id, []);

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <BackHeader title="Saved Lessons" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Theme.black} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <BackHeader title="Saved Lessons" />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load saved lessons.</Text>
        </View>
      </View>
    );
  }

  const list = data ?? [];

  return (
    <View style={styles.container}>
      <BackHeader title="Saved Lessons" />
      {list.length > 0 && (
        <Text style={styles.countLabel}>
          {list.length} saved {list.length === 1 ? 'lesson' : 'lessons'}
        </Text>
      )}
      <FlatList
        data={list}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={
          list.length === 0 ? styles.emptyListContent : styles.listContent
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
          />
        }
        ListEmptyComponent={
          <EmptyFeedMessage
            icon={<UnifyReplyIcon width={27} height={25} />}
            message="No saved lesson pages yet"
            submessage={
              <Text style={styles.emptyMessageSubtext}>
                Tap the bookmark on a lesson page to save it here
              </Text>
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  countLabel: {
    fontSize: 13,
    color: Theme.textInput,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 15,
    color: Theme.textInput,
    textAlign: 'center',
  },

  // Card
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    overflow: 'hidden',
  },
  cardPressed: {
    backgroundColor: '#F8F8F8',
  },
  accentBar: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 12,
    paddingRight: 14,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
  },
  moduleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.textInput,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  pageTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.black,
    lineHeight: 20,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 13,
    color: Theme.textInput,
    flexShrink: 1,
  },
  dotSeparator: {
    fontSize: 13,
    color: Theme.textInactiveTab,
    marginHorizontal: 5,
  },
  timeAgo: {
    fontSize: 13,
    color: Theme.textInactiveTab,
  },
  chevron: {
    marginLeft: 4,
  },

  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
