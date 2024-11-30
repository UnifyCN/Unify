import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import LessonProgressBar from "@/components/learn/LessonProgressBar";

const Budgeting = () => {
  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={require("../../../../../assets/images/piggyBank.png")}
        style={styles.backgroundImage}
      >
        <View style={styles.headerContentContainer}>
          <Link href="/(tabs)/Learn" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Feather name="chevron-left" size={25} color="#FFFFFF" />
            </TouchableOpacity>
          </Link>
        </View>
      </ImageBackground>

      {/* Title and Description */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Budgeting 101</Text>
        <Text style={styles.description}>
          Learn the basics of budgeting to manage your finances effectively.
        </Text>
        {/* Lesson Progress Bar, just put in completed/total lesson and it'll dynamically render*/}
        <LessonProgressBar completed={2} total={3} />
        <View style={{ borderBottomColor: "#EEEEEE", borderBottomWidth: 3 }} />
        <Text style={styles.topicsTitle}>Lessons</Text>
        {/* Add your topics content here */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundImage: {
    width: "100%",
    height: 350, // Fixed height for the background image
  },
  headerContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  textContainer: {
    padding: 20,
    marginLeft: 15,
    marginRight: 15,
    marginBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#505152",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  topicsContainer: {
    marginTop: 10,
  },
  topicsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#505152",
  },
});

export default Budgeting;
