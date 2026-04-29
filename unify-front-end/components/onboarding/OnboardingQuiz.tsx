import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import OnboardingProgress from './OnboardingProgress';
import WelcomeStep from './WelcomeStep';
import SingleSelectQuestion from './SingleSelectQuestion';
import FloatingTagSelect from './FloatingTagSelect';
import OutcomesStep from './OutcomesStep';
import ThankYouStep from './ThankYouStep';
import LocationStep from './LocationStep';
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
import { useAnalytics, AnalyticsEvents } from '@/utils/analytics';
import { registerForPushNotifications } from '@/services/push/pushNotifications';
import { requestStoreReview } from '@/utils/storeReview';
import { useInviteCode } from '@/context/InviteCodeContext';
import { InviteCodeField } from '@/components/referrals/InviteCodeField';

interface OnboardingQuizProps {
  onComplete: () => void;
  isRedo?: boolean;
}

const TOTAL_STEPS = 11;

const STEP_NAMES: Record<number, string> = {
  1: 'welcome',
  2: 'persona',
  3: 'referral_source',
  4: 'arrival_date',
  5: 'location',
  6: 'goals',
  7: 'learning_interests',
  8: 'hobbies',
  9: 'reminders',
  10: 'outcomes',
  11: 'thank_you',
};

export default function OnboardingQuiz({
  onComplete,
  isRedo = false,
}: OnboardingQuizProps) {
  const saveMutation = useSaveOnboardingProfile();
  const { trackOnboardingStepCompleted, trackOnboardingCompleted, capture } =
    useAnalytics();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const inviteCtx = useInviteCode();

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
  const [city, setCity] = useState<string | null>(null);
  const [province, setProvince] = useState<string | null>(null);

  // Invite code state — pre-fills from clipboard context if present, also editable.
  const [inviteCodeInput, setInviteCodeInput] = useState<string>('');
  const [inviteCodeAutoFilled, setInviteCodeAutoFilled] = useState(false);

  // When clipboard context detects a code, surface it in step 3.
  useEffect(() => {
    if (inviteCtx.code && inviteCtx.source === 'clipboard') {
      setInviteCodeInput(inviteCtx.code);
      setInviteCodeAutoFilled(true);
      // Suggest the source so the user doesn't have to pick.
      setReferralSource(prev => prev ?? 'friends_family');
    }
  }, [inviteCtx.code, inviteCtx.source]);

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
      case 5: // Location
        if (!city) {
          newErrors[5] = 'Please select a city';
          setErrors(newErrors);
          return false;
        }
        if (!province) {
          newErrors[5] = 'Please select a province';
          setErrors(newErrors);
          return false;
        }
        break;
      case 6: // Goals
        if (goals.length === 0) {
          newErrors[6] = 'Please select at least one option';
          setErrors(newErrors);
          return false;
        }
        if (goals.includes('something_else') && !goalsOther?.trim()) {
          newErrors[6] = 'Please specify your goal';
          setErrors(newErrors);
          return false;
        }
        break;
      case 7: // Learning Interests
        if (learningInterests.length === 0) {
          newErrors[7] = 'Please select at least one option';
          setErrors(newErrors);
          return false;
        }
        if (
          learningInterests.includes('other') &&
          !learningInterestsOther?.trim()
        ) {
          newErrors[7] = 'Please specify your interest';
          setErrors(newErrors);
          return false;
        }
        break;
      case 8: // Hobbies (optional, no validation)
        break;
      case 9: // Reminders
        if (wantsReminders === null) {
          newErrors[9] = 'Please select an option';
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

    trackOnboardingStepCompleted(
      currentStep,
      STEP_NAMES[currentStep] || `step_${currentStep}`
    );

    // Always request push permission at step 9 (reminders) — social notifications always send.
    // The reminders toggle only controls learn reminders (server-side).
    if (currentStep === 9) {
      registerForPushNotifications().catch(err => {
        console.error('Push registration from onboarding failed:', err);
      });
    }

    // Request iOS App Store review after Outcomes step (peak positive sentiment)
    if (currentStep === 10 && !isRedo) {
      requestStoreReview();
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
      // Only attempt to redeem when the user actually selected friends_family AND
      // typed/confirmed a 6-character code. Anything else: skip redeem entirely.
      const trimmedCode = inviteCodeInput.trim().toUpperCase();
      const inviteExtras =
        referralSource === 'friends_family' && /^[A-Z2-9]{6}$/.test(trimmedCode)
          ? {
              inviteCode: {
                code: trimmedCode,
                source: inviteCodeAutoFilled
                  ? ('clipboard' as const)
                  : ('manual' as const),
              },
            }
          : undefined;

      const result = await saveMutation.mutateAsync({
        userId: user.id,
        data: {
          persona,
          persona_other: personaOther,
          referral_source: referralSource,
          referral_source_other: referralSourceOther,
          arrival_date: arrivalDate,
          city,
          province,
          goals,
          goals_other: goalsOther,
          learning_interests: learningInterests,
          learning_interests_other: learningInterestsOther,
          hobbies,
          wants_reminders: wantsReminders ?? false,
          onboarding_completed: true,
        },
        extras: inviteExtras,
      });

      trackOnboardingCompleted(persona);

      // If redeem succeeded, route the user to the welcome moment instead of home.
      if (result.redeem?.success) {
        capture(AnalyticsEvents.INVITE_REDEEMED, {
          inviter_id: result.redeem.inviter.id,
          source: inviteExtras?.inviteCode.source ?? 'manual',
        });
        // Clear the in-memory clipboard code so it doesn't leak into future flows
        // (e.g. redo onboarding).
        inviteCtx.clear();
        router.replace('/welcome-from-inviter' as any);
        return; // do NOT call onComplete; welcome screen handles its own dismiss
      }

      // Redeem failed (or no code at all) — log and proceed to normal completion.
      if (result.redeem && !result.redeem.success) {
        capture(AnalyticsEvents.INVITE_REDEEM_FAILED, {
          reason: result.redeem.reason,
        });
      }
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
        return <WelcomeStep onNext={handleNext} isRedo={isRedo} />;
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
          <View>
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
            {referralSource === 'friends_family' ? (
              <InviteCodeField
                value={inviteCodeInput}
                onChange={next => {
                  setInviteCodeInput(next);
                  // Once the user types, it's no longer "auto-filled."
                  if (inviteCodeAutoFilled) setInviteCodeAutoFilled(false);
                }}
                autoFilled={inviteCodeAutoFilled}
              />
            ) : null}
          </View>
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
          <LocationStep
            selectedCity={city}
            selectedProvince={province}
            onCityChange={setCity}
            onProvinceChange={setProvince}
            error={errors[5]}
          />
        );
      case 6:
        return (
          <FloatingTagSelect
            question='What do you want to accomplish? (Select all that apply)'
            options={[
              {
                value: 'learn_something',
                label: 'Learn something new',
                icon: 'book-open',
              },
              {
                value: 'build_community',
                label: 'Build community & friends',
                icon: 'users',
              },
              {
                value: 'quick_answers',
                label: 'Quick answers',
                icon: 'zap',
              },
              {
                value: 'something_else',
                label: 'Something else',
                icon: 'more-horizontal',
                hasOther: true,
              },
            ]}
            selectedValues={goals}
            otherValue={goalsOther}
            onToggle={value => toggleGoal(value as Goal)}
            onOtherChange={setGoalsOther}
            required
            error={errors[6]}
          />
        );
      case 7:
        return (
          <FloatingTagSelect
            question='Which topics interest you? (Select all that apply)'
            options={[
              {
                value: 'documents',
                label: 'Documents & IDs',
                icon: 'file-text',
              },
              {
                value: 'employment',
                label: 'Jobs & career',
                icon: 'briefcase',
              },
              {
                value: 'finance',
                label: 'Money & banking',
                icon: 'credit-card',
              },
              { value: 'housing', label: 'Housing', icon: 'home' },
              {
                value: 'pr_immigration',
                label: 'PR & immigration',
                icon: 'globe',
              },
              {
                value: 'healthcare',
                label: 'Healthcare',
                icon: 'heart',
              },
              { value: 'family_kids', label: 'Family & kids', icon: 'users' },
              {
                value: 'transit',
                label: 'Transit',
                icon: 'map-pin',
              },
              {
                value: 'other',
                label: 'Other',
                hasOther: true,
                icon: 'more-horizontal',
              },
            ]}
            selectedValues={learningInterests}
            otherValue={learningInterestsOther}
            onToggle={value =>
              toggleLearningInterest(value as LearningInterest)
            }
            onOtherChange={setLearningInterestsOther}
            required
            error={errors[7]}
          />
        );
      case 8:
        return (
          <FloatingTagSelect
            question='What are your hobbies? (Select all that apply)'
            options={[
              {
                value: 'career_growth',
                label: 'Career growth',
                icon: 'trending-up',
              },
              {
                value: 'exploring_canada',
                label: 'Explore Canada',
                icon: 'map',
              },
              {
                value: 'wellness',
                label: 'Wellness & growth',
                icon: 'heart',
              },
              {
                value: 'technology',
                label: 'Tech & digital',
                icon: 'cpu',
              },
              {
                value: 'music',
                label: 'Music & arts',
                icon: 'music',
              },
              {
                value: 'fitness',
                label: 'Fitness & sports',
                icon: 'activity',
              },
              {
                value: 'personal_finance',
                label: 'Personal finance',
                icon: 'dollar-sign',
              },
              {
                value: 'family_parenting',
                label: 'Family & parenting',
                icon: 'users',
              },
              {
                value: 'education',
                label: 'Education & learning',
                icon: 'book-open',
              },
              {
                value: 'food_cooking',
                label: 'Food & cooking',
                icon: 'coffee',
              },
              { value: 'movies', label: 'Movies', icon: 'film' },
            ]}
            selectedValues={hobbies}
            otherValue={null}
            onToggle={value => toggleHobby(value as Hobby)}
            onOtherChange={() => {}}
            required={false}
          />
        );
      case 9:
        return (
          <View style={styles.container}>
            <Text style={styles.question}>
              Want gentle reminders so you don't miss important steps?
            </Text>
            <Text style={styles.subtitle}>
              You'll always get notified about likes, comments, and follows.
              This controls learning reminders — nudges about lessons you
              started but haven't finished.
            </Text>
            {errors[9] && <Text style={styles.errorText}>{errors[9]}</Text>}
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
      case 10:
        return <OutcomesStep />;
      case 11:
        return <ThankYouStep isRedo={isRedo} />;
      default:
        return null;
    }
  };

  const isLoading = saveMutation.isPending;

  return (
    <View style={styles.root}>
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={TOTAL_STEPS}
        skipSafeArea={isRedo}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      <View
        style={[styles.navContainer, { paddingBottom: 20 + insets.bottom }]}
      >
        {currentStep > 1 && currentStep < 11 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Feather name='chevron-left' size={24} color={Theme.black} />
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        {currentStep < 10 && (
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
        {currentStep === 10 && (
          <TouchableOpacity
            style={[
              styles.nextButton,
              styles.finalStepButton,
              isLoading && styles.nextButtonDisabled,
            ]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Theme.white} />
            ) : (
              <>
                <Text style={[styles.nextButtonText, styles.finalStepText]}>
                  Continue
                </Text>
                <Feather name='chevron-right' size={24} color={Theme.white} />
              </>
            )}
          </TouchableOpacity>
        )}
        {currentStep === 11 && (
          <TouchableOpacity
            style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Theme.white} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {isRedo ? 'Save Changes' : 'Explore Unify'}
                </Text>
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
    paddingBottom: 88,
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
    paddingHorizontal: 28,
    paddingVertical: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.surfaceGray,
    backgroundColor: Theme.white,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 4,
  },
  navButtonText: {
    fontSize: 16,
    color: Theme.black,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Theme.primaryGatherRed,
    paddingHorizontal: 28,
    height: 52,
    borderRadius: 26,
    marginLeft: 'auto',
  },
  finalStepButton: {
    paddingHorizontal: 32,
  },
  nextButtonDisabled: {
    backgroundColor: Theme.disabledGatherRed,
  },
  nextButtonText: {
    fontSize: 15,
    color: Theme.white,
    fontWeight: '600',
  },
  finalStepText: {
    fontWeight: '700',
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
