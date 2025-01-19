import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";

const QuizCompleted = () => {

  // each bullet point note in key takeaways would go here
  const bulletList = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Text style={styles.headerText}>Budgeting Level 1 Quiz</Text>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1}}/>

      <Image source={require("@/assets/images/quizCompleted.png")} style={styles.image}></Image>
      <Text style={styles.title}>Congratulations! You’ve passed the quiz!</Text>
      <Text style={styles.quizResultText}>You got 7/10 correct!</Text>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 3, marginLeft: 80, marginRight: 80}}/>
      <Text style={styles.subTitle}>Let's Review!</Text>

      <View style={styles.textContainer}>
        {bulletList.map((item, index) => (
          <View style={styles.listItem} key={index}>
            <Text style={styles.notes}>{index + 1}.  </Text>
            <Text style={styles.notes}>{item}</Text>
          </View>
        ))}
        <Text style={styles.subTitle}>What’s the Next Step?</Text>
        <Text style={styles.bottomText}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.
        </Text>
      </View>

      <Link href="/learn/Lessons/PathWayFinanceSubTopics/budgeting" asChild>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backButtonText}>Back to Budgeting 101</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  image: {
    alignSelf: "center",
    marginTop: 35,
    marginBottom: 20,
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
  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 10,
    color: "#343434",
    alignSelf: "center",
    textAlign: "center",
    width: 300,
  },
  subTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginVertical: 12,
    color: "#000000",
    alignSelf: "center",
  },
  quizResultText: {
    fontSize: 22,
    fontWeight: 500,
    marginBottom: 15,
    color: "#000",
    alignSelf: "center",
    textAlign: "center",
  },
  textContainer: {
    paddingHorizontal: 20,
    marginHorizontal: 15,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  notes: {
    fontSize: 17,
    color: "#000",
    marginBottom: 16,
  },
  bottomText: {
    fontSize: 17,
    color: "#000",
    marginBottom: 30,
    textAlign: "center",
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  backButton: {
    marginBottom: 60,
    width: 236,
    borderRadius: 40,
    alignSelf: "center",
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#343434",
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    paddingHorizontal: 25,
  },
  backButtonText: {
    color: "#fff", 
    fontSize: 17
  },
});

export default QuizCompleted;