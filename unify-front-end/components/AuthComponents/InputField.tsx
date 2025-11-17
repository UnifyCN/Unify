import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SimpleTextField } from './Components';

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  showValidIcon?: boolean;
  showPasswordToggle?: boolean;
  passwordVisible?: boolean;
  onTogglePassword?: () => void;
  error?: boolean;
  style?: any;
}

export function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  showValidIcon = false,
  showPasswordToggle = false,
  passwordVisible = false,
  onTogglePassword,
  error = false,
  style,
}: InputFieldProps) {
  return (
    <View style={{ position: 'relative' }}>
      <Text style={styles.label}>{label}</Text>
      <SimpleTextField
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        style={[styles.textField, error && { borderColor: '#f00' }, style]}
        secureTextEntry={secureTextEntry && !passwordVisible}
        autoCapitalize={autoCapitalize}
      />
      {showValidIcon && value && (
        <MaterialIcons
          name='check-circle'
          size={24}
          color='#333'
          style={styles.tickIcon}
        />
      )}
      {showPasswordToggle && (
        <TouchableOpacity
          onPress={onTogglePassword}
          style={styles.eyeIcon}
        >
          <MaterialIcons
            name={passwordVisible ? 'visibility' : 'visibility-off'}
            size={24}
            color='#333'
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '400',
    color: '#000',
    marginBottom: 6,
  },
  textField: {
    backgroundColor: '#fff',
    color: '#000',
    borderColor: '#ccc',
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,  
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  tickIcon: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
});
