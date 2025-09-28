import { View, Text, StyleSheet } from 'react-native';

interface EmptyFeedMessageProps {
  message: string;
  submessage: string;
}

const EmptyFeedMessage = ({ message, submessage }: EmptyFeedMessageProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.submessage}>{submessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  submessage: {
    fontSize: 14,
    color: '#666',
  },
});

export default EmptyFeedMessage;
