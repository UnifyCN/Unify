import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Theme } from '@/constants/Theme';

interface OutcomesStepProps {
  onNext: () => void;
}

export default function OutcomesStep({ onNext }: OutcomesStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Here's what you can achieve in 3 months:
        </Text>
        <View style={styles.outcomesContainer}>
          <View style={styles.outcomeItem}>
            <Text style={styles.outcomeHeading}>
              Navigate Canada with confidence
            </Text>
            <Text style={styles.outcomeSubtext}>
              Master essential skills and knowledge to feel at home in your new
              country
            </Text>
          </View>
          <View style={styles.outcomeItem}>
            <Text style={styles.outcomeHeading}>
              Get fast, trustworthy answers
            </Text>
            <Text style={styles.outcomeSubtext}>
              Access reliable information and expert guidance whenever you need
              it
            </Text>
          </View>
          <View style={styles.outcomeItem}>
            <Text style={styles.outcomeHeading}>
              Build your community & support network
            </Text>
            <Text style={styles.outcomeSubtext}>
              Connect with others on similar journeys and create lasting
              friendships
            </Text>
          </View>
        </View>
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
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 40,
    textAlign: 'left',
    lineHeight: 36,
  },
  outcomesContainer: {
    width: '100%',
  },
  outcomeItem: {
    width: '100%',
    paddingBottom: 24,
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: Theme.surfaceGray,
  },
  outcomeHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 8,
    lineHeight: 28,
  },
  outcomeSubtext: {
    fontSize: 16,
    color: Theme.textInput,
    lineHeight: 24,
  },
});
