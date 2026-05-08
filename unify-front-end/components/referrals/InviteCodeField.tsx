import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';

interface InviteCodeFieldProps {
  value: string;
  onChange: (code: string) => void;
  /** When true, indicates code came from clipboard auto-detect — render dimmed but editable. */
  autoFilled?: boolean;
}

const CODE_MAX = 6;

/**
 * Onboarding step 3 — "Their invite code" input. Shown only when the user
 * selected `friends_family` as their referral source. If a code was detected
 * via clipboard, the field is pre-filled and dimmed but still editable.
 */
export function InviteCodeField({ value, onChange, autoFilled }: InviteCodeFieldProps) {
  const { t } = useTranslation();
  const label = autoFilled
    ? t('referrals.theirInviteCode')
    : t('referrals.theirInviteCodeOptional');

  const handleChange = (next: string) => {
    const cleaned = next
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .replace(/[01IO]/g, '')
      .slice(0, CODE_MAX);
    onChange(cleaned);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, autoFilled && styles.inputAutoFilled]}
        value={value}
        onChangeText={handleChange}
        placeholder={t('referrals.inviteCodePlaceholder')}
        placeholderTextColor={Theme.textPostTime}
        autoCapitalize='characters'
        autoCorrect={false}
        spellCheck={false}
        maxLength={CODE_MAX}
        accessibilityLabel={t('referrals.theirInviteCode')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    width: '100%',
  },
  label: {
    fontSize: 14,
    color: Theme.textAlternateGray,
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: Theme.surfaceTextInput,
    fontSize: 18,
    letterSpacing: 2,
    color: Theme.black,
    fontFamily: 'monospace',
  },
  inputAutoFilled: {
    color: Theme.textInput, // dimmed to indicate auto-fill, but the field is still editable
  },
});
