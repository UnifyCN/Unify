import { StyleSheet, Text, View } from 'react-native';
import type { CommunityMessage } from '@/types/matching';

interface CircleMessageBubbleProps {
  message: CommunityMessage;
  isOwn: boolean;
}

export function CircleMessageBubble({
  message,
  isOwn,
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

  return (
    <View
      style={[
        styles.row,
        isOwn ? styles.rowOwn : styles.rowOther,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        {!isOwn && (
          <Text style={styles.senderName}>
            {message.sender?.username || 'Circle member'}
          </Text>
        )}
        <Text
          style={[
            styles.messageText,
            isOwn && styles.messageTextOwn,
          ]}
        >
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
  },
  bubble: {
    maxWidth: '82%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
  },
  bubbleOwn: {
    backgroundColor: '#FF7A18',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    color: '#1F1300',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#fff',
  },
  senderName: {
    color: '#6E6E6E',
    fontSize: 12,
    marginBottom: 4,
  },
  systemRow: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemBubble: {
    backgroundColor: '#FFF4E4',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  systemText: {
    color: '#7C4A00',
    fontSize: 13,
    textAlign: 'center',
  },
});
