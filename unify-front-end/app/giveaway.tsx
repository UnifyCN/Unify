import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ChevronLeft, Gift } from 'lucide-react-native';

import { Theme } from '@/constants/Theme';
import { GIVEAWAY } from '@/constants/Giveaway';
import { useGiveawayCountdown } from '@/hooks/giveaway/useGiveawayCountdown';
import {
  useGiveawayEntry,
  GIVEAWAY_ENTRY_QUERY_KEY,
} from '@/hooks/giveaway/useGiveawayEntry';
import { submitGiveawayEntry } from '@/services/giveaway/submitGiveawayEntry';
import type { GiveawayEntryInput } from '@/services/giveaway/types';
import { useAnalytics, AnalyticsEvents } from '@/utils/analytics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Step = 'welcome' | 'question' | 'details' | 'success';

const VALIDATION_KEY_MAP: Record<string, string> = {
  short_answer_required: 'giveaway.errors.shortAnswerRequired',
  short_answer_too_long: 'giveaway.errors.shortAnswerTooLong',
  first_name_required: 'giveaway.errors.firstNameRequired',
  last_name_required: 'giveaway.errors.lastNameRequired',
  email_invalid: 'giveaway.errors.emailInvalid',
  skill_answer_required: 'giveaway.errors.skillAnswerRequired',
  skill_answer_incorrect: 'giveaway.errors.skillAnswerIncorrect',
};

export default function GiveawayScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { capture } = useAnalytics();
  const { data: existingEntry, isLoading: entryLoading } = useGiveawayEntry();

  const [step, setStep] = useState<Step>('welcome');
  const [shortAnswer, setShortAnswer] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skillAnswer, setSkillAnswer] = useState('');
  const [consent, setConsent] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // If the user has already entered (e.g. came back to /giveaway after the
  // fact), jump straight to the success state so we never let them re-submit.
  useEffect(() => {
    if (existingEntry && step !== 'success') {
      setStep('success');
    }
  }, [existingEntry, step]);

  // Fire step_viewed when the active step changes.
  useEffect(() => {
    capture(AnalyticsEvents.GIVEAWAY_STEP_VIEWED, { step });
  }, [step, capture]);

  const mutation = useMutation({
    mutationFn: (input: GiveawayEntryInput) => submitGiveawayEntry(input),
    onSuccess: result => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: GIVEAWAY_ENTRY_QUERY_KEY });
        capture(AnalyticsEvents.GIVEAWAY_ENTRY_SUBMITTED, {
          has_phone: phone.trim().length > 0,
          answer_length: shortAnswer.trim().length,
        });
        setStep('success');
      } else {
        if (result.reason === 'validation' && result.message) {
          const key = VALIDATION_KEY_MAP[result.message];
          setSubmitError(key ? t(key) : t('giveaway.errors.submitFailed'));
        } else if (result.reason === 'duplicate') {
          setSubmitError(t('giveaway.errors.duplicate'));
          queryClient.invalidateQueries({
            queryKey: GIVEAWAY_ENTRY_QUERY_KEY,
          });
        } else if (result.reason === 'expired') {
          setSubmitError(t('giveaway.errors.expired'));
        } else {
          setSubmitError(t('giveaway.errors.submitFailed'));
        }
        capture(AnalyticsEvents.GIVEAWAY_ENTRY_FAILED, {
          reason: result.reason,
        });
      }
    },
    onError: () => {
      setSubmitError(t('giveaway.errors.submitFailed'));
      capture(AnalyticsEvents.GIVEAWAY_ENTRY_FAILED, { reason: 'network' });
    },
  });

  const stepOrder: Step[] = useMemo(
    () => ['welcome', 'question', 'details'],
    []
  );
  const currentIndex = stepOrder.indexOf(step);
  const isFinalStep = step === 'details';

  const handleBack = () => {
    setFieldError(null);
    setSubmitError(null);
    if (step === 'success') {
      router.back();
      return;
    }
    if (step === 'welcome') {
      router.back();
      return;
    }
    const prev = stepOrder[currentIndex - 1];
    if (prev) setStep(prev);
  };

  const validateQuestion = (): boolean => {
    const value = shortAnswer.trim();
    if (!value) {
      setFieldError(t('giveaway.errors.shortAnswerRequired'));
      return false;
    }
    if (value.length > GIVEAWAY.shortAnswerMaxLength) {
      setFieldError(t('giveaway.errors.shortAnswerTooLong'));
      return false;
    }
    setFieldError(null);
    return true;
  };

  const validateDetails = (): boolean => {
    if (!firstName.trim()) {
      setFieldError(t('giveaway.errors.firstNameRequired'));
      return false;
    }
    if (!lastName.trim()) {
      setFieldError(t('giveaway.errors.lastNameRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFieldError(t('giveaway.errors.emailInvalid'));
      return false;
    }
    if (GIVEAWAY.enableSkillQuestion && !skillAnswer.trim()) {
      setFieldError(t('giveaway.errors.skillAnswerRequired'));
      return false;
    }
    setFieldError(null);
    return true;
  };

  const handlePrimary = () => {
    if (step === 'welcome') {
      setStep('question');
      return;
    }
    if (step === 'question') {
      if (validateQuestion()) setStep('details');
      return;
    }
    if (step === 'details') {
      if (!validateDetails()) return;
      if (!consent) {
        setFieldError(t('giveaway.details.consent'));
        return;
      }
      setSubmitError(null);
      mutation.mutate({
        shortAnswer: shortAnswer.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        skillAnswer: GIVEAWAY.enableSkillQuestion
          ? skillAnswer.trim()
          : undefined,
      });
      return;
    }
    if (step === 'success') {
      router.back();
    }
  };

  if (entryLoading) {
    return (
      <View style={[styles.root, styles.loadingRoot]}>
        <ActivityIndicator color={Theme.black} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View
        style={[styles.header, { paddingTop: insets.top + 12 }]}
        accessibilityRole='header'
      >
        <Pressable
          onPress={handleBack}
          hitSlop={12}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          accessibilityRole='button'
          accessibilityLabel={t('common.back')}
        >
          <ChevronLeft color={Theme.black} size={24} strokeWidth={2.2} />
        </Pressable>
        {step !== 'success' && (
          <Text style={styles.stepIndicator}>
            {Math.min(currentIndex + 1, stepOrder.length)} / {stepOrder.length}
          </Text>
        )}
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        {step === 'welcome' && <WelcomeStep />}
        {step === 'question' && (
          <QuestionStep
            value={shortAnswer}
            onChange={text => {
              setShortAnswer(text);
              if (fieldError) setFieldError(null);
            }}
            error={fieldError}
          />
        )}
        {step === 'details' && (
          <DetailsStep
            firstName={firstName}
            lastName={lastName}
            email={email}
            phone={phone}
            skillAnswer={skillAnswer}
            consent={consent}
            onFirstName={v => {
              setFirstName(v);
              if (fieldError) setFieldError(null);
            }}
            onLastName={v => {
              setLastName(v);
              if (fieldError) setFieldError(null);
            }}
            onEmail={v => {
              setEmail(v);
              if (fieldError) setFieldError(null);
            }}
            onPhone={setPhone}
            onSkillAnswer={v => {
              setSkillAnswer(v);
              if (fieldError) setFieldError(null);
            }}
            onConsentChange={value => {
              setConsent(value);
              if (fieldError) setFieldError(null);
            }}
            error={fieldError}
            submitError={submitError}
          />
        )}
        {step === 'success' && (
          <SuccessStep
            firstName={existingEntry?.first_name ?? firstName.trim()}
          />
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <Pressable
          onPress={handlePrimary}
          disabled={mutation.isPending}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && !mutation.isPending && styles.primaryButtonPressed,
            mutation.isPending && styles.primaryButtonDisabled,
          ]}
          accessibilityRole='button'
        >
          {mutation.isPending ? (
            <ActivityIndicator color={Theme.white} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {step === 'welcome' && t('giveaway.welcome.cta')}
              {step === 'question' && t('giveaway.question.cta')}
              {step === 'details' && t('giveaway.details.cta')}
              {step === 'success' && t('giveaway.success.cta')}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function WelcomeStep() {
  const { t } = useTranslation();
  const { isActive, display } = useGiveawayCountdown();
  const rules = [
    t('giveaway.welcome.rule1'),
    t('giveaway.welcome.rule2'),
    t('giveaway.welcome.rule3'),
    t('giveaway.welcome.rule4'),
  ];
  return (
    <View>
      <View style={styles.prizeIconWrap}>
        <Gift color={Theme.black} size={32} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{t('giveaway.welcome.title')}</Text>
      <Text style={styles.subtitle}>{t('giveaway.welcome.subtitle')}</Text>
      {isActive && (
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>
            {t('giveaway.banner.countdownPrefix')}
          </Text>
          <Text style={styles.countdownValue}>{display}</Text>
        </View>
      )}
      <Text style={styles.sectionTitle}>{t('giveaway.welcome.rulesTitle')}</Text>
      <View style={styles.rulesList}>
        {rules.map((rule, idx) => (
          <View key={idx} style={styles.ruleRow}>
            <View style={styles.ruleBullet} />
            <Text style={styles.ruleText}>{rule}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface QuestionStepProps {
  value: string;
  onChange: (text: string) => void;
  error: string | null;
}

function QuestionStep({ value, onChange, error }: QuestionStepProps) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={styles.title}>{t('giveaway.question.title')}</Text>
      <Text style={styles.prompt}>{t('giveaway.question.prompt')}</Text>
      <TextInput
        style={[styles.textArea, !!error && styles.inputError]}
        value={value}
        onChangeText={onChange}
        placeholder={t('giveaway.question.placeholder')}
        placeholderTextColor={Theme.textInactiveTab}
        multiline
        maxLength={GIVEAWAY.shortAnswerMaxLength}
        textAlignVertical='top'
        accessibilityLabel={t('giveaway.question.prompt')}
      />
      <View style={styles.belowInputRow}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View />
        )}
        <Text style={styles.charCount}>
          {t('giveaway.question.charCount', { count: value.length })}
        </Text>
      </View>
    </View>
  );
}

interface DetailsStepProps {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  skillAnswer: string;
  consent: boolean;
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
  onEmail: (v: string) => void;
  onPhone: (v: string) => void;
  onSkillAnswer: (v: string) => void;
  onConsentChange: (v: boolean) => void;
  error: string | null;
  submitError: string | null;
}

function DetailsStep({
  firstName,
  lastName,
  email,
  phone,
  skillAnswer,
  consent,
  onFirstName,
  onLastName,
  onEmail,
  onPhone,
  onSkillAnswer,
  onConsentChange,
  error,
  submitError,
}: DetailsStepProps) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={styles.title}>{t('giveaway.details.title')}</Text>

      <FieldLabel>{t('giveaway.details.firstName')}</FieldLabel>
      <TextInput
        style={styles.textInput}
        value={firstName}
        onChangeText={onFirstName}
        autoCapitalize='words'
        autoComplete='given-name'
        textContentType='givenName'
      />

      <FieldLabel>{t('giveaway.details.lastName')}</FieldLabel>
      <TextInput
        style={styles.textInput}
        value={lastName}
        onChangeText={onLastName}
        autoCapitalize='words'
        autoComplete='family-name'
        textContentType='familyName'
      />

      <FieldLabel>{t('giveaway.details.email')}</FieldLabel>
      <TextInput
        style={styles.textInput}
        value={email}
        onChangeText={onEmail}
        keyboardType='email-address'
        autoCapitalize='none'
        autoComplete='email'
        textContentType='emailAddress'
      />

      <FieldLabel>{t('giveaway.details.phone')}</FieldLabel>
      <TextInput
        style={styles.textInput}
        value={phone}
        onChangeText={onPhone}
        keyboardType='phone-pad'
        autoComplete='tel'
        textContentType='telephoneNumber'
      />

      {GIVEAWAY.enableSkillQuestion && (
        <>
          <FieldLabel>{t('giveaway.details.skillQuestion')}</FieldLabel>
          <Text style={styles.skillHelp}>
            {t('giveaway.details.skillQuestionHelp')}
          </Text>
          <View style={styles.skillQuestionBox}>
            <Text style={styles.skillQuestionText}>
              {GIVEAWAY.skillQuestion} = ?
            </Text>
          </View>
          <TextInput
            style={styles.textInput}
            value={skillAnswer}
            onChangeText={onSkillAnswer}
            keyboardType='number-pad'
          />
        </>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.consentRow,
          pressed && styles.pressed,
        ]}
        onPress={() => onConsentChange(!consent)}
        accessibilityRole='checkbox'
        accessibilityState={{ checked: consent }}
      >
        <View
          style={[
            styles.checkbox,
            consent && styles.checkboxChecked,
          ]}
        >
          {consent && (
            <Check color={Theme.white} size={14} strokeWidth={3} />
          )}
        </View>
        <Text style={styles.consentText}>
          {t('giveaway.details.consent')}
        </Text>
      </Pressable>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!!submitError && (
        <Text style={[styles.errorText, styles.submitErrorText]}>
          {submitError}
        </Text>
      )}
    </View>
  );
}

function SuccessStep({ firstName }: { firstName: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.successWrap}>
      <View style={styles.successIcon}>
        <Check color={Theme.white} size={36} strokeWidth={3} />
      </View>
      <Text style={styles.title}>{t('giveaway.success.title')}</Text>
      <Text style={styles.subtitle}>
        {firstName
          ? `${firstName}, ${t('giveaway.success.subtitle')}`
          : t('giveaway.success.subtitle')}
      </Text>
      <View style={styles.successDeadlineCard}>
        <Text style={styles.countdownLabel}>
          {t('giveaway.success.deadlineLabel')}
        </Text>
        <Text style={styles.successDeadlineValue}>
          {t('giveaway.success.deadlineDate')}
        </Text>
      </View>
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  loadingRoot: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: Theme.white,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightPlaceholder: {
    width: 36,
    height: 36,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.textAlternateGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
  },
  prizeIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.black,
    lineHeight: 34,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.textAlternateGray,
    marginBottom: 24,
  },
  prompt: {
    fontSize: 16,
    lineHeight: 22,
    color: Theme.textAlternateGray,
    marginBottom: 16,
  },
  countdownCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    backgroundColor: Theme.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
  },
  countdownLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.textAlternateGray,
  },
  countdownValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.black,
    letterSpacing: -0.4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.textAlternateGray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  rulesList: {
    gap: 12,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleBullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.black,
    marginTop: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: Theme.black,
  },
  textArea: {
    minHeight: 140,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    color: Theme.black,
    backgroundColor: Theme.white,
  },
  inputError: {
    borderColor: Theme.destructive,
  },
  belowInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    minHeight: 18,
  },
  charCount: {
    fontSize: 12,
    color: Theme.textInactiveTab,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 13,
    color: Theme.destructive,
    fontWeight: '500',
  },
  submitErrorText: {
    marginTop: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.textAlternateGray,
    marginTop: 18,
    marginBottom: 6,
  },
  textInput: {
    height: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderCard,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Theme.black,
    backgroundColor: Theme.white,
  },
  skillHelp: {
    fontSize: 12,
    color: Theme.textInactiveTab,
    marginBottom: 8,
  },
  skillQuestionBox: {
    backgroundColor: Theme.surfaceGray,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
  },
  skillQuestionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Theme.black,
    fontVariant: ['tabular-nums'],
  },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Theme.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: Theme.black,
    borderColor: Theme.black,
  },
  consentText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: Theme.textAlternateGray,
  },
  successWrap: {
    alignItems: 'center',
    paddingTop: 32,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Theme.black,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successDeadlineCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    alignSelf: 'stretch',
    backgroundColor: Theme.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Theme.borderCard,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  successDeadlineValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.black,
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Theme.borderCard,
    backgroundColor: Theme.white,
  },
  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: Theme.black,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonDisabled: {
    backgroundColor: Theme.textAlternateGray,
  },
  primaryButtonText: {
    color: Theme.white,
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.6,
  },
});
