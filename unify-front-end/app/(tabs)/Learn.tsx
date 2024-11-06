import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";

const LearnScreen = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Unify</Text>
        <Feather name="bell" size={24} color="black" />
      </View>

      <View style={styles.contentBox}>
        {/* Welcome Message */}
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome</Text>
          <Text style={styles.userName}>Your Name</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <MaterialIcons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for lessons..."
            placeholderTextColor="#888"
          />
        </View>

        {/* Tags */}
        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.tagButtonActive}>
              <Text style={styles.tagTextActive}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagButton}>
              <Text style={styles.tagText}>Housing</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagButton}>
              <Text style={styles.tagText}>Finance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagButton}>
              <Text style={styles.tagText}>Employment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagButton}>
              <Text style={styles.tagText}>Item B</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagButton}>
              <Text style={styles.tagText}>Item C</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
  },
  contentBox: {
    backgroundColor: "#e0e0e0", // Grey background for the entire box
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    marginRight: 10,
  },
  tabButtonActive: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    marginRight: 10,
  },
  tabText: {
    fontSize: 16,
    color: "#888",
  },
  tabTextActive: {
    fontSize: 16,
    color: "#333",
    fontWeight: "bold",
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: "#fff",
    padding: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#333",
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  tagButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  tagButtonActive: {
    backgroundColor: "#333",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    color: "#333",
    fontSize: 14,
  },
  tagTextActive: {
    color: "#fff",
    fontSize: 14,
  },
});

export default LearnScreen;
