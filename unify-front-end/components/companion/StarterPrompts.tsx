import React, { useMemo } from 'react';
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
  personalizedStarters?: string[];
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

// Original mode-based cards (Ask Anything, Fact Check, Form Help)
const MODE_CARDS: StarterCard[] = [
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

// Topic-based starter prompts organized by immigration category
const TOPIC_STARTERS: StarterCard[] = [
  // Express Entry
  {
    id: 'ee_eligibility',
    label: 'Express Entry',
    prompt: 'Am I eligible for Express Entry? What are the requirements?',
    iconName: 'award',
    iconBackground: '#5C6BC0',
    description: 'Check Express Entry eligibility.',
  },
  {
    id: 'ee_crs',
    label: 'CRS Score',
    prompt: 'How is the CRS score calculated for Express Entry?',
    iconName: 'bar-chart-2',
    iconBackground: '#5C6BC0',
    description: 'Understand CRS point breakdown.',
  },
  {
    id: 'ee_rounds',
    label: 'Recent Draws',
    prompt: 'What were the most recent Express Entry draw scores?',
    iconName: 'trending-up',
    iconBackground: '#5C6BC0',
    description: 'Latest invitation round details.',
  },
  // Study Permits
  {
    id: 'sp_apply',
    label: 'Study Permit',
    prompt: 'How do I apply for a Canadian study permit?',
    iconName: 'book-open',
    iconBackground: '#26A69A',
    description: 'Study permit application steps.',
  },
  {
    id: 'sp_pgwp',
    label: 'After Graduation',
    prompt: 'How do I get a post-graduation work permit (PGWP)?',
    iconName: 'briefcase',
    iconBackground: '#26A69A',
    description: 'PGWP eligibility and process.',
  },
  // Work Permits
  {
    id: 'wp_types',
    label: 'Work Permits',
    prompt: 'What types of work permits are available in Canada?',
    iconName: 'tool',
    iconBackground: '#EF5350',
    description: 'Compare open vs employer-specific.',
  },
  {
    id: 'wp_lmia',
    label: 'LMIA Process',
    prompt: 'What is an LMIA and when do I need one?',
    iconName: 'clipboard',
    iconBackground: '#EF5350',
    description: 'Labour market impact assessment.',
  },
  // Citizenship
  {
    id: 'cit_eligibility',
    label: 'Citizenship',
    prompt: 'What are the requirements to become a Canadian citizen?',
    iconName: 'flag',
    iconBackground: '#E3A0C9',
    description: 'Citizenship eligibility check.',
  },
  {
    id: 'cit_test',
    label: 'Citizenship Test',
    prompt: 'What should I study for the Canadian citizenship test?',
    iconName: 'edit-3',
    iconBackground: '#E3A0C9',
    description: 'Test prep and study guide.',
  },
  // Settlement
  {
    id: 'settle_health',
    label: 'Healthcare',
    prompt: 'How does healthcare work for newcomers to Canada?',
    iconName: 'heart',
    iconBackground: '#66BB6A',
    description: 'Provincial health coverage info.',
  },
  {
    id: 'settle_services',
    label: 'Newcomer Help',
    prompt: 'What free settlement services are available for newcomers?',
    iconName: 'users',
    iconBackground: '#66BB6A',
    description: 'Free support for new arrivals.',
  },
];

/**
 * Selects a random subset of topic starters, ensuring variety across categories.
 * Returns 3 topic cards from different icon backgrounds (categories).
 */
const selectRandomStarters = (): StarterCard[] => {
  // Group by category (using iconBackground as proxy)
  const categories = new Map<string, StarterCard[]>();
  TOPIC_STARTERS.forEach(card => {
    const existing = categories.get(card.iconBackground) || [];
    existing.push(card);
    categories.set(card.iconBackground, existing);
  });

  const selected: StarterCard[] = [];
  const categoryKeys = Array.from(categories.keys());

  // Shuffle categories
  for (let i = categoryKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categoryKeys[i], categoryKeys[j]] = [categoryKeys[j], categoryKeys[i]];
  }

  // Pick one random card from each category until we have 3
  for (const key of categoryKeys) {
    if (selected.length >= 3) break;
    const cards = categories.get(key)!;
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    selected.push(randomCard);
  }

  return selected;
};

export const StarterPrompts: React.FC<StarterPromptsProps> = ({
  onPromptSelect,
  personalizedStarters,
}) => {
  // Select random topic starters once on mount
  const topicStarters = useMemo(() => selectRandomStarters(), []);

  // Combine: mode cards first, then topic starters
  const allCards = useMemo(
    () => [...MODE_CARDS, ...topicStarters],
    [topicStarters]
  );

  return (
    <View style={styles.container}>
      {personalizedStarters && personalizedStarters.length > 0 && (
        <View style={styles.personalizedContainer}>
          {personalizedStarters.map((starter, index) => (
            <TouchableOpacity
              key={`personalized-${index}`}
              style={styles.personalizedCard}
              onPress={() => onPromptSelect(starter)}
              activeOpacity={0.8}
            >
              <Text style={styles.personalizedText} numberOfLines={2}>
                {starter}
              </Text>
              <Feather
                name='arrow-up-right'
                size={14}
                color={Theme.surfaceBlue}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {allCards.map(card => (
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
  personalizedContainer: {
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 8,
  },
  personalizedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4F7BCB40',
    backgroundColor: '#4F7BCB08',
    gap: 8,
  },
  personalizedText: {
    flex: 1,
    fontSize: 14,
    color: Theme.black,
    lineHeight: 19,
  },
});
