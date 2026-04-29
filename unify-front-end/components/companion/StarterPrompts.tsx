// components/companion/StarterPrompts.tsx
import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import type { PersonalizedStarter } from '@/hooks/companion/usePersonalizedStarters';
import {
  getSeenStarterIds,
  markStarterSeen,
  clearSeenStarterIds,
} from '@/utils/companionStarterHistory';

interface StarterPromptsProps {
  onPromptSelect: (
    prompt: string,
    mode?: string,
    isPersonalized?: boolean
  ) => void;
  personalizedStarters?: PersonalizedStarter[];
}

interface StaticCard {
  id: string;
  label: string;
  prompt: string;
  mode?: string;
  iconName: keyof typeof Feather.glyphMap;
  iconBackground: string;
  description: string;
}

const MODE_CARDS: StaticCard[] = [
  { id: 'fact_check', label: 'Fact Check', prompt: 'I heard that ', mode: 'fact_check',
    iconName: 'search', iconBackground: '#4F7BCB',
    description: "Verify info you've heard or read." },
  { id: 'form_help', label: 'Form Help', prompt: '', mode: 'form_help',
    iconName: 'file-text', iconBackground: '#F0A04B',
    description: 'Step-by-step guidance on any form.' },
];

const TOPIC_STARTERS: StaticCard[] = [
  { id: 'ee_eligibility', label: 'Express Entry', prompt: 'Am I eligible for Express Entry? What are the requirements?',
    iconName: 'award', iconBackground: '#5C6BC0', description: 'Check Express Entry eligibility.' },
  { id: 'ee_crs', label: 'CRS Score', prompt: 'How is the CRS score calculated for Express Entry?',
    iconName: 'bar-chart-2', iconBackground: '#5C6BC0', description: 'Understand CRS point breakdown.' },
  { id: 'ee_rounds', label: 'Recent Draws', prompt: 'What were the most recent Express Entry draw scores?',
    iconName: 'trending-up', iconBackground: '#5C6BC0', description: 'Latest invitation round details.' },
  { id: 'sp_apply', label: 'Study Permit', prompt: 'How do I apply for a Canadian study permit?',
    iconName: 'book-open', iconBackground: '#26A69A', description: 'Study permit application steps.' },
  { id: 'sp_pgwp', label: 'After Graduation', prompt: 'How do I get a post-graduation work permit (PGWP)?',
    iconName: 'briefcase', iconBackground: '#26A69A', description: 'PGWP eligibility and process.' },
  { id: 'wp_types', label: 'Work Permits', prompt: 'What types of work permits are available in Canada?',
    iconName: 'tool', iconBackground: '#EF5350', description: 'Compare open vs employer-specific.' },
  { id: 'wp_lmia', label: 'LMIA Process', prompt: 'What is an LMIA and when do I need one?',
    iconName: 'clipboard', iconBackground: '#EF5350', description: 'Labour market impact assessment.' },
  { id: 'cit_eligibility', label: 'Citizenship', prompt: 'What are the requirements to become a Canadian citizen?',
    iconName: 'flag', iconBackground: '#E3A0C9', description: 'Citizenship eligibility check.' },
  { id: 'cit_test', label: 'Citizenship Test', prompt: 'What should I study for the Canadian citizenship test?',
    iconName: 'edit-3', iconBackground: '#E3A0C9', description: 'Test prep and study guide.' },
  { id: 'settle_health', label: 'Healthcare', prompt: 'How does healthcare work for newcomers to Canada?',
    iconName: 'heart', iconBackground: '#66BB6A', description: 'Provincial health coverage info.' },
  { id: 'settle_services', label: 'Newcomer Help', prompt: 'What free settlement services are available for newcomers?',
    iconName: 'users', iconBackground: '#66BB6A', description: 'Free support for new arrivals.' },
];

const selectRandomTopicStarters = (): StaticCard[] => {
  const categories = new Map<string, StaticCard[]>();
  TOPIC_STARTERS.forEach(card => {
    const existing = categories.get(card.iconBackground) || [];
    existing.push(card);
    categories.set(card.iconBackground, existing);
  });

  const selected: StaticCard[] = [];
  const categoryKeys = Array.from(categories.keys());
  for (let i = categoryKeys.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [categoryKeys[i], categoryKeys[j]] = [categoryKeys[j], categoryKeys[i]];
  }
  for (const key of categoryKeys) {
    if (selected.length >= 3) break;
    const cards = categories.get(key)!;
    selected.push(cards[Math.floor(Math.random() * cards.length)]);
  }
  return selected;
};

const EMPTY_POOL: PersonalizedStarter[] = [];
const VISIBLE_SLOTS = 3;

function pickInitial(
  pool: PersonalizedStarter[],
  seen: Set<string>
): PersonalizedStarter[] {
  if (pool.length === 0) return [];
  // Render up to VISIBLE_SLOTS unseen chips. When fewer unseen remain than
  // slots, the personalized section shrinks gracefully — the user sees a 1-
  // or 2-chip section signalling they've explored most of their personalized
  // prompts. The mount-time effect resets `seen` only when zero unseen remain,
  // so we never need to fall back to seen entries here.
  return pool.filter(s => !seen.has(s.id)).slice(0, VISIBLE_SLOTS);
}

function pickReplacement(
  pool: PersonalizedStarter[],
  displayedIds: Set<string>,
  seen: Set<string>,
  tappedId: string
): PersonalizedStarter | null {
  if (pool.length === 0) return null;
  const isCandidate = (s: PersonalizedStarter) =>
    !displayedIds.has(s.id) && !seen.has(s.id) && s.id !== tappedId;

  let next = pool.find(isCandidate);
  if (next) return next;

  // Exhausted relative to seen — caller should clear seen storage; here pick from pool excluding displayed + tapped.
  next = pool.find(s => !displayedIds.has(s.id) && s.id !== tappedId);
  return next ?? null;
}

export const StarterPrompts: React.FC<StarterPromptsProps> = ({
  onPromptSelect,
  personalizedStarters,
}) => {
  const topicStarters = useMemo(() => selectRandomTopicStarters(), []);
  // Stable pool ref: same array reference unless the input genuinely changed.
  // personalizedStarters from React Query is referentially stable across renders
  // when data hasn't changed, so this useMemo only re-fires on real updates.
  const pool = useMemo(
    () => personalizedStarters ?? EMPTY_POOL,
    [personalizedStarters]
  );
  const [displayed, setDisplayed] = useState<PersonalizedStarter[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  // Hydrate seenIds + initial 3 whenever the pool changes (mount, profile edit, etc.).
  useEffect(() => {
    if (pool.length === 0) {
      setDisplayed([]);
      return;
    }
    let cancelled = false;
    (async () => {
      let seen = await getSeenStarterIds();
      // Reset seen history only when the user has tapped through the entire
      // pool — otherwise a partial reset would resurface chips they tapped
      // recently. When unseen is between 1 and VISIBLE_SLOTS-1 we render
      // fewer chips rather than padding the slots with already-tapped ones.
      const hasUnseen = pool.some(s => !seen.has(s.id));
      if (!hasUnseen) {
        await clearSeenStarterIds();
        seen = new Set();
      }
      if (cancelled) return;
      seenIdsRef.current = seen;
      setDisplayed(pickInitial(pool, seen));
    })();
    return () => {
      cancelled = true;
    };
  }, [pool]);

  const handlePersonalizedPress = useCallback(
    (starter: PersonalizedStarter, slotIndex: number) => {
      onPromptSelect(starter.prompt, undefined, true);

      // Persist; fire-and-forget. Concurrent calls are safe — markStarterSeen
      // serializes its own read-modify-write internally.
      void markStarterSeen(starter.id);
      seenIdsRef.current.add(starter.id);

      // Compute the replacement against the COMMITTED current displayed state
      // inside the updater. Reading `displayed` from a stale closure here would
      // race when the user taps two chips in rapid succession — both handlers
      // would see the same pre-tap state and could pick the same replacement,
      // leaving the same chip in two slots after both updates land.
      setDisplayed(current => {
        const displayedIds = new Set(current.map(s => s.id));
        let next = pickReplacement(
          pool,
          displayedIds,
          seenIdsRef.current,
          starter.id
        );

        if (!next) {
          const fallback = pool.find(
            s => !displayedIds.has(s.id) && s.id !== starter.id
          );
          if (fallback) {
            // Pool exhausted relative to seen — reset history. Both side
            // effects are idempotent so they remain safe under React strict-
            // mode double invocation of the updater.
            seenIdsRef.current = new Set();
            void clearSeenStarterIds();
            next = fallback;
          }
        }

        if (!next) return current; // pool too small to swap; leave chip in place.

        const copy = [...current];
        copy[slotIndex] = next;
        return copy;
      });
    },
    [pool, onPromptSelect]
  );

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {displayed.map((starter, index) => (
          <View key={starter.id}>
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <TouchableOpacity
                style={[styles.card, styles.cardPersonalized]}
                onPress={() => handlePersonalizedPress(starter, index)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBadge, { backgroundColor: starter.iconBackground }]}>
                    <Feather name={starter.iconName as keyof typeof Feather.glyphMap} size={16} color={Theme.white} />
                  </View>
                  <Text style={styles.cardLabel} numberOfLines={1}>{starter.category}</Text>
                  <Feather name='chevron-right' size={16} color={Theme.textInactiveTab} />
                </View>
                <Text style={styles.cardDescription} numberOfLines={3}>{starter.prompt}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        ))}

        {[...MODE_CARDS, ...topicStarters].map(card => (
          <TouchableOpacity
            key={card.id}
            style={styles.card}
            onPress={() => onPromptSelect(card.prompt, card.mode, false)}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: card.iconBackground }]}>
                <Feather name={card.iconName} size={16} color={Theme.white} />
              </View>
              <Text style={styles.cardLabel}>{card.label}</Text>
              <Feather name='chevron-right' size={16} color={Theme.textInactiveTab} />
            </View>
            <Text style={styles.cardDescription} numberOfLines={2}>{card.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingTop: 10, paddingBottom: 12, backgroundColor: Theme.white },
  scrollContent: { paddingHorizontal: 20, paddingRight: 32 },
  card: {
    width: 170, minHeight: 108, backgroundColor: Theme.white,
    borderRadius: 16, borderWidth: 1, borderColor: '#e0e0e0',
    padding: 12, marginRight: 12,
  },
  cardPersonalized: { width: 210 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: {
    width: 26, height: 26, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', marginRight: 8,
  },
  cardLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Theme.black },
  cardDescription: { marginTop: 10, fontSize: 12, color: Theme.textInput, lineHeight: 16 },
});
