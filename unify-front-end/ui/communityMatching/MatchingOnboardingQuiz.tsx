import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import OnboardingProgress from '@/components/onboarding/OnboardingProgress';
import WelcomeStep from '@/components/onboarding/WelcomeStep';
import SingleSelectQuestion from '@/components/onboarding/SingleSelectQuestion';
import MultiSelectQuestion from '@/components/onboarding/MultiSelectQuestion';
import { MatchingCompletionStep } from '@/ui/communityMatching/MatchingCompletionStep';
import { Theme } from '@/constants/Theme';

interface MatchingOnboardingQuizProps {
  onComplete: () => Promise<void> | void;
  isSubmitting?: boolean;
}

const TOTAL_STEPS = 4;

const goalOptions = [
  { value: 'make_friends', label: 'Make new friends in Canada' },
  { value: 'practice_english', label: 'Practice English or French' },
  { value: 'job_search', label: 'Swap tips about jobs & resumes' },
  { value: 'wellness', label: 'Stay motivated & encouraged' },
];

const topicOptions = [
  { value: 'immigration', label: 'Immigration paperwork' },
  { value: 'housing', label: 'Renting & housing search' },
  { value: 'finances', label: 'Budgeting & banking' },
  { value: 'community', label: 'Making friends & social life' },
  { value: 'career', label: 'Jobs, resumes & interviews' },
];

export function MatchingOnboardingQuiz({
  onComplete,
  isSubmitting,
}: MatchingOnboardingQuizProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<string | null>(null);
  const [goalOther, setGoalOther] = useState<string | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [topicsOther, setTopicsOther] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const handleNext = () => {
    if (step === 2 && !goal) {
      setErrors({ 2: 'Please pick one' });
      return;
    }
    if (step === 3 && topics.length === 0) {
      setErrors({ 3: 'Pick at least one topic' });
      return;
    }
    setErrors({});
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    if (step === 1) {
      return;
    }
    setErrors({});
    setStep(prev => Math.max(prev - 1, 1));
  };

  const toggleTopic = (value: string) => {
    setTopics(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <SingleSelectQuestion
            question='What are you hoping to get from this circle?'
            options={goalOptions}
            selectedValue={goal}
            otherValue={goalOther}
            onSelect={value => {
              setGoal(value);
              setErrors({});
            }}
            onOtherChange={setGoalOther}
            required
            error={errors[2]}
          />
        );
      case 3:
        return (
          <MultiSelectQuestion
            question='Which topics should your circle discuss?'
            options={topicOptions}
            selectedValues={topics}
            otherValue={topicsOther}
            onToggle={toggleTopic}
            onOtherChange={setTopicsOther}
            required
            error={errors[3]}
          />
        );
      default:
        return <MatchingCompletionStep />;
    }
  };

  const showControls = step > 1 && step < TOTAL_STEPS;

  return (
    <View style={styles.root}>
      <OnboardingProgress currentStep={step} totalSteps={TOTAL_STEPS} />
      <View style={styles.stepContainer}>{renderStep()}</View>
      {step < TOTAL_STEPS && (
        <View style={styles.controls}>
          {showControls ? (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleBack}>
              <Text style={styles.secondaryText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
            <Text style={styles.primaryText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === TOTAL_STEPS && (
        <>
      <View style={styles.finishWrapper}>
        <TouchableOpacity
          style={[styles.primaryBtn, styles.finishBtn]}
          onPress={() => onComplete()}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color='#fff' />
          ) : (
            <Text style={styles.primaryText}>Enter waiting room</Text>
          )}
        </TouchableOpacity>
      </View>
          <Text style={styles.waitingCopy}>
            You’ll be entered into a circle once we find a group match.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  stepContainer: {
    flex: 1,
    paddingTop: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Theme.primaryGatherRed,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  finishWrapper: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 8,
  },
  finishBtn: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 999,
  },
  primaryText: {
    color: Theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  waitingCopy: {
    textAlign: 'center',
    color: Theme.textInput,
    marginHorizontal: 24,
    marginBottom: 24,
    marginTop: 8,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexGrow: 1,
    alignItems: 'center',
  },
  secondaryText: {
    color: Theme.black,
    fontSize: 16,
    fontWeight: '600',
  },
});
