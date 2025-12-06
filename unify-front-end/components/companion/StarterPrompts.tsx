import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

interface StarterPromptsProps {
  onPromptSelect: (prompt: string, mode?: string) => void;
}

interface StarterChip {
  id: string;
  label: string;
  prompt: string;
  mode?: string;
  color: string;
}

const STARTER_CHIPS: StarterChip[] = [
  {
    id: 'fact_check',
    label: 'Fact Check',
    prompt: 'I heard that ',
    mode: 'fact_check',
    color: '#E3F2FD', // Light Blue
  },
  {
    id: 'form_help',
    label: 'Form Help',
    prompt: '',
    mode: 'form_help',
    color: '#F3E5F5', // Light Purple
  },
  {
    id: 'question',
    label: 'Ask Anything',
    prompt: '',
    mode: undefined,
    color: '#FFF3E0', // Light Orange
  },
];

export const StarterPrompts: React.FC<StarterPromptsProps> = ({
  onPromptSelect,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <Text style={styles.subtitle}>
          Choose an option or type your question below
        </Text>

        <View style={styles.chipsContainer}>
          {STARTER_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.id}
              style={[styles.chip, { backgroundColor: chip.color }]}
              onPress={() => onPromptSelect(chip.prompt, chip.mode)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipLabel}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  contentWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  subtitle: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.black,
    textAlign: 'center',
  },
});
