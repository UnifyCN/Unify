import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import BackHeader from '@/components/BackHeader';
import { useSavedLessonPages } from '@/hooks/learn/useSavedLessonPages';
import type { SavedLessonPageRow } from '@/services/learn/lessonPageSaves';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import { Theme } from '@/constants/Theme';

export default function SavedLessonsPage() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } =
    useSavedLessonPages();

  const openLessonPage = (item: SavedLessonPageRow) => {
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
  };

  const renderItem = ({ item }: { item: SavedLessonPageRow }) => {
    const title =
      item.pageTitleSnapshot?.trim() ||
      `Page ${item.pageNumber}`;
    const subtitle = item.lessonTitleSnapshot?.trim() || 'Lesson';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => openLessonPage(item)}
        activeOpacity={0.7}
      >
        <Text style={styles.rowTitle} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.rowSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading && !data) {
    return (
      <View style={styles.container}>
        <BackHeader title='Saved Lessons' />
        <View style={styles.centered}>
          <ActivityIndicator size='large' color={Theme.black} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <BackHeader title='Saved Lessons' />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load saved lessons.</Text>
        </View>
      </View>
    );
  }

  const list = data ?? [];

  return (
    <View style={styles.container}>
      <BackHeader title='Saved Lessons' />
      <FlatList
        data={list}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          list.length === 0 ? styles.emptyListContent : styles.listContent
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        }
        ListEmptyComponent={
          <EmptyFeedMessage
            icon={<UnifyReplyIcon width={27} height={25} />}
            message='No saved lesson pages yet'
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
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
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
  row: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 14,
    color: Theme.textInput,
    lineHeight: 20,
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
