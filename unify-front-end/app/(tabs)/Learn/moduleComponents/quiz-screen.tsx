import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import QuizProgressBar from "@/components/learn/QuizProgressBar";
import QuizQuestion from "@/components/learn/QuizQuestion";
import React, { useState} from "react";
import { useNavigation } from "@react-navigation/native";

const QuizScreen = () => {
  const navigation = useNavigation();
  const totalQuestions = 10; // number of total quiz questions
  const [question, changeQuestion] = useState(1); // used to change to each question

  // a function that handles what happens when the "next" button is pressed
  const nextPressed = () => {
    if (question < totalQuestions) {
      changeQuestion((prev) => prev + 1);
    }
  };
  // a function that handles what happens when "back" button is pressed
  const backPressed = () => {
    if (question === 1) {
      changeQuestion(1);
    } else {
      // go back to previous question number when back button is pressed
      changeQuestion((prev) => Math.max(prev - 1, 1));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Text style={styles.headerText}>Budgeting Level 1 Quiz</Text>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <View style={styles.contentContainer}>
        {/*Progress Bar*/}
        <QuizProgressBar completed={question} 
        total={totalQuestions} 
        question={"What is Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt?"} />

        {/*Different listed questions*/}
        <QuizQuestion question={"A. Lorem ipsum dolor sit ame sed"}/>
        <QuizQuestion question={"B. Lorem ipsum dolor sit ame sed"}/>
        <QuizQuestion question={"C. Lorem ipsum dolor sit ame sed"}/>
        <QuizQuestion question={"D. Lorem ipsum dolor sit ame sed"}/>

        {/*Back and next buttons*/}
        <View style={styles.buttonsContainer}>
          {/* back button directs to lesson page if on first question,*/}
          {/* otherwise directs to previous question  */}
          {question === 1 ? (
              <Link href="/(tabs)/Learn/Lessons/PathWayFinanceSubTopics/budgeting" asChild>
                <TouchableOpacity style={styles.backButton} onPress={() => changeQuestion(1)}>
                  <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>
              </Link>
            ) : (
              <TouchableOpacity style={styles.backButton} onPress={backPressed}>
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
            )}

          {/* display submit button when the current question is the final question */}
          {question < totalQuestions ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextPressed}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <Link href="/(tabs)/Learn/moduleComponents/quiz-completed" asChild>
              <TouchableOpacity style={styles.nextButton} onPress={() => changeQuestion(1)}>
                <Text style={styles.nextButtonText}>Submit</Text>
              </TouchableOpacity>
            </Link>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  headerContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingLeft: 30,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343434",
  },
  contentContainer: {
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 40,
  },
  buttonsContainer: {
    paddingVertical: 25,
    flexDirection: "row",
    justifyContent: "space-between"
  },
  nextButton: {
    width: 118,
    backgroundColor: "#343434",
    borderRadius: 40,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: "#fff", 
    fontSize: 17, 
    textAlign: "center"
  },
  backButton: {
    width: 105,
    borderColor: "#000",
    borderWidth: 1,
    backgroundColor: "#E7E7E9",
    borderRadius: 40,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: "#000", 
    fontSize: 17
  },
});

export default QuizScreen;