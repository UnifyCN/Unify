import React from 'react';
import { View } from 'react-native';
import DropdownAccordion from '@/components/learn/DropdownAccordion';

interface DropdownBlockProps {
  block: any;
  index: number;
}

export default function DropdownBlock({ block, index }: DropdownBlockProps) {
  if (!block.items || !Array.isArray(block.items)) {
    return null;
  }

  const dropdownItems = block.items.map((item: any) => ({
    title: item.title || '',
    body: item.body || [],
  }));

  return (
    <View key={block._key || index}>
      <DropdownAccordion items={dropdownItems} />
    </View>
  );
}
