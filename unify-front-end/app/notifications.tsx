import { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCommunityNotifications } from '@/hooks/useCommunityNotifications';
import type { CommunityNotification } from '@/types/matching';
import BackHeader from '@/components/BackHeader';
import { Theme } from '@/constants/Theme';

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getNotificationIcon(type: CommunityNotification['type']): string {
  switch (type) {
    case 'circle_matched':
      return 'users';
    case 'circle_ending_soon':
      return 'clock';
    case 'circle_ended':
      return 'check-circle';
    default:
      return 'bell';
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const {
    notifications,
    isLoading,
    markAsRead,
    markAllAsRead,
    unreadCount,
    isMarkingAllAsRead,
  } = useCommunityNotifications();

  const handleNotificationPress = useCallback(
    (notification: CommunityNotification) => {
      // Mark as read
      if (!notification.read_at) {
        markAsRead(notification.id);
      }

      // Navigate to circle if circle_id exists
      if (notification.data?.circle_id) {
        router.push(
          `/community-matching/circle/${notification.data.circle_id}` as Href
        );
      }
    },
    [markAsRead, router]
  );

  const renderNotification = ({ item }: { item: CommunityNotification }) => {
    const isUnread = !item.read_at;
    const iconName = getNotificationIcon(item.type);

    return (
      <TouchableOpacity
        style={[styles.notificationItem, isUnread && styles.notificationUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconContainer, isUnread && styles.iconContainerUnread]}>
          <Feather name={iconName as any} size={22} color={isUnread ? Theme.primaryGatherRed : '#6E6E6E'} />
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isUnread && styles.titleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.timestamp}>{formatRelativeTime(item.created_at)}</Text>
          </View>
          <Text style={[styles.body, isUnread && styles.bodyUnread]} numberOfLines={2}>
            {item.body}
          </Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyState}>
        <View style={styles.emptyIconCircle}>
          <Feather name="bell-off" size={40} color="#D0D0D0" />
        </View>
        <Text style={styles.emptyTitle}>No Notifications Yet</Text>
        <Text style={styles.emptyBody}>
          You'll be notified when you're matched to a circle or when important updates happen.
        </Text>
      </View>
    </View>
  );

  const MarkAllButton = () => (
    unreadCount > 0 ? (
      <TouchableOpacity
        onPress={markAllAsRead}
        disabled={isMarkingAllAsRead}
        style={styles.markAllButton}
      >
        {isMarkingAllAsRead ? (
          <ActivityIndicator size="small" color={Theme.primaryGatherRed} />
        ) : (
          <Text style={styles.markAllText}>Mark all read</Text>
        )}
      </TouchableOpacity>
    ) : null
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.primaryGatherRed} />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <BackHeader 
        title="" 
        onBack={() => router.back()} 
        rightButton={<MarkAllButton />}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  markAllButton: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  markAllText: {
    color: Theme.primaryGatherRed,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#fff',
  },
  notificationUnread: {
    backgroundColor: '#FFF9F5',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconContainerUnread: {
    backgroundColor: '#FFF0E6',
  },
  content: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F1300',
    marginRight: 8,
  },
  titleUnread: {
    fontWeight: '700',
  },
  body: {
    fontSize: 14,
    color: '#6E6E6E',
    lineHeight: 20,
  },
  bodyUnread: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 12,
    color: '#9E9E9E',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.primaryGatherRed,
    marginLeft: 8,
    alignSelf: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginLeft: 72,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F1300',
  },
  emptyBody: {
    fontSize: 15,
    color: '#6E6E6E',
    textAlign: 'center',
    lineHeight: 22,
  },
});
