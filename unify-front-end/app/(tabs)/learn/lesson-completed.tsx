import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";
import PopupModal from "@/components/learn/PopupModal";

const LessonCompleted = () => {

  // each bullet point note in key takeaways would go here
  const bulletList = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna.",
  ];
  // Controls whether the modal that prompts quiz is displayed or not
  const [showModal, setShowModal] = useState(false)

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Link href="/(tabs)/Learn/Lessons/PathWayFinanceSubTopics/budgeting" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="chevron-left" size={25} />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerText}>Budgeting Level 1</Text>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <Image source={require("../../../../assets/images/lessonCompleted.png")} style={styles.image}></Image>
      <Text style={styles.title}>Lesson Completed!</Text>
      <View style={styles.titleDivider}/>
      <Text style={styles.subTitle}>Key Takeaways</Text>

      <View style={styles.textContainer}>
        {bulletList.map((item, index) => (
          <View style={styles.listItem} key={index}>
            <Text style={styles.listBullet}>•  </Text>
            <Text style={styles.notes}>{item}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.nextButton} onPress={() => setShowModal(true)}>
        <Text style={styles.nextButtonText}>Next</Text>
      </TouchableOpacity>

      <PopupModal
        question = "Are you ready for the quiz?"
        topResponse = "Yes, I am ready for the quiz!"
        bottomResponse = "No, go back to key takeaways"
        show={showModal}
        setShow={() => setShowModal(false)}
        link="/(tabs)/Learn/moduleComponents/quiz-screen"
        confirm={() => {setShowModal(false);}}
      />

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
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343434",
  },
  titleDivider: {
    borderBottomColor: '#EEEEEE', 
    borderBottomWidth: 3, 
    marginHorizontal: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    marginBottom: 15,
    color: "#343434",
    alignSelf: "center",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginTop: 12,
    color: "#000000",
    alignSelf: "center",
  },
  textContainer: {
    padding: 20,
    marginHorizontal: 15,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  notes: {
    fontSize: 17,
    color: "#6000000",
    marginBottom: 16,
  },
  listBullet: {
    fontWeight: 'bold',
    fontSize: 22,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nextButton: {
    marginBottom: 60,
    width: 100,
    borderRadius: 40,
    alignSelf: "center",
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: "#343434",
  },
  nextButtonText: {
    color: "#fff", 
    fontSize: 17, 
    textAlign: "center"
  },
});

export default LessonCompleted;