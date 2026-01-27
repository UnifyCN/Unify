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
 * Converts a hex color to rgba format with specified opacity
 * @param hexColor - Hex color (e.g., '#5182C7' or '5182C7')
 * @param opacity - Opacity value from 0 to 1 (e.g., 0.08 for 8% opacity)
 * @returns rgba color string, or original color if invalid
 */
const hexToRgba = (hexColor: string, opacity: number): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Validate: must be 6 characters (RGB)
  if (hex.length !== 6 || !/^[0-9A-Fa-f]{6}$/.test(hex)) {
    console.warn(
      `Invalid hex color format: ${hexColor}. Expected format: #RRGGBB`
    );
    return hexColor;
  }

  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

type SectionType =
  | 'general'
  | 'at_a_glance'
  | 'need_to_know'
  | 'next_steps'
  | 'learn_more';

/**
 * Renders a single line of markdown content
 * @param isInAtAGlance - Whether this line is inside the At a Glance card (for special styling)
 */
const renderMarkdownLine = (
  trimmedLine: string,
  lineIndex: number,
  baseColor: string,
  isFirstHeader: boolean,
  currentSection: SectionType,
  isInAtAGlance: boolean = false
): React.ReactNode => {
  // Handle ## Headers
  if (trimmedLine.startsWith('## ')) {
    return (
      <Text
        key={`line-${lineIndex}`}
        style={[
          isInAtAGlance ? styles.atAGlanceHeader : styles.markdownHeader,
          // Remove top margin for first header (At a Glance)
          isFirstHeader && { marginTop: 0 },
        ]}
      >
        {trimmedLine.substring(3)}
      </Text>
    );
  }

  // Handle - Bullet points
  if (trimmedLine.startsWith('- ')) {
    // For 'need_to_know' and 'learn_more', render as text block without bullet
    if (currentSection === 'need_to_know' || currentSection === 'learn_more') {
      return (
        <Text
          key={`line-${lineIndex}`}
          style={[
            styles.regularText,
            styles.sectionTextItem,
            { color: baseColor },
          ]}
        >
          {renderInlineFormatting(trimmedLine.substring(2), baseColor)}
        </Text>
      );
    }

    return (
      <View key={`line-${lineIndex}`} style={styles.bulletContainer}>
        <Text style={styles.bulletPoint}>•</Text>
        <Text style={styles.bulletText}>
          {renderInlineFormatting(trimmedLine.substring(2), baseColor)}
        </Text>
      </View>
    );
  }

  // Handle numbered lists (1., 2., etc.)
  const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return (
      <View key={`line-${lineIndex}`} style={styles.numberedContainer}>
        <Text style={styles.numberedPoint}>{numberedMatch[1]}.</Text>
        <Text style={styles.bulletText}>
          {renderInlineFormatting(numberedMatch[2], baseColor)}
        </Text>
      </View>
    );
  }

  // Regular line with inline formatting
  if (trimmedLine.length > 0) {
    return (
      <Text
        key={`line-${lineIndex}`}
        style={isInAtAGlance ? styles.atAGlanceText : styles.regularText}
      >
        {renderInlineFormatting(trimmedLine, baseColor)}
      </Text>
    );
  }

  return null;
};

/**
 * Simple Markdown renderer for chat messages.
 * Supports: ## Headers, **bold**, - bullet points, and [links](url)
 * Special styling for "At a Glance" section
 */
const MarkdownText: React.FC<{ text: string; isUser: boolean }> = ({
  text,
  isUser,
}) => {
  const baseColor = isUser ? '#fff' : '#333';

  // Split text into lines for processing
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  // Find "At a Glance" section boundaries
  let atAGlanceStart = -1;
  let atAGlanceEnd = -1;

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('## ')) {
      const headerText = trimmedLine.substring(3).toLowerCase();
      if (headerText.includes('at a glance') && atAGlanceStart === -1) {
        atAGlanceStart = index;
      } else if (atAGlanceStart !== -1 && atAGlanceEnd === -1) {
        // Found next header after "At a Glance"
        atAGlanceEnd = index;
      }
    }
  });

  // If "At a Glance" exists but no following header, it goes to the first empty line or end
  if (atAGlanceStart !== -1 && atAGlanceEnd === -1) {
    // Find the end by looking for an empty line after content
    let foundContent = false;
    for (let i = atAGlanceStart + 1; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.length > 0) {
        foundContent = true;
      } else if (foundContent) {
        atAGlanceEnd = i;
        break;
      }
    }
    if (atAGlanceEnd === -1) {
      atAGlanceEnd = lines.length;
    }
  }

  // Process lines and group "At a Glance" section
  const atAGlanceContent: React.ReactNode[] = [];
  let isFirstHeader = true;
  let currentSection: SectionType = 'general';

  lines.forEach((line, lineIndex) => {
    const trimmedLine = line.trim();

    // Determine current section based on headers
    if (trimmedLine.startsWith('## ')) {
      const headerText = trimmedLine.substring(3).toLowerCase();
      if (headerText.includes('at a glance')) {
        currentSection = 'at_a_glance';
      } else if (headerText.includes('what you need to know')) {
        currentSection = 'need_to_know';
      } else if (headerText.includes('next steps')) {
        currentSection = 'next_steps';
      } else if (headerText.includes('learn more')) {
        currentSection = 'learn_more';
      } else {
        currentSection = 'general';
      }
    }

    // Check if we're in the "At a Glance" section
    const isInAtAGlance =
      atAGlanceStart !== -1 &&
      lineIndex >= atAGlanceStart &&
      lineIndex < atAGlanceEnd;

    if (isInAtAGlance) {
      const element = renderMarkdownLine(
        trimmedLine,
        lineIndex,
        baseColor,
        trimmedLine.startsWith('## ') && isFirstHeader,
        currentSection,
        true // isInAtAGlance
      );
      if (element) {
        if (trimmedLine.startsWith('## ')) {
          isFirstHeader = false;
        }
        atAGlanceContent.push(element);
      }

      // If this is the last line of "At a Glance", wrap and add the section
      if (lineIndex === atAGlanceEnd - 1) {
        elements.push(
          <View key="at-a-glance-section" style={styles.atAGlanceCard}>
            {atAGlanceContent}
          </View>
        );
      }
      return;
    }

    // Track first header for regular sections too
    if (trimmedLine.startsWith('## ')) {
      isFirstHeader = false;
    }

    const element = renderMarkdownLine(
      trimmedLine,
      lineIndex,
      baseColor,
      false,
      currentSection,
      false
    );
    if (element) {
      elements.push(element);
    } else if (
      lineIndex > 0 &&
      lineIndex < lines.length - 1 &&
      trimmedLine.length === 0
    ) {
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
      boldIndex !== -1 && (linkIndex === -1 || boldIndex < linkIndex)
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
              name='information-circle-outline'
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
        {!item.isUser &&
          suggestedNextSteps &&
          suggestedNextSteps.length > 0 &&
          onSuggestionPress && (
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
    marginVertical: 6,
    flexDirection: 'row',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '92%',
    paddingHorizontal: 18,
    paddingVertical: 18,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#fff',
  },
  botText: {
    color: '#333',
  },
  // Markdown styles
  markdownContainer: {
    gap: 8,
  },
  markdownHeader: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginTop: 8,
    marginBottom: 4,
    color: '#1a1a1a',
  },
  regularText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#444',
  },
  boldText: {
    fontWeight: '700',
    color: '#222',
  },
  linkText: {
    color: Theme.surfaceBlue,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
    marginVertical: 8,
  },
  bulletPoint: {
    fontSize: 8,
    lineHeight: 26,
    marginRight: 14,
    marginTop: 8,
    color: Theme.surfaceBlue,
  },
  bulletText: {
    fontSize: 16,
    lineHeight: 26,
    flex: 1,
    color: '#444',
  },
  paragraphBreak: {
    height: 4,
  },
  // Numbered list styles (distinct from bullets)
  numberedContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  numberedPoint: {
    fontSize: 16,
    lineHeight: 26,
    marginRight: 12,
    minWidth: 12,
    color: '#000',
    fontWeight: '600',
  },
  sectionTextItem: {
    marginBottom: 4,
  },
  // At a Glance section highlight
  atAGlanceCard: {
    backgroundColor: hexToRgba(Theme.surfaceBlue, 0.08),
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 16,
  },
  atAGlanceHeader: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 10,
    color: '#000',
  },
  atAGlanceText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#333',
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
    backgroundColor: hexToRgba(Theme.surfaceBlue, 0.08), // 8% opacity
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
