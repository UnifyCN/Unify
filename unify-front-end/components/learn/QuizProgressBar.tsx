import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

interface QuizProgressBarProps {
  completed: number;
  total: number;
}

const QuizProgressBar: React.FC<QuizProgressBarProps> = ({
  completed,
  total,
}) => {
  const percentage = (completed / total) * 100;

  return (
    <View style={styles.container}>
      {/* Progress Bar Container */}
      <View style={styles.progressBarContainer}>
        {/* Gradient Progress Bar */}
        <ExpoLinearGradient
          colors={["#000000", "#888888"]} // Gradient colors
          style={[styles.progressBar, { width: `${percentage}%` }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </View>
      {/* Progress Text */}
      <Text style={styles.progressText}>
        Progress: {completed}/{total} questions completed
      </Text>
      {/* Display current question shown */}
      <Text style={styles.questionHeader}>
        Question {completed}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  progressText: {
    fontSize: 19,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  questionHeader: {
    fontSize: 25,
    color: "#34343",
    marginBottom: 10,
    marginTop: 30,
    fontWeight: "500",
  },
  progressBarContainer: {
    height: 10,
    width: "100%",
    backgroundColor: "#e0e0e0",
    marginBottom: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 5,
  },
});

export default QuizProgressBar;
