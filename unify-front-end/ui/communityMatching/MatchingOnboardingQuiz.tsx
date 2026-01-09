import { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface MatchingOnboardingQuizProps {
  onComplete: () => Promise<void> | void;
  isSubmitting?: boolean;
}

const TOTAL_STEPS = 3;

// Blue theme colors matching the rest of the feature
const COLORS = {
  primary: '#588DD1',
  primaryLight: '#EBF4FF',
  primaryDark: '#4A7BB8',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
  successLight: '#ECFDF5',
};

const goalOptions = [
  { value: 'make_friends', label: 'Make new friends in Canada', icon: 'heart' },
  { value: 'practice_english', label: 'Practice English or French', icon: 'message-circle' },
  { value: 'job_search', label: 'Swap tips about jobs & resumes', icon: 'briefcase' },
  { value: 'wellness', label: 'Stay motivated & encouraged', icon: 'sun' },
];

const topicOptions = [
  { value: 'immigration', label: 'Immigration paperwork', icon: 'file-text' },
  { value: 'housing', label: 'Renting & housing search', icon: 'home' },
  { value: 'finances', label: 'Budgeting & banking', icon: 'dollar-sign' },
  { value: 'community', label: 'Making friends & social life', icon: 'users' },
  { value: 'career', label: 'Jobs, resumes & interviews', icon: 'trending-up' },
];

// Selection card component
function SelectionCard({
  label,
  icon,
  selected,
  onPress,
  multiSelect = false,
}: {
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  multiSelect?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.selectionCard, selected && styles.selectionCardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.selectionIcon, selected && styles.selectionIconSelected]}>
        <Feather name={icon as any} size={20} color={selected ? COLORS.white : COLORS.primary} />
      </View>
      <Text style={[styles.selectionLabel, selected && styles.selectionLabelSelected]}>
        {label}
      </Text>
      <View style={[
        multiSelect ? styles.checkbox : styles.radio,
        selected && (multiSelect ? styles.checkboxSelected : styles.radioSelected),
      ]}>
        {selected && (
          multiSelect ? (
            <Feather name="check" size={14} color={COLORS.white} />
          ) : (
            <View style={styles.radioDot} />
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

// Step indicator
function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }, (_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i < currentStep && styles.stepDotCompleted,
            i === currentStep - 1 && styles.stepDotCurrent,
          ]}
        />
      ))}
    </View>
  );
}

export function MatchingOnboardingQuiz({
  onComplete,
  isSubmitting,
}: MatchingOnboardingQuizProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<number, string>>({});
  
  // Animation for step transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  const handleNext = () => {
    if (step === 1 && !goal) {
      setErrors({ 1: 'Please pick one' });
      return;
    }
    if (step === 2 && topics.length === 0) {
      setErrors({ 2: 'Pick at least one topic' });
      return;
    }
    setErrors({});
    animateTransition(() => setStep(prev => Math.min(prev + 1, TOTAL_STEPS)));
  };

  const handleBack = () => {
    if (step === 1) return;
    setErrors({});
    animateTransition(() => setStep(prev => Math.max(prev - 1, 1)));
  };

  const toggleTopic = (value: string) => {
    setTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
    setErrors({});
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ScrollView 
            style={styles.stepContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepContentContainer}
          >
            <View style={styles.questionHeader}>
              <View style={styles.questionIconCircle}>
                <Feather name="target" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.questionTitle}>What's your main goal?</Text>
              <Text style={styles.questionSubtitle}>
                This helps us match you with people who share similar goals.
              </Text>
            </View>
            <View style={styles.optionsContainer}>
              {goalOptions.map(option => (
                <SelectionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={goal === option.value}
                  onPress={() => {
                    setGoal(option.value);
                    setErrors({});
                  }}
                />
              ))}
            </View>
            {errors[1] && <Text style={styles.errorText}>{errors[1]}</Text>}
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView 
            style={styles.stepContent} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.stepContentContainer}
          >
            <View style={styles.questionHeader}>
              <View style={styles.questionIconCircle}>
                <Feather name="message-circle" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.questionTitle}>What would you like to discuss?</Text>
              <Text style={styles.questionSubtitle}>
                Select all the topics you'd like your circle to cover.
              </Text>
            </View>
            <View style={styles.optionsContainer}>
              {topicOptions.map(option => (
                <SelectionCard
                  key={option.value}
                  label={option.label}
                  icon={option.icon}
                  selected={topics.includes(option.value)}
                  onPress={() => toggleTopic(option.value)}
                  multiSelect
                />
              ))}
            </View>
            {topics.length > 0 && (
              <View style={styles.selectedCount}>
                <Feather name="check-circle" size={16} color={COLORS.success} />
                <Text style={styles.selectedCountText}>
                  {topics.length} topic{topics.length > 1 ? 's' : ''} selected
                </Text>
              </View>
            )}
            {errors[2] && <Text style={styles.errorText}>{errors[2]}</Text>}
          </ScrollView>
        );

      case 3:
        return (
          <View style={styles.completionContainer}>
            <View style={styles.completionIconContainer}>
              <View style={styles.completionIconRing} />
              <View style={styles.completionIconCircle}>
                <Feather name="check" size={32} color={COLORS.white} />
              </View>
            </View>
            <Text style={styles.completionTitle}>You're all set!</Text>
            <Text style={styles.completionSubtitle}>
              We'll match you with 3 other newcomers who share your goals and interests. This usually takes a few minutes to a few hours.
            </Text>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Your circle preferences</Text>
              <View style={styles.summaryRow}>
                <Feather name="target" size={16} color={COLORS.textSecondary} />
                <Text style={styles.summaryText}>
                  {goalOptions.find(g => g.value === goal)?.label || 'Not selected'}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Feather name="message-circle" size={16} color={COLORS.textSecondary} />
                <Text style={styles.summaryText}>
                  {topics.length} topic{topics.length > 1 ? 's' : ''} to discuss
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.root}>
      {/* Header with step indicator */}
      <View style={styles.header}>
        <StepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
        <Text style={styles.stepLabel}>Step {step} of {TOTAL_STEPS}</Text>
      </View>

      {/* Animated step content */}
      <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>

      {/* Footer with navigation buttons */}
      <View style={styles.footer}>
        {step < TOTAL_STEPS ? (
          <View style={styles.buttonRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Feather name="arrow-left" size={20} color={COLORS.text} />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            ) : (
              <View />
            )}
            <TouchableOpacity 
              style={styles.nextButton} 
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Feather name="arrow-right" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => onComplete()}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.joinButtonText}>Join the waiting room</Text>
                <Feather name="arrow-right" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 8,
  },
  stepDot: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepDotCurrent: {
    backgroundColor: COLORS.primary,
  },
  stepLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  // Content
  contentWrapper: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepContentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  // Question header
  questionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  questionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  questionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  questionSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Options
  optionsContainer: {
    gap: 12,
  },
  selectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    gap: 14,
  },
  selectionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  selectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIconSelected: {
    backgroundColor: COLORS.primary,
  },
  selectionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  selectionLabelSelected: {
    color: COLORS.text,
    fontWeight: '600',
  },
  // Radio & Checkbox
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.white,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  // Selected count
  selectedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 6,
  },
  selectedCountText: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: '500',
  },
  // Error
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  // Completion
  completionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completionIconContainer: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completionIconRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.successLight,
  },
  completionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  completionSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    gap: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
});
