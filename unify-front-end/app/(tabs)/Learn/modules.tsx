import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { Image } from "expo-image";

const Modules = () => {
  const [selectedTag, setSelectedTag] = useState("All");

  const tags = [
    "All",
    "Housing",
    "Finance",
    "Employment",
    "Item B",
    "Item C",
    "Item D",
    "Item E",
    "Item F",
  ];

  return (
    <View>
      {/*page is vertically scrollable*/}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentBox}>
          {/* Welcome Message */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>Your Name</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            {/* I'll fix the size of the icon after */}
            <MaterialIcons
              name="search"
              size={30}
              color="#555"
              style={styles.searchIcon}
            />
            {/* we can change the placeholder text? this is just my default*/}
            <TextInput
              style={styles.searchInput}
              placeholder="Search something to learn?..."
              placeholderTextColor="#888"
            />
          </View>

          {/* Tags search*/}
          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TouchableOpacity
                key={tag}
                style={
                  selectedTag === tag
                    ? styles.tagButtonActive
                    : styles.tagButton
                }
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={
                    selectedTag === tag ? styles.tagTextActive : styles.tagText
                  }
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lesson Library section */}
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonText}>Lesson Library</Text>
          <Link href="./Lesson-library" asChild>
            <TouchableOpacity>
              <Feather name="chevron-right" size={28} color="#343434" />
            </TouchableOpacity>
          </Link>
        </View>
        {/* Horizontal scroll containing all the lessons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardContainer}
        >
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>

        {/* In-Progress Lessons section */}
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonText}>In-Progress</Text>
          <Link href="./In-progress" asChild>
            <TouchableOpacity>
              <Feather name="chevron-right" size={28} color="#343434" />
            </TouchableOpacity>
          </Link>
        </View>
        {/* Horizontal scroll containing all the lessons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardContainer}
        >
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>

        {/* Completed Lessons section */}
        <View style={styles.lessonHeader}>
          <Text style={styles.lessonText}>Completed</Text>
          <Link href="../lessons" asChild>
            <TouchableOpacity>
              <Feather name="chevron-right" size={28} color="#343434" />
            </TouchableOpacity>
          </Link>
        </View>
        {/* horizontal scroll containing all the lessons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardContainer}
        >
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentBox: {
    backgroundColor: "#EEEEEE", // Grey background for the entire box
    padding: 20,
    borderRadius: 12,
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#343434",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#343434",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: "#fff",
    padding: 10,
    height: 70,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 17,
    color: "#333",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Allows wrapping to the next line
    gap: 5, // Space between tags
  },
  tagButton: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonActive: {
    backgroundColor: "#343434",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: "#9E9E9E",
    fontSize: 14,
  },
  tagTextActive: {
    color: "#fff",
    fontSize: 14,
  },
  lessonHeader: {
    // Formats header+arrow for each lesson section
    flexDirection: "row",
    marginTop: 20,
  },
  lessonText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#343434",
  },
  cardContainer: {
    // Container holding all the lesson cards
    flexDirection: "row",
    paddingTop: 20,
    paddingRight: 20,
  },
  card: {
    // Each card as a light grey square
    backgroundColor: "#EEEEEE",
    width: 170,
    height: 170,
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
  },
  cardImage: {
    width: 50,
    height: 50,
    alignSelf: "baseline",
    marginLeft: 18,
    marginBottom: 30,
    marginTop: 25,
  },
  cardTitle: {
    alignSelf: "baseline",
    marginLeft: 18,
    marginBottom: 5,
    color: "#9F9D9D",
    fontWeight: "600",
  },
  cardDescription: {
    alignSelf: "baseline",
    marginLeft: 18,
    marginBottom: 6,
    color: "#CECECE",
    fontWeight: "600",
  },
});

export default Modules;
