import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { Message } from '@/helpers/companion/messageHelpers';

interface MessageWithSourcesProps {
  item: Message;
}

export const MessageWithSources: React.FC<MessageWithSourcesProps> = ({
  item,
}) => {
  const [showSources, setShowSources] = useState(false);

  return (
    <View
      style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.isUser ? styles.userText : styles.botText,
          ]}
        >
          {item.text}
        </Text>

        {/* Sources section for bot messages */}
        {!item.isUser && item.sources && item.sources.length > 0 && (
          <View style={styles.sourcesContainer}>
            <TouchableOpacity
              style={styles.sourcesHeader}
              onPress={() => setShowSources(!showSources)}
            >
              <Text style={styles.sourcesHeaderText}>
                Sources ({item.sources.length})
              </Text>
              <Ionicons
                name={showSources ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Theme.textInput}
              />
            </TouchableOpacity>
            {showSources && (
              <View style={styles.sourcesList}>
                {item.sources.map((source, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.sourceItem}
                    onPress={() => {
                      if (source.url) {
                        Linking.openURL(source.url).catch(err =>
                          console.error('Failed to open URL:', err)
                        );
                      }
                    }}
                  >
                    <Text style={styles.sourceLink}>
                      {source.document_title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: 5,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: Theme.surfaceBlue,
    borderTopRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  sourcesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  sourcesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sourcesHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textInput,
  },
  sourcesList: {
    marginTop: 8,
    gap: 8,
  },
  sourceItem: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sourceLink: {
    fontSize: 12,
    color: Theme.surfaceBlue,
    textDecorationLine: 'underline',
  },
});
