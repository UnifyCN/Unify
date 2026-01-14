import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface StarterPromptsProps {
  onPromptSelect: (prompt: string, mode?: string) => void;
}

interface StarterChip {
  id: string;
  label: string;
  prompt: string;
  mode?: string;
  iconName: keyof typeof Feather.glyphMap;
}

const STARTER_CHIPS: StarterChip[] = [
  {
    id: 'fact_check',
    label: 'Fact Check',
    prompt: 'I heard that ',
    mode: 'fact_check',
    iconName: 'search',
  },
  {
    id: 'form_help',
    label: 'Form Help',
    prompt: '',
    mode: 'form_help',
    iconName: 'file-text',
  },
  {
    id: 'question',
    label: 'Ask Anything',
    prompt: '',
    mode: undefined,
    iconName: 'message-circle',
  },
];

export const StarterPrompts: React.FC<StarterPromptsProps> = ({
  onPromptSelect,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {STARTER_CHIPS.map((chip, index) => (
          <React.Fragment key={chip.id}>
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onPromptSelect(chip.prompt, chip.mode)}
              activeOpacity={0.7}
            >
              <Feather
                name={chip.iconName}
                size={18}
                color={Theme.textInput}
                style={styles.icon}
              />
              <Text style={styles.chipLabel}>{chip.label}</Text>
              <Feather
                name='chevron-right'
                size={18}
                color={Theme.textInput}
                style={styles.chevron}
              />
            </TouchableOpacity>
            {index < STARTER_CHIPS.length - 1 && (
              <View style={styles.divider} />
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    minHeight: 56,
  },
  icon: {
    marginRight: 12,
  },
  chipLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
    color: Theme.black,
    textAlign: 'left',
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginLeft: 50,
  },
});
