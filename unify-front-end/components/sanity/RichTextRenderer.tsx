import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import DropdownAccordion from '@/components/learn/DropdownAccordion';

interface RichTextRendererProps {
  blocks: any[];
  styles?: any;
}

export default function RichTextRenderer({ blocks, styles: customStyles }: RichTextRendererProps) {
  if (!blocks || !Array.isArray(blocks)) return null;

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
      marginLeft: 16,
    },
    number: {
      fontSize: 16,
      color: '#374151',
      lineHeight: 24,
      marginBottom: 8,
      marginLeft: 16,
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
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
      padding: 16,
      marginVertical: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    exampleBoxTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: '#374151',
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    tipBox: {
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
      padding: 16,
      marginVertical: 16,
      borderLeftWidth: 4,
      borderLeftColor: '#6B7280',
    },
    noteBox: {
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      padding: 16,
      marginVertical: 16,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
  };

  const mergedStyles = { ...defaultStyles, ...customStyles };

  const renderInlineText = (children: any[]) => {
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
            }
          });
        }
        
        return text;
      }

      return null;
    });
  };

  const renderBlock = (block: any, index: number) => {
    if (block._type === 'block') {
      // Handle list items first
      if (block.listItem) {
        const listStyle = block.listItem === 'bullet' ? mergedStyles.bullet : mergedStyles.number;
        const bullet = block.listItem === 'bullet' ? '•' : `${block.level || 1}.`;
        
        return (
          <View key={block._key || index} style={styles.listItemContainer}>
            <Text style={listStyle}>
              {bullet} {renderInlineText(block.children)}
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
              {renderInlineText(block.children)}
            </Text>
          );
        case 'h2':
          return (
            <Text key={block._key || index} style={mergedStyles.h2}>
              {renderInlineText(block.children)}
            </Text>
          );
        case 'h3':
          return (
            <Text key={block._key || index} style={mergedStyles.h3}>
              {renderInlineText(block.children)}
            </Text>
          );
        case 'h4':
          return (
            <Text key={block._key || index} style={mergedStyles.h4}>
              {renderInlineText(block.children)}
            </Text>
          );
        case 'blockquote':
          return (
            <View key={block._key || index} style={mergedStyles.blockquote}>
              <Text>
                {renderInlineText(block.children)}
              </Text>
            </View>
          );
        case 'code':
          return (
            <View key={block._key || index} style={mergedStyles.code}>
              <Text>
                {renderInlineText(block.children)}
              </Text>
            </View>
          );
        case 'normal':
        default:
          return (
            <Text key={block._key || index} style={mergedStyles.normal}>
              {renderInlineText(block.children)}
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
      const dropdownItems = [{
        id: block._key || index,
        title: block.label || 'Dropdown',
        body: typeof block.content === 'string' ? block.content : ''
      }];
      
      return (
        <View key={block._key || index} style={mergedStyles.dropdown}>
          <DropdownAccordion items={dropdownItems} />
        </View>
      );
    }

    if (block._type === 'example_box') {
      return (
        <View key={block._key || index} style={mergedStyles.exampleBox}>
          <Text style={mergedStyles.exampleBoxTitle}>EXAMPLE</Text>
          <Text>{renderInlineText(block.content)}</Text>
        </View>
      );
    }

    if (block._type === 'tip_box') {
      return (
        <View key={block._key || index} style={mergedStyles.tipBox}>
          <Text>{renderInlineText(block.content)}</Text>
        </View>
      );
    }

    if (block._type === 'note_box') {
      return (
        <View key={block._key || index} style={mergedStyles.noteBox}>
          <Text>{renderInlineText(block.content)}</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => renderBlock(block, index)).filter(Boolean)}
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
});
