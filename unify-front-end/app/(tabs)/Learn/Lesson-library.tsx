import React from "react";
import { View, Text, StyleSheet } from "react-native";

const LessonLibrary = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Lesson Library</Text>
      {/* Add components or logic for displaying lessons */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#343434",
    marginBottom: 20,
  },
});

export default LessonLibrary;
