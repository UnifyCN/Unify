import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { Link, useLocalSearchParams, router, Stack, Redirect } from "expo-router";

import LessonCard from "@/components/learn/LessonCard";

export default function SubSetPage(){
    // In progress, complete, or favourite, display those use the same format so it's a matter of fetching the correct one based on url
    const { subset } = useLocalSearchParams();
    
    return(
        <View style={styles.container}>
            {/*Configure stack behavior dynamically*/}
            <Stack.Screen options={{title: subset as string}}/>
            {/* Header 
            Todo: Refactor header into its own component*/}
            <View style={styles.headerContainer}>
            {/* Back Button and Learn Text */}
                <View style={styles.backButtonAndLearnContainer}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Feather name="chevron-left" size={28} color="#343434" />
                    </TouchableOpacity>
                    <Text style={styles.learnText}>Learn</Text>
                </View>

                {/* Bell Icon */}
                <TouchableOpacity style={styles.bellButton}>
                    <Feather name="bell" size={24} color="black" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Title */}
                <Text style={styles.headerText}>{subset}</Text>
                    {/* Search bar */}
                    <View style={styles.searchContainer}>
                        <MaterialIcons
                        name="search"
                        size={20}
                        color="#888"
                        style={styles.searchIcon}
                        />
                        <TextInput
                        style={styles.searchInput}
                        placeholder="Search a lesson..."
                        placeholderTextColor="#888"
                        />
                    </View>
                {/*Todo: Add the logic for fetching then map it here to render out the content */}
                <ScrollView contentContainerStyle={styles.scrollViewContent}>
                    <LessonCard
                        imageSource={require("@/assets/images/CoverLetter.jpeg")}
                        title="Pathway to Employment"
                        description="A brief description of the lesson goes here."
                        style={{ borderRadius: 35 }}
                    />
                </ScrollView>
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: "#fff",
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    backButtonAndLearnContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    backButton: {
      marginRight: 8,
    },
    learnText: {
      fontSize: 20,
      fontWeight: "600",
      color: "#343434",
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
      flex: 1,
      marginLeft: 8,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      borderRadius: 8,
      backgroundColor: "#fff",
      padding: 10,
      borderWidth: 1,
      borderColor: "#ccc",
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
    scrollViewContent: {
      paddingBottom: 20, // Add padding to the bottom to ensure all content is visible
    },
  });