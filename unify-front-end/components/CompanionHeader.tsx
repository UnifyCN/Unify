import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

interface CompanionHeaderProps {
  title?: string;
  onBack?: () => void;
  backIcon?: keyof typeof Feather.glyphMap;
  rightButton?: ReactNode;
  showBackButton?: boolean;
}

const CompanionHeader = ({
  title = '',
  onBack,
  backIcon = 'chevron-left',
  rightButton,
  showBackButton = true,
}: CompanionHeaderProps) => {
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
    <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
      {showBackButton ? (
        <TouchableOpacity onPress={handleBack}>
          <Feather name={backIcon} size={24} color='#000' />
        </TouchableOpacity>
      ) : (
        <View style={styles.placeholder} />
      )}
      <Text style={styles.title}>{title}</Text>
      {rightButton || <View style={styles.placeholder} />}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8, // Reduced from 20 to bring context text closer
    backgroundColor: Theme.white,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
  },
  placeholder: {
    width: 24, // To balance the back button size
  },
});

export default CompanionHeader;
