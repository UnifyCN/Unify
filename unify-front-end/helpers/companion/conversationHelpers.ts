import { Conversation } from '@/services/companion/getConversations';

export interface GroupedConversations {
  yesterday: Conversation[];
  last7Days: Conversation[];
  last30Days: Conversation[];
  older: Conversation[];
}

export interface ConversationSection {
  title: string;
  data: Conversation[];
  key: string;
}

/**
 * Filters conversations by search query (searches in title)
 */
export const filterConversations = (
  conversations: Conversation[] | undefined,
  searchQuery: string
): Conversation[] => {
  if (!conversations) return [];
  if (!searchQuery.trim()) return conversations;

  const query = searchQuery.toLowerCase();
  return conversations.filter(conv =>
    (conv.title || 'New Conversation').toLowerCase().includes(query)
  );
};

/**
 * Groups conversations by date ranges: Yesterday, Previous 7 Days, Previous 30 Days
 */
export const groupConversationsByDate = (
  conversations: Conversation[]
): GroupedConversations => {
  if (!conversations || conversations.length === 0) {
    return {
      yesterday: [],
      last7Days: [],
      last30Days: [],
      older: [],
    };
  }

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);
  last7Days.setHours(0, 0, 0, 0);

  const last30Days = new Date(now);
  last30Days.setDate(last30Days.getDate() - 30);
  last30Days.setHours(0, 0, 0, 0);

  const grouped: GroupedConversations = {
    yesterday: [],
    last7Days: [],
    last30Days: [],
    older: [],
  };

  conversations.forEach(conv => {
    const updatedAt = new Date(conv.updated_at);

    if (updatedAt >= yesterday) {
      grouped.yesterday.push(conv);
    } else if (updatedAt >= last7Days) {
      grouped.last7Days.push(conv);
    } else if (updatedAt >= last30Days) {
      grouped.last30Days.push(conv);
    } else {
      grouped.older.push(conv);
    }
  });

  return grouped;
};

/**
 * Converts grouped conversations into sections for FlatList rendering
 * Only includes sections that have conversations
 */
export const createConversationSections = (
  grouped: GroupedConversations
): ConversationSection[] => {
  return [
    {
      title: 'Yesterday',
      data: grouped.yesterday,
      key: 'yesterday',
    },
    {
      title: 'Previous 7 Days',
      data: grouped.last7Days,
      key: 'last7Days',
    },
    {
      title: 'Previous 30 Days',
      data: grouped.last30Days,
      key: 'last30Days',
    },
    {
      title: 'Older',
      data: grouped.older,
      key: 'older',
    },
  ].filter(section => section.data.length > 0);
};
