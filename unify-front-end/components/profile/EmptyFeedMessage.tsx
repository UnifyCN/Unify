import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface EmptyFeedMessageProps {
  message: string;
  submessage?: React.ReactNode;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const EmptyFeedMessage = ({
  message,
  submessage,
  icon,
  style,
}: EmptyFeedMessageProps) => {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.message}>{message}</Text>
      {submessage}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 200,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 10,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
});

export default EmptyFeedMessage;
