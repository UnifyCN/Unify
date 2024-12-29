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

const QuizScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Text style={styles.headerText}>Budgeting Level 1 Quiz</Text>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <View style={styles.contentContainer}>
        {/*Progress Bar*/}
        <QuizProgressBar completed={1} 
        total={10} 
        question={"What is Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt?"} />

        {/* Different listed questions */}
        <QuizQuestion question={"A. Lorem ipsum dolor sit ame sed"}/>
        <QuizQuestion question={"B. Lorem ipsum dolor sit ame sed"}/>
        <QuizQuestion question={"C. Lorem ipsum dolor sit ame sed"}/>
        <QuizQuestion question={"D. Lorem ipsum dolor sit ame sed"}/>

        {/* Back and next buttons */}
        <View style={styles.buttonsContainer}>
          <Link href="/(tabs)/Learn/moduleComponents/lesson-completed" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={{color: "#000", fontSize: 17}}>Back</Text>
            </TouchableOpacity>
          </Link>
          <Link href="/(tabs)/Learn/moduleComponents/quiz-completed" asChild>
            <TouchableOpacity style={styles.nextButton}>
              <Text style={{color: "#fff", fontSize: 17}}>Next</Text>
            </TouchableOpacity>
          </Link>
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
    width: 100,
    backgroundColor: "#343434",
    borderRadius: 40,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
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
});

export default QuizScreen;