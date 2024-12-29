import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Modal
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";

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
        <Link href="/(tabs)/Learn" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="chevron-left" size={25} />
          </TouchableOpacity>
        </Link>
        <Text style={styles.headerText}>Budgeting Level 1</Text>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <Image source={require("../../../../assets/images/lessonCompleted.png")} style={styles.image}></Image>
      <Text style={styles.title}>Lesson Completed!</Text>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 3, marginLeft: 80, marginRight: 80}}/>
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
        <Text style={{color: "#fff", fontSize: 17}}>Next</Text>
      </TouchableOpacity>

      {/* Modal: fades in when next button is pressed */}
      <Modal transparent visible={showModal} animationType="fade">
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <Image source={require("../../../../assets/images/warn.png")} style={styles.image}></Image>
          <Text style={{fontWeight: "bold", fontSize: 17}}>Are you ready for the quiz?</Text>
          {/* Proceed to quiz*/}
          <Link href="/(tabs)/Learn/moduleComponents/quiz-screen" asChild>
            <TouchableOpacity style={styles.modalButton}
              onPress={() => setShowModal(false)}>
              <Text style={[styles.buttonText, {color: "#FFFFFF"}]}>Yes, I am ready for the quiz!</Text>
            </TouchableOpacity>
          </Link>
          {/* Go back to key takeaways*/}
          <TouchableOpacity style={[styles.modalButton, styles.modalBottomButton]}
            onPress={() => setShowModal(false)}>
            <Text style={[styles.buttonText, {color: "#000000"}]}>No, go back to key takeaways</Text>
          </TouchableOpacity>
        </View>
      </View>
      </Modal>
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
  modal: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 24, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  modalContent: {
    width: '80%',
    height: 305,
    backgroundColor: '#fff', 
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 11,
    borderRadius: 20,
    marginVertical: 5,
    alignItems: 'center',
    width: "auto",
    backgroundColor: '#3FADF2', 
    marginTop: 22
  },
  modalBottomButton: {
    backgroundColor: '#F5F5F5', 
    borderWidth: 1, 
    borderColor: '#000000', 
    marginTop: 10
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    paddingHorizontal: 25,
  },
});

export default LessonCompleted;