import React from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import BackHeader from '@/components/BackHeader';

export default function PostSuccessModal({ visible, onClose, postTitle }: any) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType='none'
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <BackHeader title='' backIcon='x' onBack={onClose} />
        <View style={styles.content}>
          <Text style={styles.title}>Your post is up!</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
  },
  mascotPlaceholder: {
    width: '100%',
    height: 400,
    backgroundColor: '#D1D1D6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mascotText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
});
