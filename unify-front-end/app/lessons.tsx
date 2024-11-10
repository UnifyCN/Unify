import { Text, View, StyleSheet } from 'react-native';


export default function LessonsPage() {
  return (
    <View style={styles.container}>
      <Text>Lessons screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#fff",
  },
});