import React from "react";
import {Text, StyleSheet, TouchableOpacity } from "react-native";

interface QuizQuestionProps {
  question: string;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question
}) => {
  return (
    <TouchableOpacity style={styles.card}>
      <Text style={styles.questionText}>
        {question}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderColor: "#000",
    borderWidth: 1,
    borderRadius: 40,
    marginVertical: 10,
  },
  questionText: {
    fontSize: 19,
    color: "#000",
    margin: 10,
    marginLeft: 25,
    fontWeight: "400",
  }
});

export default QuizQuestion;