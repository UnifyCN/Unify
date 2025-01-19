import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Dimensions,
  ScrollView,
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link, useLocalSearchParams, router, Stack } from "expo-router";
import SubLessonCard from "@/components/learn/SubLessonCard";

const MainTopic = () => {
  const { mainTopic } = useLocalSearchParams();
  //TODO: add a fetch logic for main topic and use it to create the title of the page, if the fetch doesn't exists, redirect to not-found
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{title: mainTopic as string}}/>
      <ImageBackground
        source={require("@/assets/images/finance.jpg")}
        style={styles.backgroundImage}
        >
        <View style={styles.headerContentContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => {router.back()}}>
            <Feather name="chevron-left" size={25} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ImageBackground>

      {/* Title and Description */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{mainTopic}</Text>
        <Text style={styles.description}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sapien
          curabitur nec praesent, vel quis.
        </Text>
        <View style={{ borderBottomColor: "#EEEEEE", borderBottomWidth: 5 }} />
        <Text style={styles.topicsTitle}>Topics</Text>
        {/* Topics */}
        {/*TODO: use a map method to map to SubLessonCard
        Rename this MainTopicCard */}
        <View style={styles.topicsContainer}>
          <SubLessonCard
            imageSource={require("@/assets/images/piggyBank.png")}
            title="Budgeting 101"
            description="Lorem ipsum odor amet, consectetur adipiscing elit,adipiscing elit."
            link="/(tabs)/learn/Lessons/PathWayFinanceSubTopics/budgeting"
            />
          <SubLessonCard
            imageSource={require("@/assets/images/piggyBank.png")}
            title="Saving Strategies"
            description="Lorem ipsum odor amet, consectetur adipiscing elit,adipiscing elit."
            link="/(tabs)/learn/Lessons/PathWayFinanceSubTopics/budgeting"
            />
        </View>
      </View>
    </ScrollView>
  );
}
const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  backgroundImage: {
    width: width,
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
    color: "#343434",
  },
  description: {
    fontSize: 16,
    color: "#343434",
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

export default MainTopic;