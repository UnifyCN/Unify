import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Link } from "expo-router";

const LessonLibrary = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        {/* Back to Learnbutton */}
        <View style={styles.backButtonAndLearnContainer}>
          <Link href="/(tabs)/Learn/modules" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Feather name="chevron-left" size={28} color="#343434" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.learnText}>Learn</Text>
        </View>

        {/* Bell Icon */}
        <TouchableOpacity style={styles.bellButton}>
          <Feather name="bell" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.headerText}>Lesson Library</Text>

        {/* Search bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={30}
            color="#555"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search a lesson..."
            placeholderTextColor="#888"
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    marginLeft: 8,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    // padding: 8,
  },
  bellButton: {
    padding: 8,
  },
  headerText: {
    fontWeight: "600",
    fontSize: 29,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  content: {
    margin: 8,
  },
  backButtonAndLearnContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  learnText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343434",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: "#fff",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
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
});

export default LessonLibrary;
