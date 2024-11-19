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
import { ProgressSection } from "@/components/ProgressSection";

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

        {/* padding so that navigation doesn't hide lesson cards at bottom */}
        <View style={{paddingBottom: 50}}>
          {/* Progress sections holding lessons cards */}
          <ProgressSection header="Lesson Library" navigatePage={"./Lesson-library"} />
          <ProgressSection header="In-Progress" navigatePage={"./In-progress"}/>
          <ProgressSection header="Complete"navigatePage={"../lessons"}/>
        </View>
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
});

export default Modules;
