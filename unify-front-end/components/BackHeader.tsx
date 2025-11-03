import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
interface BackHeaderProps {
  title: string;
  onBack?: () => void;
  backIcon?: keyof typeof Feather.glyphMap;
}

const BackHeader = ({ title = '', onBack, backIcon = 'chevron-left' }: BackHeaderProps) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
      <TouchableOpacity onPress={handleBack}>
        <Feather name={backIcon} size={24} color='#000' />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.placeholder} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 24, // To balance the back button size
  },
});

export default BackHeader;
