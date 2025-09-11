import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = { placeholder?: string };

export default function SearchBar({ placeholder = 'Search' }: Props) {
  return (
    <View style={styles.container}>
      <Feather name='search' size={18} color='#9f9d9d' />
      <Text style={styles.placeholder}>{placeholder}</Text>
      <View style={{ flex: 1 }} />
      <Feather name='sliders' size={18} color='#9f9d9d' />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },
  placeholder: {
    marginLeft: 8,
    color: '#9f9d9d',
    fontSize: 15,
  },
});
