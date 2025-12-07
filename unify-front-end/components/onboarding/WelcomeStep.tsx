import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';
import UnifyLogo from '../../components/icons/UnifyLogo.svg';

interface WelcomeStepProps {
  onNext: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <UnifyLogo width={100} height={100} style={styles.logo} />
        <Text style={styles.title}>Welcome to Unify!</Text>
        <Text style={styles.body}>
          We're here to make your first steps in Canada easier. Answer a few
          quick questions so we can understand your journey.
        </Text>
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
  },
});

