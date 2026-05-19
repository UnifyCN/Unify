import React, { useRef } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Theme } from '@/constants/Theme';
import UnifyLogo from '../../components/icons/UnifyLogo.svg';

interface WelcomeStepProps {
  onNext: () => void;
  isRedo?: boolean;
  firstName: string;
  onChangeFirstName: (value: string) => void;
}

export default function WelcomeStep({
  onNext,
  isRedo = false,
  firstName,
  onChangeFirstName,
}: WelcomeStepProps) {
  const { t } = useTranslation();
  const inputRef = useRef<TextInput>(null);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <UnifyLogo width={100} height={100} style={styles.logo} />
        <Text style={styles.title}>
          {isRedo
            ? 'Update Your Profile'
            : t('quiz.welcome.titleNew')}
        </Text>
        <Text style={styles.body}>
          {isRedo
            ? "Things change — let's update your answers so we can give you better recommendations and responses."
            : t('quiz.welcome.subtitleNew')}
        </Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={firstName}
          onChangeText={onChangeFirstName}
          placeholder={t('quiz.firstName.placeholder')}
          placeholderTextColor={Theme.textInput}
          maxLength={24}
          autoCapitalize='words'
          autoCorrect={false}
          returnKeyType='next'
          autoFocus={!isRedo}
          onSubmitEditing={() => {
            if (firstName.trim()) onNext();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    backgroundColor: Theme.white,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 16,
    textAlign: 'center',
  },
  body: {
    fontSize: 18,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '90%',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: Theme.borderInfoText,
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 18,
    color: Theme.black,
    textAlign: 'center',
  },
});
