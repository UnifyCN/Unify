import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import { Theme } from '@/constants/Theme';

interface Option {
  value: string;
  label: string;
  hasOther?: boolean;
}

interface MultiSelectQuestionProps {
  question: string;
  options: Option[];
  selectedValues: string[];
  otherValue: string | null;
  onToggle: (value: string) => void;
  onOtherChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export default function MultiSelectQuestion({
  question,
  options,
  selectedValues,
  otherValue,
  onToggle,
  onOtherChange,
  required = false,
  error,
}: MultiSelectQuestionProps) {
  const otherOption = options.find(opt => opt.hasOther);
  const showOtherInput =
    otherOption && selectedValues.includes(otherOption.value);

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      {required && selectedValues.length === 0 && error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <View style={styles.optionsContainer}>
        {options.map(option => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.option, isSelected && styles.optionSelected]}
              onPress={() => onToggle(option.value)}
            >
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    isSelected && styles.checkboxSelected,
                  ]}
                >
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {showOtherInput && (
        <View style={styles.otherInputContainer}>
          <TextInput
            style={styles.otherInput}
            placeholder='Please specify...'
            value={otherValue || ''}
            onChangeText={onOtherChange}
            placeholderTextColor={Theme.textInput}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#f00',
    marginBottom: 16,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    backgroundColor: Theme.white,
  },
  optionSelected: {
    borderColor: Theme.primaryGatherRed,
    backgroundColor: '#FFF5F3',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Theme.borderInfoText,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: Theme.primaryGatherRed,
    backgroundColor: Theme.primaryGatherRed,
  },
  checkmark: {
    color: Theme.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionText: {
    fontSize: 16,
    color: Theme.black,
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: '600',
  },
  otherInputContainer: {
    marginTop: 16,
  },
  otherInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    backgroundColor: Theme.white,
    fontSize: 16,
    color: Theme.black,
  },
});
