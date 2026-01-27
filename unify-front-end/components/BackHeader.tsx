import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
interface BackHeaderProps {
  title?: string;
  onBack?: () => void;
  backIcon?: keyof typeof Feather.glyphMap;
  rightButton?: ReactNode;
  showBackButton?: boolean;
}

const BackHeader = ({
  title = '',
  onBack,
  backIcon = 'chevron-left',
  rightButton,
  showBackButton = true,
}: BackHeaderProps) => {
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
          <Feather name={backIcon} size={26} color='#000' />
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
    padding: 20,
    backgroundColor: Theme.white,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
  },
  placeholder: {
    width: 26, // To balance the back button size
  },
});

export default BackHeader;
