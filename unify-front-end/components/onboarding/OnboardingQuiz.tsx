import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import OnboardingProgress from './OnboardingProgress';
import WelcomeStep from './WelcomeStep';
import SingleSelectQuestion from './SingleSelectQuestion';
import MultiSelectQuestion from './MultiSelectQuestion';
import OutcomesStep from './OutcomesStep';
import ThankYouStep from './ThankYouStep';
import { useSaveOnboardingProfile } from '@/hooks/onboarding/useSaveOnboardingProfile';
import { supabase } from '@/lib/supabase';
import MonthPicker from './MonthPicker';
import {
  Persona,
  ReferralSource,
  Goal,
  LearningInterest,
  Hobby,
} from '@/types/onboardingProfile';

interface OnboardingQuizProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 10;

export default function OnboardingQuiz({ onComplete }: OnboardingQuizProps) {
  const saveMutation = useSaveOnboardingProfile();

  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personaOther, setPersonaOther] = useState<string | null>(null);
  const [referralSource, setReferralSource] = useState<ReferralSource | null>(
    null
  );
  const [referralSourceOther, setReferralSourceOther] = useState<string | null>(
    null
  );
  const [arrivalDate, setArrivalDate] = useState<Date | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsOther, setGoalsOther] = useState<string | null>(null);
  const [learningInterests, setLearningInterests] = useState<
    LearningInterest[]
  >([]);
  const [learningInterestsOther, setLearningInterestsOther] = useState<
    string | null
  >(null);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [wantsReminders, setWantsReminders] = useState<boolean | null>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<number, string>>({});

  const buildArrivalDate = () => {
    if (!arrivalDate) return null;
    return new Date(
      Date.UTC(arrivalDate.getFullYear(), arrivalDate.getMonth(), 1)
    ).toISOString();
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<number, string> = {};

    switch (step) {
      case 2: // Persona
        if (!persona) {
          newErrors[2] = 'Please select an option';
          setErrors(newErrors);
          return false;
        }
        if (persona === 'other' && !personaOther?.trim()) {
          newErrors[2] = 'Please specify your situation';
          setErrors(newErrors);
          return false;
        }
        break;
      case 3: // Referral Source
        if (!referralSource) {
          newErrors[3] = 'Please select an option';
          setErrors(newErrors);
          return false;
        }
        if (referralSource === 'other' && !referralSourceOther?.trim()) {
          newErrors[3] = 'Please specify how you heard about us';
          setErrors(newErrors);
          return false;
        }
        break;
      case 4: // Arrival date
        if (!arrivalDate) {
          newErrors[4] = 'Please select a month and year';
          setErrors(newErrors);
          return false;
        }
        break;

      case 5: // Goals
        if (goals.length === 0) {
          newErrors[5] = 'Please select at least one option';
          setErrors(newErrors);
          return false;
        }
        if (goals.includes('something_else') && !goalsOther?.trim()) {
          newErrors[5] = 'Please specify your goal';
          setErrors(newErrors);
          return false;
        }
        break;
      case 6: // Learning Interests
        if (learningInterests.length === 0) {
          newErrors[6] = 'Please select at least one option';
          setErrors(newErrors);
          return false;
        }
        if (
          learningInterests.includes('other') &&
          !learningInterestsOther?.trim()
        ) {
          newErrors[6] = 'Please specify your interest';
          setErrors(newErrors);
          return false;
        }
        break;
      case 7: // Hobbies (optional, no validation)
        break;
      case 8: // Reminders
        if (wantsReminders === null) {
          newErrors[8] = 'Please select an option';
          setErrors(newErrors);
          return false;
        }
        break;
    }

    setErrors({});
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      // Clear error for previous step
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[currentStep];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Get user ID directly from Supabase auth (more reliable than UserContext)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('No authenticated user found:', authError);
      Alert.alert('Error', 'Please sign in to continue');
      return;
    }

    if (!validateStep(currentStep)) {
      return;
    }

    const arrivalDate = buildArrivalDate();

    try {
      await saveMutation.mutateAsync({
        userId: user.id, // Use user.id from Supabase auth directly
        data: {
          persona,
          persona_other: personaOther,
          referral_source: referralSource,
          referral_source_other: referralSourceOther,
          arrival_date: arrivalDate,
          goals,
          goals_other: goalsOther,
          learning_interests: learningInterests,
          learning_interests_other: learningInterestsOther,
          hobbies,
          wants_reminders: wantsReminders ?? false,
          onboarding_completed: true,
        },
      });

      onComplete();
    } catch (error) {
      console.error('Error saving onboarding profile:', error);
      Alert.alert(
        'Error',
        'Failed to save your onboarding information. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const toggleGoal = (goal: Goal) => {
    setGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
    if (goal === 'something_else' && goals.includes('something_else')) {
      setGoalsOther(null);
    }
  };

  const toggleLearningInterest = (interest: LearningInterest) => {
    setLearningInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
    if (interest === 'other' && learningInterests.includes('other')) {
      setLearningInterestsOther(null);
    }
  };

  const toggleHobby = (hobby: Hobby) => {
    setHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={handleNext} />;
      case 2:
        return (
          <SingleSelectQuestion
            question='What best describes your situation in Canada?'
            options={[
              {
                value: 'international_student',
                label: "I'm an international student",
              },
              {
                value: 'skilled_worker',
                label: "I'm a skilled worker / PR / immigrant",
              },
              {
                value: 'refugee',
                label: "I'm a refugee or protected person",
              },
              { value: 'other', label: 'Other', hasOther: true },
            ]}
            selectedValue={persona}
            otherValue={personaOther}
            onSelect={value => setPersona(value as Persona)}
            onOtherChange={setPersonaOther}
            required
            error={errors[2]}
          />
        );
      case 3:
        return (
          <SingleSelectQuestion
            question='How did you hear about Unify?'
            options={[
              { value: 'facebook_instagram', label: 'Facebook / Instagram' },
              { value: 'google_search', label: 'Google Search' },
              { value: 'app_store', label: 'App Store' },
              { value: 'friends_family', label: 'Friends / family' },
              { value: 'news_article', label: 'News / article / blog' },
              { value: 'tiktok', label: 'TikTok' },
              { value: 'other', label: 'Other', hasOther: true },
            ]}
            selectedValue={referralSource}
            otherValue={referralSourceOther}
            onSelect={value => setReferralSource(value as ReferralSource)}
            onOtherChange={setReferralSourceOther}
            required
            error={errors[3]}
          />
        );
      case 4:
        return (
          <View style={styles.container}>
            <Text style={styles.question}>
              When did you arrive, or when will you arrive in Canada?
            </Text>

            {errors[4] && <Text style={styles.errorText}>{errors[4]}</Text>}

            <MonthPicker
              value={arrivalDate}
              onChange={date => setArrivalDate(date)}
              minimumDate={new Date(new Date().getFullYear() - 20, 0)}
              maximumDate={new Date(new Date().getFullYear() + 10, 11)}
            />
          </View>
        );
      case 5:
        return (
          <MultiSelectQuestion
            question='What do you want to accomplish? (Select all that apply)'
            options={[
              { value: 'learn_something', label: 'Learn something new' },
              {
                value: 'build_community',
                label: 'Build a community & make friends',
              },
              {
                value: 'quick_answers',
                label: 'Quick, trustworthy answers to my questions',
              },
              {
                value: 'something_else',
                label: 'Something else',
                hasOther: true,
              },
            ]}
            selectedValues={goals}
            otherValue={goalsOther}
            onToggle={value => toggleGoal(value as Goal)}
            onOtherChange={setGoalsOther}
            required
            error={errors[5]}
          />
        );
      case 6:
        return (
          <MultiSelectQuestion
            question='Which topic would you like to explore? (Select all that apply)'
            options={[
              {
                value: 'documents',
                label: 'Sort out paperwork & IDs (documents)',
              },
              { value: 'employment', label: 'Jobs & career (employment)' },
              { value: 'finance', label: 'Money & banking (finance)' },
              { value: 'housing', label: 'Housing' },
              { value: 'pr_immigration', label: 'PR & immigration' },
              {
                value: 'healthcare',
                label: 'Understand healthcare & insurance',
              },
              { value: 'family_kids', label: 'Support for family & kids' },
              { value: 'transit', label: 'Transit / transportation' },
              { value: 'other', label: 'Other', hasOther: true },
            ]}
            selectedValues={learningInterests}
            otherValue={learningInterestsOther}
            onToggle={value =>
              toggleLearningInterest(value as LearningInterest)
            }
            onOtherChange={setLearningInterestsOther}
            required
            error={errors[6]}
          />
        );
      case 7:
        return (
          <MultiSelectQuestion
            question='What are your hobbies and interests? (Select all that apply)'
            options={[
              {
                value: 'career_growth',
                label: 'Career & professional growth',
              },
              { value: 'exploring_canada', label: 'Exploring Canada' },
              { value: 'wellness', label: 'Wellness & personal growth' },
              { value: 'technology', label: 'Technology & digital skills' },
              { value: 'music', label: 'Music & entertainment' },
              { value: 'fitness', label: 'Fitness & sports' },
              { value: 'personal_finance', label: 'Personal finance' },
              { value: 'family_parenting', label: 'Family & parenting' },
              { value: 'education', label: 'Education & studying' },
              { value: 'food_cooking', label: 'Food & cooking' },
              { value: 'movies', label: 'Movies' },
            ]}
            selectedValues={hobbies}
            otherValue={null}
            onToggle={value => toggleHobby(value as Hobby)}
            onOtherChange={() => {}} // No "other" option for this question
            required={false}
          />
        );
      case 8:
        return (
          <View style={styles.container}>
            <Text style={styles.question}>
              Want gentle reminders so you don't miss important steps?
            </Text>
            <Text style={styles.subtitle}>
              We can nudge you about key deadlines and new lessons—only when
              it's useful.
            </Text>
            {errors[8] && <Text style={styles.errorText}>{errors[8]}</Text>}
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[
                  styles.option,
                  wantsReminders === true && styles.optionSelected,
                ]}
                onPress={() => setWantsReminders(true)}
              >
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radio,
                      wantsReminders === true && styles.radioSelected,
                    ]}
                  >
                    {wantsReminders === true && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      wantsReminders === true && styles.optionTextSelected,
                    ]}
                  >
                    Yes, send reminders
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.option,
                  wantsReminders === false && styles.optionSelected,
                ]}
                onPress={() => setWantsReminders(false)}
              >
                <View style={styles.radioContainer}>
                  <View
                    style={[
                      styles.radio,
                      wantsReminders === false && styles.radioSelected,
                    ]}
                  >
                    {wantsReminders === false && (
                      <View style={styles.radioInner} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      wantsReminders === false && styles.optionTextSelected,
                    ]}
                  >
                    No thanks
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        );
      case 9:
        return <OutcomesStep onNext={handleNext} />;
      case 10:
        return <ThankYouStep />;
      default:
        return null;
    }
  };

  const isLoading = saveMutation.isPending;

  return (
    <View style={styles.root}>
      <OnboardingProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View style={styles.navContainer}>
        {currentStep > 1 && currentStep < 10 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Feather name='chevron-left' size={24} color={Theme.black} />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {currentStep < 9 && (
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Theme.white} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Next</Text>
                <Feather name='chevron-right' size={24} color={Theme.white} />
              </>
            )}
          </TouchableOpacity>
        )}
        {currentStep === 9 && (
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Theme.white} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Continue</Text>
                <Feather name='chevron-right' size={24} color={Theme.white} />
              </>
            )}
          </TouchableOpacity>
        )}
        {currentStep === 10 && (
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Theme.white} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>Explore Unify</Text>
                <Feather name='chevron-right' size={24} color={Theme.white} />
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
    backgroundColor: Theme.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  question: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Theme.textInput,
    marginBottom: 24,
    lineHeight: 22,
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
  errorText: {
    fontSize: 14,
    color: '#f00',
    marginBottom: 16,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: Theme.surfaceGray,
    backgroundColor: Theme.white,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButtonText: {
    fontSize: 16,
    color: Theme.black,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Theme.primaryGatherRed,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginLeft: 'auto',
  },
  nextButtonDisabled: {
    backgroundColor: Theme.disabledGatherRed,
  },
  nextButtonText: {
    fontSize: 16,
    color: Theme.white,
    fontWeight: '600',
  },
  dateInputContainer: {
    marginTop: 16,
  },
  dateInput: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    backgroundColor: Theme.white,
    fontSize: 16,
    color: Theme.black,
  },
});
