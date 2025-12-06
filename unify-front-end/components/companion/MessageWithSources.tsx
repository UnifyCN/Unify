import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { Message } from '@/helpers/companion/messageHelpers';

interface MessageWithSourcesProps {
  item: Message;
  suggestedNextSteps?: string[];
  onSuggestionPress?: (suggestion: string) => void;
}

/**
 * Adds alpha channel to a hex color string
 * @param hexColor - Hex color (e.g., '#5182C7' or '5182C7')
 * @param alpha - Alpha value as hex string (e.g., '15' for ~8% opacity, '80' for ~50%)
 * @returns Hex color with alpha channel, or original color if invalid
 */
const addAlphaToHex = (hexColor: string, alpha: string): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Validate: must be 6 characters (RGB)
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn(`Invalid hex color format: ${hexColor}. Expected format: #RRGGBB`);
    return hexColor; // Return original to avoid breaking
  }
  
  // Validate alpha: must be 2 hex characters (00-FF)
  if (alpha.length !== 2 || !/^[0-9A-Fa-f]{2}$/.test(alpha)) {
    console.warn(`Invalid alpha format: ${alpha}. Expected format: 2 hex digits (00-FF)`);
    return `#${hex}`; // Return color without alpha
  }
  
  return `#${hex}${alpha}`;
};

/**
 * Simple Markdown renderer for chat messages.
 * Supports: ## Headers, **bold**, - bullet points, and [links](url)
 */
const MarkdownText: React.FC<{ text: string; isUser: boolean }> = ({
  text,
  isUser,
}) => {
  const baseColor = isUser ? '#fff' : '#333';

  // Split text into lines for processing
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Handle ## Headers
    if (trimmedLine.startsWith('## ')) {
      elements.push(
        <Text
          key={`line-${lineIndex}`}
          style={[styles.markdownHeader, { color: baseColor }]}
        >
          {trimmedLine.substring(3)}
        </Text>
      );
      return;
    }

    // Handle - Bullet points
    if (trimmedLine.startsWith('- ')) {
      elements.push(
        <View key={`line-${lineIndex}`} style={styles.bulletContainer}>
          <Text style={[styles.bulletPoint, { color: baseColor }]}>•</Text>
          <Text style={[styles.bulletText, { color: baseColor }]}>
            {renderInlineFormatting(trimmedLine.substring(2), baseColor)}
          </Text>
        </View>
      );
      return;
    }

    // Handle numbered lists (1., 2., etc.)
    const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      elements.push(
        <View key={`line-${lineIndex}`} style={styles.bulletContainer}>
          <Text style={[styles.bulletPoint, { color: baseColor }]}>
            {numberedMatch[1]}.
          </Text>
          <Text style={[styles.bulletText, { color: baseColor }]}>
            {renderInlineFormatting(numberedMatch[2], baseColor)}
          </Text>
        </View>
      );
      return;
    }

    // Regular line with inline formatting
    if (trimmedLine.length > 0) {
      elements.push(
        <Text
          key={`line-${lineIndex}`}
          style={[styles.regularText, { color: baseColor }]}
        >
          {renderInlineFormatting(trimmedLine, baseColor)}
        </Text>
      );
    } else if (lineIndex > 0 && lineIndex < lines.length - 1) {
      // Empty line (paragraph break) - but not at start or end
      elements.push(
        <View key={`line-${lineIndex}`} style={styles.paragraphBreak} />
      );
    }
  });

  return <View style={styles.markdownContainer}>{elements}</View>;
};

/**
 * Renders inline formatting like **bold** and [links](url)
 */
const renderInlineFormatting = (
  text: string,
  baseColor: string
): React.ReactNode => {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Check for **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for [link](url)
    const linkMatch = remaining.match(/\[(.+?)\]\((.+?)\)/);

    // Find which comes first
    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const linkIndex = linkMatch ? remaining.indexOf(linkMatch[0]) : -1;

    if (boldIndex === -1 && linkIndex === -1) {
      // No more formatting, add remaining text
      parts.push(remaining);
      break;
    }

    // Process whichever comes first
    const firstMatch =
      boldIndex !== -1 &&
      (linkIndex === -1 || boldIndex < linkIndex)
        ? 'bold'
        : 'link';

    if (firstMatch === 'bold' && boldMatch) {
      // Add text before bold
      if (boldIndex > 0) {
        parts.push(remaining.substring(0, boldIndex));
      }
      // Add bold text
      parts.push(
        <Text key={`bold-${keyIndex++}`} style={styles.boldText}>
          {boldMatch[1]}
        </Text>
      );
      remaining = remaining.substring(boldIndex + boldMatch[0].length);
    } else if (firstMatch === 'link' && linkMatch) {
      // Add text before link
      if (linkIndex > 0) {
        parts.push(remaining.substring(0, linkIndex));
      }
      // Add link
      const linkText = linkMatch[1];
      const linkUrl = linkMatch[2];
      parts.push(
        <Text
          key={`link-${keyIndex++}`}
          style={styles.linkText}
          onPress={() => {
            Linking.openURL(linkUrl).catch(err =>
              console.error('Failed to open URL:', err)
            );
          }}
        >
          {linkText}
        </Text>
      );
      remaining = remaining.substring(linkIndex + linkMatch[0].length);
    }
  }

  return parts.length === 1 && typeof parts[0] === 'string' ? (
    parts[0]
  ) : (
    <>{parts}</>
  );
};

export const MessageWithSources: React.FC<MessageWithSourcesProps> = ({
  item,
  suggestedNextSteps,
  onSuggestionPress,
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
        {/* Render markdown for bot messages, plain text for user */}
        {item.isUser ? (
          <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
        ) : (
          <MarkdownText text={item.text} isUser={false} />
        )}

        {/* Disclaimer section for bot messages */}
        {!item.isUser && item.disclaimer && (
          <View style={styles.disclaimerContainer}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={Theme.textInput}
            />
            <Text style={styles.disclaimerText}>{item.disclaimer}</Text>
          </View>
        )}

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

        {/* Suggested Next Steps - Only for bot messages */}
        {!item.isUser && suggestedNextSteps && suggestedNextSteps.length > 0 && onSuggestionPress && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Ask a follow-up:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsScroll}
            >
              {suggestedNextSteps.map((suggestion, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionChip}
                  onPress={() => onSuggestionPress(suggestion)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.suggestionText} numberOfLines={2}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    maxWidth: '85%',
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
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  // Markdown styles
  markdownContainer: {
    gap: 4,
  },
  markdownHeader: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  regularText: {
    fontSize: 15,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
  },
  linkText: {
    color: Theme.surfaceBlue,
    textDecorationLine: 'underline',
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginVertical: 2,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
    marginRight: 8,
    minWidth: 14,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  paragraphBreak: {
    height: 8,
  },
  // Disclaimer styles
  disclaimerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 12,
    color: Theme.textInput,
    flex: 1,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  // Sources styles
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
  // Suggested Next Steps styles
  suggestionsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.textInput,
    marginBottom: 8,
  },
  suggestionsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: addAlphaToHex(Theme.surfaceBlue, '15'), // 15% opacity
    borderWidth: 1,
    borderColor: Theme.surfaceBlue,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxWidth: 200,
  },
  suggestionText: {
    fontSize: 13,
    color: Theme.surfaceBlue,
    fontWeight: '500',
  },
});
