// RichTextRenderer.tsx
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  TextInput,
  Modal,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import {
  PinchGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import DropdownBlock from '@/components/sanity/DropdownBlock';
import { AlignJustify, AlignVerticalJustifyCenter } from 'lucide-react-native';
import { Feather } from '@expo/vector-icons';

interface RichTextRendererProps {
  blocks: any[];
  styles?: any;
  markDefs?: any[];
  inputValues?: { [key: string]: string };
  onInputChange?: (fieldKey: string, value: string) => void;
  questionAnswers?: { [key: string]: string | string[] };
  onQuestionAnswer?: (questionKey: string, answer: string | string[]) => void;
  showQuestionFeedback?: boolean;
}

export default function RichTextRenderer({
  blocks,
  styles: customStyles,
  markDefs,
  inputValues = {},
  onInputChange,
  questionAnswers = {},
  onQuestionAnswer,
  showQuestionFeedback = false,
}: RichTextRendererProps) {
  // Image viewer modal state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const baseZoomRef = useRef(1); // Track base zoom for pinch gestures
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  if (!blocks || !Array.isArray(blocks)) return null;

  // Create numbering map for ordered lists (keep prev behavior)
  const createNumberingMap = (blocks: any[]) => {
    const numberingMap: { [key: string]: number } = {};
    let currentNumber = 1;
    let inOrderedList = false;

    blocks.forEach((block, index) => {
      if (block._type === 'block' && block.listItem === 'number') {
        if (!inOrderedList) {
          currentNumber = 1;
          inOrderedList = true;
        }
        numberingMap[block._key || index] = currentNumber;
        currentNumber++;
      } else if (block._type === 'block' && !block.listItem) {
        inOrderedList = false;
        currentNumber = 1;
      }
    });

    return numberingMap;
  };

  const numberingMap = createNumberingMap(blocks);

  const defaultStyles = {
    // Headings
    h1: {
      fontSize: 28,
      fontWeight: '700',
      color: '#000',
      marginBottom: 20,
      marginTop: 24,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      color: '#000',
      marginBottom: 16,
      marginTop: 20,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#000',
      marginBottom: 14,
      marginTop: 16,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      color: '#000',
      marginBottom: 12,
      marginTop: 14,
    },

    // Paragraphs
    normal: {
      fontFamily: 'Font Family',
      fontWeight: '400', // Regular
      fontStyle: 'normal',
      fontSize: 18,
      lineHeight: 27,
      letterSpacing: 0,
      color: '#374151',
      marginBottom: 5, // Consistent spacing between paragraphs
    },

    // Lists
    bullet: {
      fontFamily: 'Font Family',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 18,
      lineHeight: 20,
      letterSpacing: 0,
      color: '#374151',
      marginBottom: 10, // Spacing between bullet items
      marginTop: 0,
    },
    number: {
      fontFamily: 'Font Family',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 18,
      lineHeight: 20,
      letterSpacing: 0,
      color: '#374151',
      marginBottom: 3, // Spacing between numbered items
    },

    strong: {
      fontFamily: 'Font Family',
      fontWeight: '700', // Semi-Bold
      fontStyle: 'normal',
      fontSize: 18,
      lineHeight: 20,
      letterSpacing: 0,
      color: '#374151',
    },
    // Quote
    blockquote: {
      fontSize: 16,
      color: '#6B7280',
      fontStyle: 'italic',
      lineHeight: 24,
      marginBottom: 16,
      marginTop: 16,
      paddingLeft: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#E5E7EB',
    },

    // Code
    code: {
      fontSize: 16,
      color: '#1F2937',
      backgroundColor: '#F3F4F6',
      padding: 8,
      borderRadius: 4,
      fontFamily: 'monospace',
      marginBottom: 16,
    },

    // Image
    image: { width: '100%', height: 200, borderRadius: 12, marginVertical: 16 },
    imagePlaceholder: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      backgroundColor: '#E5E7EB',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 16,
    },
    imagePlaceholderText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },

    // Special blocks
    dropdown: { marginVertical: 16 },

    exampleBox: {
      backgroundColor: '#EAEAEA',
      borderRadius: 10,
      padding: 15,
      marginVertical: 5,
      marginBottom: 25,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 2,
      borderColor: '#C9C9C9',
    },
    exampleBoxTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#374151',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    exampleText: {
      fontFamily: 'Font Family',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 18,
      lineHeight: 20,
      letterSpacing: 0,
      color: '#374151',
    },

    // ✅ TIP BOX (merged from your ActivityPageScreen, Figma spec)
    tipBoxContainer: {
      backgroundColor: 'transparent',
      borderLeftWidth: 5,
      borderLeftColor: '#3F3F3F',
      paddingLeft: 15,
      paddingRight: 0,
      paddingTop: 5, // 5px margin on top
      paddingBottom: 5, // 5px margin on bottom
      alignSelf: 'center',
      width: 353,
      maxWidth: '100%',
      minHeight: 30, // 5px top + 20px (one line) + 5px bottom = 30px minimum
      marginTop: 0,
      marginBottom: 30,
    },
    tipTitleText: {
      fontFamily: 'Font Family',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600', // Semi-bold
      color: '#3F3F3F',
    },
    tipBodyText: {
      fontFamily: 'Font Family',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400', // Regular
      color: '#3F3F3F',
      marginBottom: 0,
    },

    // Note box (unchanged)
    noteBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      paddingRight: 16,
      paddingLeft: 22,
      paddingVertical: 16,
      marginVertical: 16,
      borderWidth: 2,
      borderColor: '#878787',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    noteBoxText: { fontSize: 16, color: '#3F3F3F', lineHeight: 24 },

    // Links
    link: {
      color: '#424242',
      textDecorationLine: 'underline',
      fontWeight: '600',
    },
  };

  // Merge styles, ensuring header styles are always preserved
  // If custom styles are provided, merge them but always ensure headers exist
  // For nested renders (like question text), we need to ensure headers are always available
  const mergedStyles = {
    ...defaultStyles,
    // Only spread customStyles if it exists and is an object
    ...(customStyles && typeof customStyles === 'object' ? customStyles : {}),
    // Always ensure header styles exist with their full default properties
    // If custom header styles are provided, merge them with defaults to preserve all properties
    h1:
      customStyles?.h1 && typeof customStyles.h1 === 'object'
        ? { ...defaultStyles.h1, ...customStyles.h1 }
        : defaultStyles.h1,
    h2:
      customStyles?.h2 && typeof customStyles.h2 === 'object'
        ? { ...defaultStyles.h2, ...customStyles.h2 }
        : defaultStyles.h2,
    h3:
      customStyles?.h3 && typeof customStyles.h3 === 'object'
        ? { ...defaultStyles.h3, ...customStyles.h3 }
        : defaultStyles.h3,
    h4:
      customStyles?.h4 && typeof customStyles.h4 === 'object'
        ? { ...defaultStyles.h4, ...customStyles.h4 }
        : defaultStyles.h4,
  };

  // Keep prev nesting-level calc
  const calculateNestingLevels = (blocks: any[]) => {
    const nestingMap: { [key: string]: number } = {};
    let currentNesting = 0;
    let listStack: string[] = [];

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];

      if (block._type === 'block' && block.listItem) {
        const level = block.level || 0;
        nestingMap[block._key || i] = level;
        currentNesting = level;
      } else {
        currentNesting = 0;
        listStack = [];
      }
    }

    return nestingMap;
  };

  const renderInlineText = (
    children: any[],
    markDefs?: any[],
    blockMarkDefs?: any[]
  ) => {
    if (!children || !Array.isArray(children)) return null;

    // Combine markDefs from props and block-level markDefs
    const allMarkDefs = [...(markDefs || []), ...(blockMarkDefs || [])];

    return children.map((child, index) => {
      if (typeof child === 'string') return child;

      if (child._type === 'span') {
        let text: any = child.text || '';
        let linkHref: string | null = null;
        const decoratorStyles: any[] = [];

        if (child.marks) {
          // First pass: handle annotations (link, textAlign) that need markDefs
          child.marks.forEach((mark: string | any) => {
            // Handle link annotation
            if (typeof mark === 'string') {
              // Check if mark key references a link annotation in markDefs
              const markDef = allMarkDefs.find((def: any) => def._key === mark);
              if (markDef && markDef._type === 'link') {
                linkHref = markDef.href || null;
              }
            } else if (typeof mark === 'object' && mark !== null) {
              // Sometimes marks can be objects directly (inline annotations)
              const markType = (mark as any)._type || mark._type;
              if (markType === 'link') {
                linkHref =
                  (mark as any).href || (mark as any).value?.href || null;
              }
              // Or it might be a reference object with _key that we need to look up
              const markKey = (mark as any)._key;
              if (markKey && !linkHref) {
                const markDef = allMarkDefs.find(
                  (def: any) => def._key === markKey
                );
                if (markDef && markDef._type === 'link') {
                  linkHref = markDef.href || null;
                }
              }
            }
          });

          // Second pass: collect decorator styles (strong, em, code, etc.)
          child.marks.forEach((mark: string | any) => {
            // Handle decorators (strong, em, code, etc.)
            if (typeof mark === 'string') {
              switch (mark) {
                case 'strong':
                  decoratorStyles.push(mergedStyles.strong);
                  break;
                case 'em':
                  decoratorStyles.push({ fontStyle: 'italic' });
                  break;
                case 'code':
                  decoratorStyles.push({
                    fontFamily: 'monospace',
                    backgroundColor: '#F3F4F6',
                    paddingHorizontal: 4,
                    borderRadius: 2,
                  });
                  break;
                case 'underline':
                  decoratorStyles.push({ textDecorationLine: 'underline' });
                  break;
                case 'strike-through':
                  decoratorStyles.push({ textDecorationLine: 'line-through' });
                  break;
              }
            }
          });

          // Merge all decorator styles into one object
          // Important: fontStyle: 'italic' should take precedence over fontStyle: 'normal'
          const mergedDecoratorStyle = decoratorStyles.reduce((acc, style) => {
            const merged = { ...acc, ...style };
            // If both styles have fontStyle, prioritize 'italic' over 'normal'
            if (acc.fontStyle === 'italic' || style.fontStyle === 'italic') {
              merged.fontStyle = 'italic';
            }
            return merged;
          }, {});

          // Apply decorators by wrapping text (only if not a link, since link will handle it)
          if (!linkHref && decoratorStyles.length > 0) {
            // Use merged decorator style in a single Text component
            text = (
              <Text key={`${index}-decorators`} style={mergedDecoratorStyle}>
                {text}
              </Text>
            );
          }

          // Apply link if found, merging link styles with all decorator styles
          if (linkHref) {
            const handleLinkPress = () => {
              if (linkHref) {
                Linking.openURL(linkHref);
              }
            };
            // Merge link styles with all decorator styles
            // Ensure fontStyle: 'italic' is preserved when merging with link styles
            const linkStyle =
              decoratorStyles.length > 0
                ? {
                    ...mergedStyles.link,
                    ...mergedDecoratorStyle,
                    // Preserve italic if it exists in decorator styles
                    ...(mergedDecoratorStyle.fontStyle === 'italic'
                      ? { fontStyle: 'italic' }
                      : {}),
                  }
                : mergedStyles.link;
            // Use Text with onPress instead of TouchableOpacity to keep it inline
            text = (
              <Text
                key={`${index}-link`}
                style={linkStyle}
                onPress={handleLinkPress}
              >
                {text}
              </Text>
            );
          }
        }

        // Text alignment is now handled at block level, so we don't need to wrap here
        return text;
      }

      return null;
    });
  };

  // Helper function to check if a block is empty (skip line)
  const isEmptyBlock = (block: any): boolean => {
    if (block._type !== 'block' || block.listItem) return false;
    if (!block.children || !Array.isArray(block.children)) return true;

    // Check if all children have empty or whitespace-only text
    const hasContent = block.children.some((child: any) => {
      if (typeof child === 'string') return child.trim().length > 0;
      if (child._type === 'span' && child.text) {
        return child.text.trim().length > 0;
      }
      return false;
    });

    return !hasContent;
  };

  const renderBlock = (
    block: any,
    index: number,
    nestingLevel: number = 0,
    isLastInList: boolean = false,
    afterSkipLine: boolean = false,
    isFirstInList: boolean = false
  ) => {
    if (
      block._type === 'large_input_box' ||
      block._type === 'mid_input_box' ||
      block._type === 'small_input_box'
    ) {
    }

    if (block._type === 'block') {
      // Handle empty blocks (skip lines) - render as spacing element
      if (isEmptyBlock(block)) {
        return <View key={block._key || index} style={styles.skipLineSpacer} />;
      }

      // Keep prev bullet/number behavior
      if (block.listItem) {
        const baseListStyle =
          block.listItem === 'bullet'
            ? mergedStyles.bullet
            : mergedStyles.number;

        // Remove marginBottom from last item in list to ensure consistent spacing
        const listStyle = isLastInList
          ? { ...baseListStyle, marginBottom: 0 }
          : baseListStyle;

        const bullet =
          block.listItem === 'bullet'
            ? '•'
            : `${numberingMap[block._key || index] || 1}.`;

        const indentLevel = nestingLevel * 15;

        let displayBullet = bullet;
        if (block.listItem === 'bullet') {
          if (nestingLevel === 1) displayBullet = '•';
          else if (nestingLevel === 2) displayBullet = '◦';
          else if (nestingLevel === 3) displayBullet = '▪';
          else displayBullet = '▫';
        }

        // Adjust spacing for last item in list to match paragraph spacing (20px)
        const containerStyle = isLastInList
          ? [
              styles.listItemContainer,
              { marginLeft: indentLevel, marginBottom: 20 },
            ]
          : [styles.listItemContainer, { marginLeft: indentLevel }];

        return (
          <View key={block._key || index} style={containerStyle}>
            <Text style={listStyle}>
              {displayBullet}{' '}
              {renderInlineText(block.children, markDefs, block.markDefs)}
            </Text>
          </View>
        );
      }

      const style = block.style || 'normal';

      // Check for text alignment in block children
      // Combine markDefs from props and block-level markDefs
      const allMarkDefs = [...(markDefs || []), ...(block.markDefs || [])];

      let blockTextAlign: 'left' | 'center' | 'right' | undefined = undefined;
      if (block.children && Array.isArray(block.children)) {
        for (const child of block.children) {
          if (child.marks && Array.isArray(child.marks)) {
            for (const mark of child.marks) {
              // Marks in Sanity are typically string keys that reference markDefs
              if (typeof mark === 'string') {
                // Check if mark key references a textAlign annotation in markDefs
                const markDef = allMarkDefs.find(
                  (def: any) => def._key === mark
                );
                if (markDef) {
                  if (markDef._type === 'textAlign') {
                    blockTextAlign = markDef.align || 'left';
                    break;
                  }
                }
              } else if (typeof mark === 'object' && mark !== null) {
                // Sometimes marks can be objects directly (inline annotations)
                const markType = (mark as any)._type || mark._type;
                if (markType === 'textAlign') {
                  blockTextAlign =
                    (mark as any).align || (mark as any).value?.align || 'left';
                  break;
                }
                // Or it might be a reference object with _key that we need to look up
                const markKey = (mark as any)._key;
                if (markKey) {
                  const markDef = allMarkDefs.find(
                    (def: any) => def._key === markKey
                  );
                  if (markDef && markDef._type === 'textAlign') {
                    blockTextAlign = markDef.align || 'left';
                    break;
                  }
                }
              }
            }
            if (blockTextAlign) break;
          }
        }
      }

      // Apply alignment to block style
      // Default to 'left' if no alignment is specified
      const finalTextAlign = blockTextAlign || 'left';
      const blockStyle = {
        ...mergedStyles[style],
        textAlign: finalTextAlign,
      };

      switch (style) {
        case 'h1':
          return (
            <Text key={block._key || index} style={blockStyle}>
              {renderInlineText(block.children, markDefs, block.markDefs)}
            </Text>
          );
        case 'h2':
          return (
            <Text key={block._key || index} style={blockStyle}>
              {renderInlineText(block.children, markDefs, block.markDefs)}
            </Text>
          );
        case 'h3':
          return (
            <Text key={block._key || index} style={blockStyle}>
              {renderInlineText(block.children, markDefs, block.markDefs)}
            </Text>
          );
        case 'h4':
          return (
            <Text key={block._key || index} style={blockStyle}>
              {renderInlineText(block.children, markDefs, block.markDefs)}
            </Text>
          );
        case 'blockquote':
          return (
            <View key={block._key || index} style={mergedStyles.blockquote}>
              <Text
                style={
                  blockTextAlign && blockTextAlign !== 'left'
                    ? { textAlign: blockTextAlign }
                    : {}
                }
              >
                {renderInlineText(block.children, markDefs, block.markDefs)}
              </Text>
            </View>
          );
        case 'code':
          return (
            <View key={block._key || index} style={mergedStyles.code}>
              <Text
                style={
                  blockTextAlign && blockTextAlign !== 'left'
                    ? { textAlign: blockTextAlign }
                    : {}
                }
              >
                {renderInlineText(block.children, markDefs, block.markDefs)}
              </Text>
            </View>
          );
        case 'normal':
        default:
          // Add marginTop to first block to prevent text clipping
          const isFirstBlock = index === 0;
          const finalBlockStyle = isFirstBlock
            ? { ...blockStyle, marginTop: 8 }
            : blockStyle;
          return (
            <Text 
              key={block._key || index} 
              style={finalBlockStyle}
              includeFontPadding={false}
            >
              {renderInlineText(block.children, markDefs, block.markDefs)}
            </Text>
          );
      }
    }

    if (block._type === 'image') {
      const imageUrl = block.asset?._ref
        ? `https://cdn.sanity.io/images/fercgabp/production/${block.asset._ref
            .replace('image-', '')
            .replace('-jpg', '.jpg')
            .replace('-png', '.png')
            .replace('-webp', '.webp')}`
        : null;

      return (
        <View key={block._key || index} style={mergedStyles.imageSection}>
          {imageUrl ? (
            <TouchableOpacity
              onPress={() => {
                setSelectedImage(imageUrl);
                setImageZoom(1);
              }}
              activeOpacity={0.9}
            >
              <Image source={{ uri: imageUrl }} style={mergedStyles.image} />
            </TouchableOpacity>
          ) : (
            <View style={mergedStyles.imagePlaceholder}>
              <Text style={mergedStyles.imagePlaceholderText}>Image</Text>
            </View>
          )}
        </View>
      );
    }

    // Special block types
    if (block._type === 'dropdown') {
      return <DropdownBlock block={block} index={index} />;
    }

    if (block._type === 'example_box') {
      // keep your current example override
      return (
        <View key={block._key || index} style={mergedStyles.exampleBox}>
          <Text style={mergedStyles.exampleBoxTitle}>EXAMPLE</Text>
          <RichTextRenderer
            blocks={block.content || []}
            markDefs={markDefs}
            styles={{
              normal: mergedStyles.exampleText,
              bullet: mergedStyles.exampleText,
              number: mergedStyles.exampleText,
              link: mergedStyles.link,
            }}
          />
        </View>
      );
    }

    if (block._type === 'tip_box') {
      return (
        <View key={block._key || index} style={mergedStyles.tipBoxContainer}>
          <RichTextRenderer
            blocks={block.content || []}
            markDefs={markDefs}
            styles={{
              // regular copy inside tip
              normal: mergedStyles.tipBodyText,
              bullet: mergedStyles.tipBodyText,
              number: mergedStyles.tipBodyText,
              link: mergedStyles.link,
              // bold lead-in (e.g., "**Safety tip:**")
              strong: mergedStyles.tipTitleText,
            }}
          />
        </View>
      );
    }

    if (block._type === 'note_box') {
      return (
        <View key={block._key || index} style={mergedStyles.noteBox}>
          <RichTextRenderer
            blocks={block.content || []}
            markDefs={markDefs}
            styles={{ normal: mergedStyles.noteBoxText }}
          />
        </View>
      );
    }

    // Inputs
    if (
      block._type === 'large_input_box' ||
      block._type === 'mid_input_box' ||
      block._type === 'small_input_box'
    ) {
      const isLarge = block._type === 'large_input_box';
      const isMid = block._type === 'mid_input_box';
      const isSmall = block._type === 'small_input_box';

      return (
        <View
          key={block._key || index}
          style={mergedStyles.inputFieldContainer}
        >
          <TextInput
            style={[
              {
                borderWidth: 1,
                borderColor: '#9CA3AF',
                borderRadius: 8,
                paddingHorizontal: 20,
                paddingVertical: 20,
                fontSize: 18,
                backgroundColor: '#fff',
                minHeight: 44,
                marginBottom: 30,
              },
              isLarge && { height: 300, textAlignVertical: 'top' },
              isMid && { height: 160, textAlignVertical: 'top' },
              isSmall && { height: 60, textAlignVertical: 'top' },
            ]}
            placeholder={(block.placeholder = 'Type Here')}
            value={inputValues[block._key] || ''}
            onChangeText={value => onInputChange?.(block._key, value)}
            multiline={true}
            numberOfLines={isLarge ? 10 : isMid ? 6 : 3}
          />
        </View>
      );
    }

    // Two options question - special layout with side-by-side cards
    if (block._type === 'two_options_question') {
      const currentAnswer = questionAnswers[block._key];
      const selectedValue = currentAnswer as string | undefined;

      const handleOptionSelect = (optionValue: string) => {
        if (!onQuestionAnswer) return;
        onQuestionAnswer(block._key, optionValue);
      };

      return (
        <View key={block._key || index} style={styles.questionContainer}>
          <View style={styles.questionTextContainer}>
            <RichTextRenderer
              blocks={block.question_text || []}
              markDefs={markDefs}
            />
          </View>
          <View style={styles.twoOptionsContainer}>
            {(block.options || []).map((option: any) => {
              const isSelected = selectedValue === option.value;
              const isCorrect = option.is_correct;
              const showFeedback = showQuestionFeedback;

              let optionStyle = styles.twoOptionCard;

              if (isSelected) {
                optionStyle = styles.twoOptionCardSelected;
              }

              if (showFeedback) {
                if (isCorrect) {
                  optionStyle = styles.twoOptionCardCorrect;
                } else if (isSelected && !isCorrect) {
                  optionStyle = styles.twoOptionCardIncorrect;
                }
              }

              return (
                <TouchableOpacity
                  key={option._key}
                  style={optionStyle}
                  onPress={() =>
                    !showFeedback && handleOptionSelect(option.value)
                  }
                  disabled={showFeedback}
                >
                  <View style={styles.twoOptionContent}>
                    <RichTextRenderer
                      blocks={option.text || []}
                      markDefs={option.textMarkDefs}
                      styles={{
                        normal: styles.twoOptionText,
                        strong: styles.twoOptionTextBold,
                      }}
                    />
                  </View>
                  {showFeedback && isSelected && option.explanation && (
                    <View style={styles.twoOptionExplanation}>
                      <RichTextRenderer
                        blocks={option.explanation}
                        markDefs={option.explanationMarkDefs}
                        styles={{ normal: styles.explanationText }}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    // Question types for activity pages (MCQ single and multiple)
    if (
      block._type === 'multiple_choice_single' ||
      block._type === 'multiple_choice_multiple'
    ) {
      const isMultiple = block._type === 'multiple_choice_multiple';
      const currentAnswer = questionAnswers[block._key];
      const isArrayAnswer = Array.isArray(currentAnswer);
      const selectedValues = isArrayAnswer
        ? (currentAnswer as string[])
        : currentAnswer
          ? [currentAnswer as string]
          : [];

      const handleOptionSelect = (optionValue: string) => {
        if (!onQuestionAnswer) return;

        if (isMultiple) {
          const current = (questionAnswers[block._key] as string[]) || [];
          const newAnswer = current.includes(optionValue)
            ? current.filter(v => v !== optionValue)
            : [...current, optionValue];
          onQuestionAnswer(block._key, newAnswer);
        } else {
          onQuestionAnswer(block._key, optionValue);
        }
      };

      return (
        <View key={block._key || index} style={styles.questionContainer}>
          <View style={styles.questionTextContainer}>
            <RichTextRenderer
              blocks={block.question_text || []}
              markDefs={markDefs}
            />
          </View>
          <View style={styles.optionsContainer}>
            {(block.options || []).map((option: any) => {
              const isSelected = isMultiple
                ? selectedValues.includes(option.value)
                : selectedValues[0] === option.value;
              const isCorrect = option.is_correct;
              const showFeedback = showQuestionFeedback;

              let optionStyle = styles.questionOption;
              let checkboxStyle = styles.questionCheckbox;

              if (isSelected) {
                optionStyle = styles.questionOptionSelected;
                checkboxStyle = styles.questionCheckboxSelected;
              }

              if (showFeedback) {
                if (isCorrect) {
                  optionStyle = styles.questionOptionCorrect;
                  checkboxStyle = styles.questionCheckboxCorrect;
                } else if (isSelected && !isCorrect) {
                  optionStyle = styles.questionOptionIncorrect;
                  checkboxStyle = styles.questionCheckboxIncorrect;
                }
              }

              return (
                <TouchableOpacity
                  key={option._key}
                  style={optionStyle}
                  onPress={() =>
                    !showFeedback && handleOptionSelect(option.value)
                  }
                  disabled={showFeedback}
                >
                  <View style={styles.questionOptionRow}>
                    <View style={checkboxStyle}>
                      {isSelected && (
                        <Text style={styles.questionCheckmark}>✓</Text>
                      )}
                    </View>
                    <View style={styles.questionOptionContent}>
                      <RichTextRenderer
                        blocks={option.text || []}
                        markDefs={option.textMarkDefs}
                        styles={{ normal: styles.questionOptionText }}
                      />
                    </View>
                  </View>
                  {showFeedback && isSelected && option.explanation && (
                    <View style={styles.explanationContainer}>
                      <RichTextRenderer
                        blocks={option.explanation}
                        markDefs={option.explanationMarkDefs}
                        styles={{ normal: styles.explanationText }}
                      />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    }

    if (block._type === 'matching_question') {
      // For matching questions, we'll render a simplified version
      // Full matching logic would require more complex state management
      return (
        <View key={block._key || index} style={styles.questionContainer}>
          <View style={styles.questionTextContainer}>
            <RichTextRenderer
              blocks={block.question_text || []}
              markDefs={markDefs}
            />
          </View>
          <View style={styles.matchingPairsContainer}>
            {(block.matching_pairs || []).map(
              (pair: any, pairIndex: number) => (
                <View
                  key={pair._key || pairIndex}
                  style={styles.matchingPairRow}
                >
                  <Text style={styles.matchingPairText}>
                    {pair.left_item} → {pair.right_item}
                  </Text>
                </View>
              )
            )}
          </View>
        </View>
      );
    }

    return null;
  };

  const nestingLevels = calculateNestingLevels(blocks);

  // Helper to check if a block is the last item in a list
  const isLastListItem = (index: number): boolean => {
    const currentBlock = blocks[index];
    if (
      !currentBlock ||
      currentBlock._type !== 'block' ||
      !currentBlock.listItem
    ) {
      return false;
    }

    // Check if next block is not a list item (or doesn't exist)
    const nextBlock = blocks[index + 1];
    return !nextBlock || nextBlock._type !== 'block' || !nextBlock.listItem;
  };

  // Helper to check if the previous block was a skip line
  const isAfterSkipLine = (index: number): boolean => {
    if (index === 0) return false;
    const previousBlock = blocks[index - 1];
    return previousBlock && isEmptyBlock(previousBlock);
  };

  // Helper to check if this is the first item in a list (after a skip line or paragraph)
  const isFirstListItem = (index: number): boolean => {
    const currentBlock = blocks[index];
    if (
      !currentBlock ||
      currentBlock._type !== 'block' ||
      !currentBlock.listItem
    ) {
      return false;
    }

    // Check if previous block is not a list item
    if (index === 0) return true;
    const previousBlock = blocks[index - 1];
    return (
      !previousBlock ||
      previousBlock._type !== 'block' ||
      !previousBlock.listItem
    );
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(imageZoom + 0.5, 5); // Max 5x zoom
    setImageZoom(newZoom);
    baseZoomRef.current = newZoom; // Update base zoom for pinch
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(imageZoom - 0.5, 0.5); // Min 0.5x zoom
    setImageZoom(newZoom);
    baseZoomRef.current = newZoom; // Update base zoom for pinch
  };

  const handlePinchGesture = (event: any) => {
    const { scale } = event.nativeEvent;
    const newZoom = Math.max(
      0.5,
      Math.min(5, baseZoomRef.current * scale)
    );
    setImageZoom(newZoom);
  };

  const handlePinchGestureStateChange = (event: any) => {
    const { state } = event.nativeEvent;
    // State 2 is BEGAN - capture current zoom as base when gesture starts
    if (state === 2) {
      baseZoomRef.current = imageZoom;
    }
    // State 5 is END - finalize zoom when gesture ends
    if (state === 5) {
      baseZoomRef.current = imageZoom;
    }
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
    setImageZoom(1);
    baseZoomRef.current = 1;
    setImageDimensions(null);
  };

  return (
    <View style={styles.container}>
      {blocks
        .map((block, index) => {
          const isLastInList = isLastListItem(index);
          const afterSkipLine = isAfterSkipLine(index);
          const isFirstInList = isFirstListItem(index);
          return (
            <React.Fragment key={block._key || index}>
              {renderBlock(
                block,
                index,
                nestingLevels[block._key || index] || 0,
                isLastInList,
                afterSkipLine,
                isFirstInList
              )}
            </React.Fragment>
          );
        })
        .filter(Boolean)}

      {/* Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType='fade'
        onRequestClose={handleCloseImageModal}
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={styles.imageModalOverlay}>
            {/* Top bar with close button and zoom controls */}
            <View style={styles.imageModalHeader}>
              <TouchableOpacity
                onPress={handleCloseImageModal}
                style={styles.imageModalCloseButton}
              >
                <Feather name='x' size={20} color='#878787' />
              </TouchableOpacity>
              <View style={styles.imageModalZoomControls}>
                <TouchableOpacity
                  onPress={handleZoomOut}
                  style={styles.imageModalZoomButton}
                  disabled={imageZoom <= 0.5}
                >
                  <Feather
                    name='zoom-out'
                    size={20}
                    color={imageZoom <= 0.5 ? '#CCCCCC' : '#878787'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleZoomIn}
                  style={styles.imageModalZoomButton}
                  disabled={imageZoom >= 5}
                >
                  <Feather
                    name='zoom-in'
                    size={20}
                    color={imageZoom >= 5 ? '#CCCCCC' : '#878787'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Scrollable image container with pinch gesture */}
            <PinchGestureHandler
              onGestureEvent={handlePinchGesture}
              onHandlerStateChange={handlePinchGestureStateChange}
            >
              <ScrollView
                contentContainerStyle={styles.imageModalScrollContent}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                bounces={true}
                scrollEnabled={imageZoom > 1}
              >
                {selectedImage && (
                  <View
                    style={{
                      transform: [{ scale: imageZoom }],
                    }}
                  >
                    <Image
                      source={{ uri: selectedImage }}
                      style={[
                        styles.imageModalImage,
                        imageDimensions
                          ? {
                              width: imageDimensions.width,
                              height: imageDimensions.height,
                            }
                          : {
                              width: screenWidth,
                              height: screenHeight * 0.7,
                            },
                      ]}
                      resizeMode='contain'
                      onLoad={e => {
                        const { width, height } = e.nativeEvent.source;
                        if (width && height) {
                          // Use full original image dimensions (no size limits)
                          setImageDimensions({ width, height });
                        }
                      }}
                    />
                  </View>
                )}
              </ScrollView>
            </PinchGestureHandler>
          </SafeAreaView>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 4 }, // Add top padding to prevent text clipping
  listItemContainer: { marginBottom: 0 }, // Spacing between list items handled by bullet marginBottom
  skipLineSpacer: { height: 20, marginBottom: 0 }, // Skip lines create consistent 20px spacing
  inputFieldContainer: {
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    borderRadius: 8,
    padding: 12,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#9CA3AF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 44,
  },
  largeInput: {
    height: 300,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  midInput: {
    height: 200,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
  smallInput: { height: 100, borderWidth: 2, borderColor: '#9CA3AF' },
  // Question styles
  questionContainer: {
    marginVertical: 20,
  },
  questionTextContainer: {
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  questionOption: {
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  questionOptionSelected: {
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  questionOptionCorrect: {
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  questionOptionIncorrect: {
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F3F4F6',
  },
  questionOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  questionCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCheckboxSelected: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 4,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCheckboxCorrect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 4,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCheckboxIncorrect: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 4,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionCheckmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionOptionContent: {
    flex: 1,
  },
  questionOptionText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '400',
  },
  explanationContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  explanationText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  matchingPairsContainer: {
    gap: 8,
    marginTop: 12,
  },
  matchingPairRow: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  matchingPairText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  // Two options question styles
  twoOptionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  twoOptionCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 406,
  },
  twoOptionCardSelected: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 406,
  },
  twoOptionCardCorrect: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 406,
  },
  twoOptionCardIncorrect: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 406,
  },
  twoOptionContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  twoOptionText: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'normal',
  },
  twoOptionTextBold: {
    fontSize: 16,
    color: '#000',
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'center',
    fontStyle: 'normal',
  },
  twoOptionExplanation: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    width: '100%',
  },

  // Image viewer modal styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  imageModalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    zIndex: 10,
  },
  imageModalCloseButton: {
    padding: 4,
  },
  imageModalZoomControls: {
    flexDirection: 'row',
    gap: 12,
  },
  imageModalZoomButton: {
    padding: 4,
  },
  imageModalScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: Dimensions.get('window').height,
  },
  imageModalImage: {
    // Width and height set dynamically based on zoom
  },
});
