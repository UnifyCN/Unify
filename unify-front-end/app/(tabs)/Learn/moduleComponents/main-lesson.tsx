import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ScrollView,
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";
import TopicCard from "@/components/learn/TopicCard";

const MainLesson = () => {

  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  return (
    <ScrollView>
      <View style={styles.container}>
        {/* Header Image */}
        <Image source={require("../../../../assets/images/lessonsImg.png")} 
        style={[styles.headerImg, {width: screenWidth, height: screenHeight*.4}]}/>
      
        {/* Header*/}
        <View style={[styles.headerContainer,{paddingBottom:screenHeight*.4}]}>
          {/* Back Button and Learn Text */}
          <View style={styles.headerContentContainer}>
            <Link href="/(tabs)/Learn/modules" asChild>
              <TouchableOpacity style={styles.backButton}>
                <Feather name="chevron-left" size={28} color="#343434" />
              </TouchableOpacity>
            </Link>
          </View>
          {/* Header Icons */}
          <View style={styles.headerContentContainer}>
            {/* Search Icon */}
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="search" size={24} color="black" />
            </TouchableOpacity>
            {/* Bell Icon */}
            <TouchableOpacity style={styles.iconButton}>
              <Feather name="bell" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Topic + Details Section */}
        <View style={styles.headerContent}>
          {/* Title */}
          <Text style={styles.titleText}>Pathway to Finance (?)</Text>
          <Text style={[styles.titleDetails, {color: "#CECECE"}]}>Relevant information about the lesson</Text>
          <Text style={[styles.titleDetails, {color: "#9F9D9D"}]}>More details</Text>
          {/* Horizontal Divider */}
          <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 3,}}/>
          <View style={{marginTop: 25}}>
            <Text style={styles.topicText}>Topics</Text>
          </View>

          {/*Subtopic Cards */}
          <View style= {styles.scrollContainer}>
            <TopicCard
              icon={require("../../../../assets/images/placeholderImg.png")}
              subTopicTitle="topic"
              description="description"/>
            <TopicCard
              icon={require("../../../../assets/images/placeholderImg.png")}
              subTopicTitle="topic"
              description="description"/>
            <TopicCard
              icon={require("../../../../assets/images/placeholderImg.png")}
              subTopicTitle="topic"
              description="description"/>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  headerImg: {
    position: "absolute",
    alignSelf: "center",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerContentContainer: {
    flexDirection: "row",
  },
  backButton: {
    marginRight: 8,
  },
  iconButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  titleText: {
    fontWeight: "600",
    fontSize: 29,
    marginBottom: 13,
    alignSelf: "flex-start",
    color: "#343434"
  },
  titleDetails: {
    fontWeight: "500",
    fontSize: 16,
    marginBottom: 10,
    alignSelf: "flex-start",
  },
  topicText: {
    fontSize: 22,
    fontWeight: "600",
    color: "343434",
    marginBottom: 20,
  },
  scrollContainer: {
    paddingBottom: 20, 
    borderRadius: 12,
  }
});

export default MainLesson;