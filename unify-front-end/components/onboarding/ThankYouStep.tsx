import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Theme } from '@/constants/Theme';

interface ThankYouStepProps {
  isRedo?: boolean;
}

export default function ThankYouStep({ isRedo = false }: ThankYouStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../assets/images/logo-with-name.png')}
          style={styles.logo}
          resizeMode='contain'
        />
        <Text style={styles.headline}>
          {isRedo ? (
            <>
              Profile <Text style={styles.headlineItalic}>updated</Text>
            </>
          ) : (
            <>
              Your journey to Canada,{' '}
              <Text style={styles.headlineItalic}>simplified</Text>
            </>
          )}
        </Text>
        <Text style={styles.body}>
          {isRedo
            ? 'Your preferences have been updated. Your Checklist and Companion responses will now reflect your latest answers.'
            : "You're all set to start exploring Unify. We'll keep working to make your journey easier!"}
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
    width: '100%',
  },
  logo: {
    width: 280,
    height: 120,
    marginBottom: 10,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  headlineItalic: {
    fontStyle: 'italic',
    fontWeight: '700',
    color: Theme.primaryGatherRed,
  },
  body: {
    fontSize: 20,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
});
