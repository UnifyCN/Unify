import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import type { CommunityMessage } from '@/types/matching';
import { Avatar } from '@/components/Avatar';

interface CircleMessageBubbleProps {
  message: CommunityMessage;
  isOwn: boolean;
  onPressSender?: (userId: string) => void;
}

export function CircleMessageBubble({
  message,
  isOwn,
  onPressSender,
}: CircleMessageBubbleProps) {
  if (!message.sender_user_id) {
    return (
      <View style={styles.systemRow}>
        <View style={styles.systemBubble}>
          <Text style={styles.systemText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  const handlePressSender = () => {
    if (onPressSender && message.sender_user_id) {
      onPressSender(message.sender_user_id);
    }
  };

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther]}>
      {!isOwn && (
        <TouchableOpacity
          onPress={handlePressSender}
          activeOpacity={0.8}
          style={styles.avatarContainer}
        >
          <Avatar
            profilePictureUrl={message.sender?.profile_picture_url ?? undefined}
            username={message.sender?.username || '?'}
            size={32}
            style={styles.avatar}
            fallbackStyle={styles.avatarFallback}
            textStyle={styles.avatarText}
          />
        </TouchableOpacity>
      )}

      <View
        style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}
      >
        {!isOwn && (
          <TouchableOpacity onPress={handlePressSender}>
            <Text style={styles.senderName}>
              {message.sender?.username || 'Circle member'}
            </Text>
          </TouchableOpacity>
        )}
        <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  rowOther: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 8,
  },
  avatarContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE0CC',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9A3412',
  },
  bubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  bubbleOwn: {
    backgroundColor: '#ff9d40', // Orange theme
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F3F4F6', // Lighter grey
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#1F2937', // Darker text
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextOwn: {
    color: '#fff',
  },
  senderName: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  systemRow: {
    alignItems: 'center',
    marginVertical: 12, // Increased spacing
    paddingHorizontal: 24,
  },
  systemBubble: {
    backgroundColor: '#fff8f3', // Very light orange
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  systemText: {
    color: '#ff820b', // Orange text
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
