import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface StarterPromptsProps {
  onPromptSelect: (prompt: string, mode?: string) => void;
}

interface StarterCard {
  id: string;
  label: string;
  prompt: string;
  mode?: string;
  iconName: keyof typeof Feather.glyphMap;
  iconBackground: string;
  description: string;
}

const STARTER_CARDS: StarterCard[] = [
  {
    id: 'question',
    label: 'Ask Anything',
    prompt: '',
    mode: undefined,
    iconName: 'message-circle',
    iconBackground: '#E3A0C9',
    description: 'Get answers to any immigration question.',
  },
  {
    id: 'fact_check',
    label: 'Fact Check',
    prompt: 'I heard that ',
    mode: 'fact_check',
    iconName: 'search',
    iconBackground: '#4F7BCB',
    description: "Verify info you've heard or read.",
  },
  {
    id: 'form_help',
    label: 'Form Help',
    prompt: '',
    mode: 'form_help',
    iconName: 'file-text',
    iconBackground: '#F0A04B',
    description: 'Step-by-step guidance on any form.',
  },
];

export const StarterPrompts: React.FC<StarterPromptsProps> = ({
  onPromptSelect,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STARTER_CARDS.map(card => (
          <TouchableOpacity
            key={card.id}
            style={styles.card}
            onPress={() => onPromptSelect(card.prompt, card.mode)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: card.iconBackground },
                ]}
              >
                <Feather name={card.iconName} size={16} color={Theme.white} />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Feather
                name='chevron-right'
                size={16}
                color={Theme.textInactiveTab}
              />
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>
              {card.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: Theme.white,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingRight: 32,
  },
  card: {
    width: 170,
    minHeight: 108,
    backgroundColor: Theme.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    padding: 12,
    marginRight: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  cardLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Theme.black,
  },
  cardDescription: {
    marginTop: 10,
    fontSize: 12,
    color: Theme.textInput,
    lineHeight: 16,
  },
});
