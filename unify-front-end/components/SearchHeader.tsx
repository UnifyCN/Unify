import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

interface SearchHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export const SearchHeader = ({
  title = 'Search',
  showBackButton = true,
}: SearchHeaderProps) => {
  return (
    <View style={styles.header}>
      {showBackButton ? (
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color='#000' />
        </TouchableOpacity>
      ) : (
        <View style={styles.spacer} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
    maxWidth: 40,
  },
});
