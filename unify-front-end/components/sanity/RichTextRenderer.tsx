// RichTextRenderer.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  TextInput,
  findNodeHandle,
  UIManager,
} from 'react-native';
import DropdownBlock from '@/components/sanity/DropdownBlock';
import { AlignJustify, AlignVerticalJustifyCenter } from 'lucide-react-native';

interface RichTextRendererProps {
  blocks: any[];
  styles?: any;
  markDefs?: any[];
  inputValues?: { [key: string]: string };
  onInputChange?: (fieldKey: string, value: string) => void;
  questionAnswers?: { [key: string]: string | string[] };
  onQuestionAnswer?: (questionKey: string, answer: string | string[]) => void;
  showQuestionFeedback?: boolean;
  scrollViewRef?: React.RefObject<any>;
  onInputFocus?: (y: number, height: number) => void;
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
  scrollViewRef,
  onInputFocus,
}: RichTextRendererProps) {
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
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0, // set your token here if not 0
      color: '#374151',
      marginBottom: 0,
    },

    // Lists
    bullet: {
      fontFamily: 'Font Family',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
      color: '#374151',
      marginBottom: 3,
      marginTop: 0,
    },
    number: {
      fontFamily: 'Font Family',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 14,
      lineHeight: 20,
      letterSpacing: 0,
      color: '#374151',
      marginBottom: 4,
    },

    strong: {
      fontFamily: 'Font Family',
      fontWeight: '700', // Semi-Bold
      fontStyle: 'normal',
      fontSize: 14,
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
      fontSize: 14,
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
      padding: 25,
      marginVertical: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 2,
      borderColor: '#C9C9C9',
    },
    exampleBoxTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#374151',
      marginBottom: 12,
      textTransform: 'uppercase',
    },
    exampleText: {
      fontFamily: 'Font Family',
      fontWeight: '400',
      fontStyle: 'normal',
      fontSize: 14,
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
      paddingVertical: 0,
      alignSelf: 'center',
      width: 353,
      maxWidth: '100%',
      minHeight: 40, // adaptable; grows with content
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
    noteBoxText: { fontSize: 15, color: '#3F3F3F', lineHeight: 22 },

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

  const renderBlock = (block: any, index: number, nestingLevel: number = 0) => {
    if (
      block._type === 'large_input_box' ||
      block._type === 'mid_input_box' ||
      block._type === 'small_input_box'
    ) {
    }

    if (block._type === 'block') {
      // Keep prev bullet/number behavior
      if (block.listItem) {
        const listStyle =
          block.listItem === 'bullet'
            ? mergedStyles.bullet
            : mergedStyles.number;
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

        return (
          <View
            key={block._key || index}
            style={[styles.listItemContainer, { marginLeft: indentLevel }]}
          >
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
          return (
            <Text key={block._key || index} style={blockStyle}>
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
            <Image source={{ uri: imageUrl }} style={mergedStyles.image} />
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

      let inputTextInputRef: TextInput | null = null;

      return (
        <View
          key={block._key || index}
          style={mergedStyles.inputFieldContainer}
        >
          <TextInput
            ref={(ref) => {
              inputTextInputRef = ref;
            }}
            style={[
              {
                borderWidth: 1,
                borderColor: '#9CA3AF',
                borderRadius: 8,
                paddingHorizontal: 20,
                paddingVertical: 20,
                fontSize: 16,
                backgroundColor: '#fff',
                minHeight: 44,
                marginBottom: 30,
              },
              isLarge && { height: 300, textAlignVertical: 'top' },
              isMid && { height: 150, textAlignVertical: 'top' },
              isSmall && { height: 80 },
            ]}
            placeholder={(block.placeholder = 'Type Here')}
            value={inputValues[block._key] || ''}
            onChangeText={value => onInputChange?.(block._key, value)}
            multiline={isLarge}
            numberOfLines={isLarge ? 4 : 1}
            onFocus={() => {
              // Measure the actual TextInput position relative to ScrollView
              if (inputTextInputRef && scrollViewRef?.current) {
                const scrollViewHandle = findNodeHandle(scrollViewRef.current);
                const textInputHandle = findNodeHandle(inputTextInputRef);
                if (scrollViewHandle && textInputHandle) {
                  // Use UIManager.measureLayout for proper native component measurement
                  UIManager.measureLayout(
                    textInputHandle,
                    scrollViewHandle,
                    () => {
                      // Error callback - fallback to measure
                      inputTextInputRef?.measure((x, y, width, height, pageX, pageY) => {
                        // Try to get ScrollView position to calculate relative Y
                        if (scrollViewRef.current) {
                          const scrollViewHandle = findNodeHandle(scrollViewRef.current);
                          if (scrollViewHandle) {
                            // Measure ScrollView position
                            (scrollViewRef.current as any).measure?.((sx: number, sy: number, sw: number, sh: number, spx: number, spy: number) => {
                              const relativeY = pageY - spy;
                              onInputFocus?.(relativeY, height);
                            });
                          } else {
                            // Last resort: use pageY (absolute position)
                            onInputFocus?.(pageY, height);
                          }
                        } else {
                          onInputFocus?.(pageY, height);
                        }
                      });
                    },
                    (x, y, width, height) => {
                      // Success callback - y is now relative to ScrollView content
                      // y is the top of the TextInput relative to ScrollView content
                      onInputFocus?.(y, height);
                    }
                  );
                } else if (inputTextInputRef) {
                  // Fallback if handles can't be obtained
                  inputTextInputRef.measure((x, y, width, height, pageX, pageY) => {
                    onInputFocus?.(pageY, height);
                  });
                }
              } else if (inputTextInputRef) {
                // Fallback if no scrollViewRef provided
                inputTextInputRef.measure((x, y, width, height, pageX, pageY) => {
                  onInputFocus?.(pageY, height);
                });
              }
            }}
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

  return (
    <View style={styles.container}>
      {blocks
        .map((block, index) => (
          <React.Fragment key={block._key || index}>
            {renderBlock(block, index, nestingLevels[block._key || index] || 0)}
          </React.Fragment>
        ))
        .filter(Boolean)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listItemContainer: { marginBottom: 4 },
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
});
