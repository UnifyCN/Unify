import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import DropdownAccordion from '@/components/learn/DropdownAccordion';

interface DropdownBlockProps {
  block: any;
  index: number;
}

export default function DropdownBlock({ block, index }: DropdownBlockProps) {
  // Check if we have the required fields for this dropdown structure
  if (!block.label || !block.content) {
    return null;
  }

  // Create a single dropdown item with the label as title and content as body
  const dropdownItems = [
    {
      id: block._key || `dropdown-${index}`,
      title: block.label,
      body: block.content,
    },
  ];

  return (
    <View key={block._key || index}>
      <DropdownAccordion 
        items={dropdownItems} 
        titleTextStyle={styles.closedTitle}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  closedTitle: {
    fontFamily: 'Font Family',
    fontWeight: '700',
    fontStyle: 'normal',
    fontSize: 14,
    lineHeight: 20,

    //if needed:
    //color: '#FFFFFF',
    //letterSpacing: 0,
  }
})