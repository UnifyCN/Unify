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

interface SingleSelectQuestionProps {
  question: string;
  options: Option[];
  selectedValue: string | null;
  otherValue: string | null;
  onSelect: (value: string) => void;
  onOtherChange: (value: string) => void;
  required?: boolean;
  error?: string;
}

export default function SingleSelectQuestion({
  question,
  options,
  selectedValue,
  otherValue,
  onSelect,
  onOtherChange,
  required = false,
  error,
}: SingleSelectQuestionProps) {
  const selectedOption = options.find(opt => opt.value === selectedValue);
  const showOtherInput = selectedOption?.hasOther;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      {required && !selectedValue && error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <View style={styles.optionsContainer}>
        {options.map(option => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              selectedValue === option.value && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
          >
            <View style={styles.radioContainer}>
              <View
                style={[
                  styles.radio,
                  selectedValue === option.value && styles.radioSelected,
                ]}
              >
                {selectedValue === option.value && (
                  <View style={styles.radioInner} />
                )}
              </View>
              <Text
                style={[
                  styles.optionText,
                  selectedValue === option.value && styles.optionTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.borderInfoText,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Theme.primaryGatherRed,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.primaryGatherRed,
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
