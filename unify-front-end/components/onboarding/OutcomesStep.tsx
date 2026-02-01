import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface OutcomesStepProps {
  onNext: () => void;
}

interface OutcomeCardProps {
  icon: React.ComponentProps<typeof Feather>['name'];
  title: string;
  description: string;
}

function OutcomeCard({ icon, title, description }: OutcomeCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.cardIcon}>
        <Feather name={icon} size={18} color={Theme.primaryGatherRed} />
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function OutcomesStep({ onNext }: OutcomesStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Here’s what you can achieve in 3 months</Text>
        <View style={styles.outcomesContainer}>
          <OutcomeCard
            icon='compass'
            title='Navigate with confidence'
            description='Build the essentials to feel at home in Canada.'
          />
          <OutcomeCard
            icon='zap'
            title='Get fast, trusted answers'
            description='Reliable guidance when you need it.'
          />
          <OutcomeCard
            icon='users'
            title='Build your community'
            description='Connect with people on similar journeys.'
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
    paddingBottom: 24,
    justifyContent: 'flex-start',
    backgroundColor: Theme.white,
  },
  content: {
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Theme.black,
    marginBottom: 20,
    textAlign: 'left',
    lineHeight: 34,
  },
  outcomesContainer: {
    width: '100%',
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.surfaceGray,
    backgroundColor: '#FAFAFA',
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.surfaceGray,
    backgroundColor: Theme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.black,
    lineHeight: 24,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 15,
    color: Theme.textInput,
    lineHeight: 22,
  },
});
