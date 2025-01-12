import React from "react";
import {useState, useEffect} from "react";
import {Text, StyleSheet, TouchableOpacity, View } from "react-native";

interface QuizQuestionProps {
  question: string;
  answers: string[];
  correctAnswer: string;
  selectedAnswer: any;
  addWrongAnswer: any;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  answers,
  correctAnswer,
  selectedAnswer,
  addWrongAnswer,
}) => {

  const [onAnswerSelect, setSelectedAnswer] = useState(null);
  const [answerColor, setAnswerColor] = useState<string>('white');

  // whenever the question changes, reset the selected answer + its color
  useEffect(() => {
    setSelectedAnswer(null);
  }, [question]);


  // when an answer is pressed, it sets it as the current selected answer + checks if it is correct
  const answerPressed = (answer: any) => {
    setSelectedAnswer(answer);
    const isCorrect = answer === correctAnswer;
    selectedAnswer(isCorrect);
    
    if (!isCorrect) {
      addWrongAnswer(answer);
    }
  };

  return (
    <View>
      <Text style={styles.questionText}>
        {question}
      </Text>

      {answers.map((answer, index) => {
        // change the color of the selected answer based on whether it is wrong/right
        const backgroundColor =
          onAnswerSelect === answer
            ? answer === correctAnswer
              ? "#E2FFC6"
              : "#FFC1C1" 
            : "white";

        return (
          <TouchableOpacity
            key={index}
            style={[styles.card, { backgroundColor }]}
            onPress={() => answerPressed(answer)}
            // disable answer selection once an answer has been chosen
            disabled={!!onAnswerSelect}
          >
            <Text style={styles.answerText}>{answer}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
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
  answerText: {
    fontSize: 19,
    color: "#000",
    margin: 10,
    marginLeft: 25,
    fontWeight: "400",
  },
  questionText: {
    fontSize: 19,
    color: "#333",
    marginBottom: 25,
  },
  correct: {
    backgroundColor: "#c8e6c9", 
    borderColor: "#fff",
  },
  wrong: {
    backgroundColor: "#ffcdd2",
    borderColor: "#fff",
  },
});

export default QuizQuestion;