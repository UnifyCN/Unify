import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import React, { useState } from "react";
import { Feather } from "@expo/vector-icons";
import QuizProgressBar from "@/components/learn/QuizProgressBar";
import QuizQuestion from "@/components/learn/QuizQuestion";
import PopupModal from "@/components/learn/PopupModal";
import { useRouter } from "expo-router";

const QuizScreen = () => {
  const router = useRouter();
  const questions = [
    {
      question:
        "What is an example of a measurable metric in a resume bullet point?",
      options: [
        "A. Collaborated on a project to improve sales.",
        "B. Increased engagement by 35% through targeted social media campaigns.",
        "C. Worked on advertising for an app.",
        "D. Assisted team members with technical tasks.",
      ],
      correctAnswer: "B. Increased engagement by 35% through targeted social media campaigns.",
    },
    {
      question:
        "Resumes for engineering and technical roles should avoid listing specific tools or software to keep the format clean.",
      options: [
        "A. True",
        "B. False",
      ],
      correctAnswer: "B. False",
    },
    {
      question:
        "Tailoring your resume to include keywords and skills from a job description helps avoid disqualification by automated resume-sorting systems.",
      options: [
        "A. True",
        "B. False",
      ],
      correctAnswer: "A. True",
    },
    {
      question:
        "Which of the following is not a soft skill?",
      options: [
        "A. Communication",
        "B. Leadership",
        "C. Photoshop proficiency",
        "D. Teamwork",
      ],
      correctAnswer: "C. Photoshop proficiency",
    },
  ];

  // show/hide back + submit modal
  const [showBackModal, setShowBackModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [currentQuestion, changeQuestion] = useState(0);
  // keeps track of wrong/selected answers
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<any[]>([]);

  const nextPressed = () => {
    if (currentQuestion < questions.length - 1) {
      changeQuestion((prev) => prev + 1);
    }
  };

  const backPressed = () => {
    if (currentQuestion > 0) {
      changeQuestion((prev) => prev - 1);
    }
  };

  const submitPressed = () => {
    // go through each question, find wrong answers
    const incorrectAnswers = questions
      .map((q, index) => {
        // get selected answers
        const selected = selectedAnswers[index];
         // return values only if its incorrect, otherwise return null, then filter null items
        return selected !== q.correctAnswer
          ? {
              question: q.question,
              options: q.options,
              correctAnswer: q.correctAnswer,
              selectedAnswer: selected,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
    // store the wrong answers
    setWrongAnswers(incorrectAnswers);
    setShowSubmitModal(true);
  };

  const headBackPressed = () => {
    setShowBackModal(true);
  };

  // handles answer selection
  const answerSelected = (answer: string) => {
    const updatedAnswers = [...selectedAnswers];
    // change the answer for the current question
    updatedAnswers[currentQuestion] = answer;
    setSelectedAnswers(updatedAnswers);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <TouchableOpacity
          style={styles.backToLessonButton}
          onPress={headBackPressed}
        >
          <Feather name="chevron-left" size={25} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Key Takeaways</Text>
      </View>
      <View style={{ borderBottomColor: "#EEEEEE", borderBottomWidth: 1 }} />
      <View style={styles.contentContainer}>
        <View>
          <Text style={styles.quizTitle}>Budgeting Level 1 Quiz</Text>
        </View>
        {/*Progress Bar*/}
        <QuizProgressBar
          completed={currentQuestion + 1}
          total={questions.length}
        />
        {/*Different listed questions*/}
        <QuizQuestion
          question={questions[currentQuestion].question}
          answers={questions[currentQuestion].options}
          selectedAnswer={answerSelected}
          currentAnswer={selectedAnswers[currentQuestion]}
        />
        {/*Back and next buttons*/}
        <View style={styles.buttonsContainer}>
          {/* back button directs to lesson page if on first question,*/}
          {/* otherwise directs to previous question  */}
          {currentQuestion === 0 ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={headBackPressed}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.backButton} onPress={backPressed}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          {/* display submit button when the current question is the final question */}
          {currentQuestion + 1 < questions.length ? (
            <TouchableOpacity style={styles.nextButton} onPress={nextPressed}>
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextButton} onPress={submitPressed}>
              <Text style={styles.nextButtonText}>Submit</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/*Modals*/}
      <PopupModal
        question="Are you sure you want to exit the quiz?"
        topResponse="Yes, go back to key takeaways"
        bottomResponse="No, continue with the quiz"
        show={showBackModal}
        setShow={() => setShowBackModal(false)}
        link="/(tabs)/learn/lesson-completed"
        confirm={() => {
          // reset questions when user confirms exit
          changeQuestion(0);
          setShowBackModal(false);
          // reset stored/selected answers if exiting quiz
          setSelectedAnswers([]);
          setWrongAnswers([]);
        }}
      />
      <PopupModal
        question="Are you sure you want to submit the quiz?"
        topResponse="Yes, submit the quiz!"
        bottomResponse="No, go back to questions"
        show={showSubmitModal}
        setShow={() => setShowSubmitModal(false)}
        confirm={() => {
          // router.push({
          //   pathname: "/(tabs)/learn/quiz-completed",
          //   params: { wrongAnswers: JSON.stringify(wrongAnswers), totalQuestions: questions.length},
          // });
          changeQuestion(0);
          setWrongAnswers([]);
          setSelectedAnswers([]);
          setShowSubmitModal(false);
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backToLessonButton: {
    padding: 8,
  },
  headerContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343434",
  },
  quizTitle: {
    fontSize: 17,
    color: "#333",
    marginBottom: 5,
    fontWeight: "600",
  },
  contentContainer: {
    padding: 20,
    marginHorizontal: 15,
    marginBottom: 40,
  },
  buttonsContainer: {
    paddingVertical: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  nextButton: {
    width: 118,
    backgroundColor: "#343434",
    borderRadius: 40,
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 17,
    textAlign: "center",
  },
  backButton: {
    width: 105,
    borderColor: "#000",
    borderWidth: 1,
    backgroundColor: "#E7E7E9",
    borderRadius: 40,
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  backButtonText: {
    color: "#000",
    fontSize: 17,
  },
});

export default QuizScreen;
