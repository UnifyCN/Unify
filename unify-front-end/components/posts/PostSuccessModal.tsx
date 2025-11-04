import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';

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
        <View style={styles.content}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name='x' size={24} color='black' />
          </TouchableOpacity>

          <Text style={styles.title}>Your post is up!</Text>

          <View style={styles.mascotPlaceholder}>
            <Text style={styles.mascotText}>🎉 mascot graphic 🎉</Text>
          </View>
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
    marginTop: 60,
    gap: 30,
  },
  closeButton: { 
    alignSelf: 'flex-start',
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
