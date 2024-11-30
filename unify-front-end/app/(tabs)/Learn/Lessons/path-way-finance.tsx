import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import SubLessonCard from "@/components/learn/SubLessonCard";

const PathWayFinance = () => {
  return (
    <ScrollView style={styles.container}>
      <ImageBackground
        source={require("../../../../assets/images/finance.jpg")}
        style={styles.backgroundImage}
      >
        <View style={styles.headerContentContainer}>
          <Link href="/(tabs)/Learn/modules" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Feather name="chevron-left" size={25} color="#FFFFFF" />
            </TouchableOpacity>
          </Link>
        </View>
      </ImageBackground>

      {/* Title and Description */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>Pathway to Finance</Text>
        <Text style={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sapien
          curabitur nec praesent, vel quis.
        </Text>
        <View style={{ borderBottomColor: "#EEEEEE", borderBottomWidth: 5 }} />

        <View style={styles.topicsContainer}>
          <SubLessonCard
            imageSource={require("../../../../assets/images/piggyBank.png")} // Replace with your local image
            title="Budgeting 101"
            description="Lorem ipsum odor amet, consectetur adipiscing elit,adipiscing elit."
          />
        </View>

        <View style={styles.topicsContainer}>
          <SubLessonCard
            imageSource={require("../../../../assets/images/piggyBank.png")} // Replace with your local image
            title="Budgeting 101"
            description="Lorem ipsum odor amet, consectetur adipiscing elit,adipiscing elit."
          />
        </View>

        <View style={styles.topicsContainer}>
          <SubLessonCard
            imageSource={require("../../../../assets/images/piggyBank.png")} // Replace with your local image
            title="Budgeting 101"
            description="Lorem ipsum odor amet, consectetur adipiscing elit,adipiscing elit."
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
});

export default PathWayFinance;
