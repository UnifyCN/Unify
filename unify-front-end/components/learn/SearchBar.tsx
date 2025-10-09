import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = { placeholder?: string; onFilterPress?: () => void };

export default function SearchBar({ placeholder = 'Search', onFilterPress }: Props) {
  return (
    <View style={styles.container}>
      <Feather name='search' size={18} color='#9f9d9d' />
      <Text style={styles.placeholder}>{placeholder}</Text>
      <View style={{ flex: 1 }} />
      <Pressable onPress={onFilterPress} style={styles.filterButton} android_ripple={{ color: '#e6e6e6' }}>
        <View style={styles.barLong} />
        <View style={styles.barMid} />
        <View style={styles.barShort} />
      </Pressable>
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
  filterButton: {
    width: 34,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 6,
  },
  barLong: {
    width: 20,
    height: 2.2,
    borderRadius: 2,
    backgroundColor: '#bfbfbf',
    marginBottom: 4,
  },
  barMid: {
    width: 13,
    height: 2.2,
    borderRadius: 2,
    backgroundColor: '#bfbfbf',
    marginBottom: 4,
  },
  barShort: {
    width: 7,
    height: 2.2,
    borderRadius: 2,
    backgroundColor: '#bfbfbf',
  },
});
