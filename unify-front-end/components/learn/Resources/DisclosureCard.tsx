import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Persistent transparency note shown at the top of the Resources view.
 * Builds trust by being upfront about the referral relationship.
 */
export default function DisclosureCard() {
  return (
    <View style={styles.container}>
      <MaterialCommunityIcons
        name='information-outline'
        size={18}
        color='#5A5A5A'
        style={styles.icon}
      />
      <Text style={styles.text}>
        Unify earns a referral fee when you use these partners. We only feature
        services we believe deliver real value to newcomers.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  icon: {
    marginRight: 8,
    marginTop: 1,
  },
  text: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#5A5A5A',
  },
});
