import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Linking, TextInput } from 'react-native';
import DropdownBlock from '@/components/sanity/DropdownBlock';

interface RichTextRendererProps {
  blocks: any[];
  styles?: any;
  markDefs?: any[];
  inputValues?: { [key: string]: string };
  onInputChange?: (fieldKey: string, value: string) => void;
}

export default function RichTextRenderer({ blocks, styles: customStyles, markDefs, inputValues = {}, onInputChange }: RichTextRendererProps) {
  if (!blocks || !Array.isArray(blocks)) return null;

  // Create numbering map for ordered lists
  const createNumberingMap = (blocks: any[]) => {
    const numberingMap: { [key: string]: number } = {};
    let currentNumber = 1;
    let inOrderedList = false;

    blocks.forEach((block, index) => {
      if (block._type === 'block' && block.listItem === 'number') {
        if (!inOrderedList) {
          currentNumber = 1; // Reset when starting a new ordered list
          inOrderedList = true;
        }
        numberingMap[block._key || index] = currentNumber;
        currentNumber++;
      } else if (block._type === 'block' && !block.listItem) {
        // Reset when we hit a non-list block
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
      marginBottom: 16,
      marginTop: 24,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600',
      color: '#000',
      marginBottom: 14,
      marginTop: 20,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600',
      color: '#000',
      marginBottom: 12,
      marginTop: 16,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600',
      color: '#000',
      marginBottom: 10,
      marginTop: 14,
    },
    // Paragraphs
    normal: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
      marginBottom: 12,
    },
    // Lists
    bullet: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
      marginBottom: 8,
    },
    number: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
      marginBottom: 8,
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
      marginBottom: 12,
    },
    // Image
    image: {
      width: '100%',
      height: 200,
      borderRadius: 12,
      marginVertical: 16,
    },
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
    dropdown: {
      marginVertical: 16,
    },
    exampleBox: {
      backgroundColor: '#EAEAEA',
      borderRadius: 8,
      padding: 16,
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
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    tipBox: {
      borderRadius: 0,
      paddingLeft: 16,
      marginVertical: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#374151',
    },
    noteBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      paddingHorizontal: 15,
      paddingVertical: 14,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: '#3F3F3F',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    // Links
    link: {
      color: '#2563EB',
      textDecorationLine: 'underline',
    },
  };

  const mergedStyles = { ...defaultStyles, ...customStyles };

  // Function to calculate nesting levels for list items
  const calculateNestingLevels = (blocks: any[]) => {
    const nestingMap: { [key: string]: number } = {};
    let currentNesting = 0;
    let listStack: string[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      
      if (block._type === 'block' && block.listItem) {
        // Check if this is a nested list item by looking at the level property
        const level = block.level || 0;
        nestingMap[block._key || i] = level;
        currentNesting = level;
      } else {
        // Non-list item, reset nesting
        currentNesting = 0;
        listStack = [];
      }
    }
    
    return nestingMap;
  };

  const renderInlineText = (children: any[], markDefs?: any[]) => {
    if (!children || !Array.isArray(children)) return null;

    return children.map((child, index) => {
      if (typeof child === 'string') {
        return child;
      }

      if (child._type === 'span') {
        let text = child.text || '';
        
        // Apply text marks
        if (child.marks) {
          child.marks.forEach((mark: string) => {
            switch (mark) {
              case 'strong':
                text = <Text key={index} style={{ fontWeight: '700' }}>{text}</Text>;
                break;
              case 'em':
                text = <Text key={index} style={{ fontStyle: 'italic' }}>{text}</Text>;
                break;
              case 'code':
                text = <Text key={index} style={{ 
                  fontFamily: 'monospace', 
                  backgroundColor: '#F3F4F6', 
                  paddingHorizontal: 4,
                  borderRadius: 2 
                }}>{text}</Text>;
                break;
              case 'underline':
                text = <Text key={index} style={{ textDecorationLine: 'underline' }}>{text}</Text>;
                break;
              case 'strike-through':
                text = <Text key={index} style={{ textDecorationLine: 'line-through' }}>{text}</Text>;
                break;
              case 'link':
                // Handle links - find the markDef for this link
                const linkDef = markDefs?.find(def => def._key === mark);
                if (linkDef && linkDef.href) {
                  const handleLinkPress = () => {
                    Linking.openURL(linkDef.href);
                  };
                  text = (
                    <TouchableOpacity key={index} onPress={handleLinkPress}>
                      <Text style={mergedStyles.link}>{text}</Text>
                    </TouchableOpacity>
                  );
                }
                break;
            }
          });
        }
        
        return text;
      }

      return null;
    });
  };

  const renderBlock = (block: any, index: number, nestingLevel: number = 0) => {
    // Debug logging for input boxes
    if (block._type === 'large_input_box' || block._type === 'mid_input_box' || block._type === 'small_input_box') {
    }
    
    if (block._type === 'block') {
      // Handle list items first
      if (block.listItem) {
        const listStyle = block.listItem === 'bullet' ? mergedStyles.bullet : mergedStyles.number;
        const bullet = block.listItem === 'bullet' 
          ? '•' 
          : `${numberingMap[block._key || index] || 1}.`;
        
        // Calculate indentation based on nesting level
        const indentLevel = nestingLevel * 20; // 20px per nesting level
        
        // Use different bullet styles for different nesting levels
        let displayBullet = bullet;
        if (block.listItem === 'bullet') {
          if (nestingLevel === 1) {
            displayBullet = '•';
          } else if (nestingLevel === 2) {
            displayBullet = '◦';
          } else if (nestingLevel === 3) {
            displayBullet = '▪';
          } else {
            displayBullet = '▫';
          }
        }
        
        return (
          <View key={block._key || index} style={[styles.listItemContainer, { marginLeft: indentLevel }]}>
            <Text style={listStyle}>
              {displayBullet} {renderInlineText(block.children, markDefs)}
            </Text>
          </View>
        );
      }

      const style = block.style || 'normal';
      
      // Handle different block styles
      switch (style) {
        case 'h1':
          return (
            <Text key={block._key || index} style={mergedStyles.h1}>
              {renderInlineText(block.children, markDefs)}
            </Text>
          );
        case 'h2':
          return (
            <Text key={block._key || index} style={mergedStyles.h2}>
              {renderInlineText(block.children, markDefs)}
            </Text>
          );
        case 'h3':
          return (
            <Text key={block._key || index} style={mergedStyles.h3}>
              {renderInlineText(block.children, markDefs)}
            </Text>
          );
        case 'h4':
          return (
            <Text key={block._key || index} style={mergedStyles.h4}>
              {renderInlineText(block.children, markDefs)}
            </Text>
          );
        case 'blockquote':
          return (
            <View key={block._key || index} style={mergedStyles.blockquote}>
              <Text>
                {renderInlineText(block.children, markDefs)}
              </Text>
            </View>
          );
        case 'code':
          return (
            <View key={block._key || index} style={mergedStyles.code}>
              <Text>
                {renderInlineText(block.children, markDefs)}
              </Text>
            </View>
          );
        case 'normal':
        default:
          return (
            <Text key={block._key || index} style={mergedStyles.normal}>
              {renderInlineText(block.children, markDefs)}
            </Text>
          );
      }
    }

    if (block._type === 'image') {
      const imageUrl = block.asset?._ref 
        ? `https://cdn.sanity.io/images/fercgabp/production/${block.asset._ref.replace('image-', '').replace('-jpg', '.jpg').replace('-png', '.png').replace('-webp', '.webp')}`
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


    // Handle special block types
    if (block._type === 'dropdown') {
      return (
        <DropdownBlock block={block} index={index} />
      );
    }

    if (block._type === 'example_box') {
      return (
        <View key={block._key || index} style={mergedStyles.exampleBox}>
          <Text style={mergedStyles.exampleBoxTitle}>EXAMPLE</Text>
          <RichTextRenderer blocks={block.content || []} markDefs={markDefs} />
        </View>
      );
    }

    if (block._type === 'tip_box') {
      return (
        <View key={block._key || index} style={mergedStyles.tipBox}>
          <RichTextRenderer blocks={block.content || []} markDefs={markDefs} />
        </View>
      );
    }

    if (block._type === 'note_box') {
      return (
        <View key={block._key || index} style={mergedStyles.noteBox}>
          <RichTextRenderer blocks={block.content || []} markDefs={markDefs} />
        </View>
      );
    }

    // Handle input box types
    if (block._type === 'large_input_box' || block._type === 'mid_input_box' || block._type === 'small_input_box') {
      const isLarge = block._type === 'large_input_box';
      const isMid = block._type === 'mid_input_box';
      const isSmall = block._type === 'small_input_box';
      
      return (
        <View key={block._key || index} style={mergedStyles.inputFieldContainer}>
          {block.label && (
            <Text style={mergedStyles.inputLabel}>{block.label}</Text>
          )}
          <TextInput
            style={[
              {
                borderWidth: 1,
                borderColor: '#9CA3AF',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 16,
                backgroundColor: '#fff',
                minHeight: 44,
                marginBottom: 30,
              },
              isLarge && { height: 300, textAlignVertical: 'top' },
              isMid && { height: 150, textAlignVertical: 'top' },
              isSmall && { height: 80 },
            ]}
            placeholder={block.placeholder || (isLarge ? 'Enter your response here...' : 'Type here...')}
            value={inputValues[block._key] || ''}
            onChangeText={(value) => onInputChange?.(block._key, value)}
            multiline={isLarge}
            numberOfLines={isLarge ? 4 : 1}
          />
        </View>
      );
    }

    return null;
  };

  // Calculate nesting levels for all blocks
  const nestingLevels = calculateNestingLevels(blocks);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => renderBlock(block, index, nestingLevels[block._key || index] || 0)).filter(Boolean)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listItemContainer: {
    marginBottom: 8,
  },
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
  smallInput: {
    height: 100,
    borderWidth: 2,
    borderColor: '#9CA3AF',
  },
});
