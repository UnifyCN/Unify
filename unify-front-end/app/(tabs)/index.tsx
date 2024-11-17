import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, useColorScheme, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [selectedTag, setSelectedTag] = useState<keyof typeof cardData>("For you")

  const tags = [
    "For you",
    "Following",
    "Groups",
  ];

  const cardData = {
    "For you": [
      { title: "Lesson 1", description: "Description 1", image: require("../../assets/images/placeholderImg.png") },
      { title: "Lesson 2", description: "Description 2", image: require("../../assets/images/placeholderImg.png") },
    ],
    "Following": [
      { title: "Following Lesson 1", description: "Description 1", image: require("../../assets/images/placeholderImg.png") },
      { title: "Following Lesson 2", description: "Description 2", image: require("../../assets/images/placeholderImg.png") },
    ],
    "Groups": [
      { title: "Group Lesson 1", description: "Description 1", image: require("../../assets/images/placeholderImg.png") },
      { title: "Group Lesson 2", description: "Description 2", image: require("../../assets/images/placeholderImg.png") },
    ],
  };

  // Render cards based on the selected tag
  const renderCards = () => {
    return cardData[selectedTag].map((card, index) => (
      <View style={styles.cardContainer} key={index}>
        <Link href="../lessons" asChild style={styles.longCard}>
          <TouchableOpacity>
            <Image style={styles.cardImage} source={card.image} />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headContainer}>
        <TouchableOpacity>
          <Feather name="menu" size={28} color="#343434" />
        </TouchableOpacity>
        <Text style={styles.titleText}>Unify</Text>
        <TouchableOpacity>
          <Feather name="search" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.placeholderText}>PlaceHolder Name</Text>
        <View style={styles.cardContainer}>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
          <Link href="../lessons" asChild style={styles.card}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <View style={styles.cardContainer}>
          <Link href="../lessons" asChild style={styles.longCard}>
            <TouchableOpacity>
              <Image
                style={styles.cardImage}
                source={require("../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.cardTitle}>Lesson Title</Text>
              <Text style={styles.cardDescription}>Short description</Text>
            </TouchableOpacity>
          </Link>
        </View>
        <Text style={styles.feedText}>Your Feed</Text>
        <View style={styles.tagsContainer}>
          {tags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={
                selectedTag === tag
                  ? styles.tagButtonActive
                  : styles.tagButton
              }
              onPress={() => setSelectedTag(tag as keyof typeof cardData)}
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
        {renderCards()}
      </ScrollView>
      <TouchableOpacity style={styles.floatingButton}>
        <LinearGradient
          colors={['#232323', '#000']}
          style={styles.gradientBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Image
            source={require("../../assets/images/dialogIcon.svg")}
            style={styles.floatingButtonIcon}
          />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 2,
    backgroundColor: "#fff",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  headContainer: {
    display: "flex",
    width: "auto",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    paddingTop: 25.18,
    paddingBottom: 25.18,
    paddingHorizontal: 16.72,
    alignContent: "center",
    flexDirection: "row",
    backgroundColor: "#EEEEEE",
  },
  titleText: {
    fontSize: 25.182,
    fontWeight: 600,
    color: "#343434",
  },
  placeholderText: {
    fontSize: 25.182,
    fontWeight: 600,
    color: "#343434",
    marginLeft: 12,
  },
  scrollContainer: {
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 24,
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
  card: {
    backgroundColor: "#EEEEEE",
    width: 170,
    height: 170,
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
  },
  cardContainer: {
    flexDirection: "row",
    paddingVertical: 20,
    paddingHorizontal: 12,
    justifyContent: "space-between",
    marginBottom: -26,
  },
  longCard: {
    backgroundColor: "#EEEEEE",
    width: "100%",
    height: 170,
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
  },
  feedText: {
    fontSize: 25.182,
    fontWeight: 600,
    color: "#343434",
    marginLeft: 12,
    marginTop: 38,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Allows wrapping to the next line
    gap: 5, // Space between tags
    paddingVertical: 16.79,
    paddingHorizontal: 12,
    marginBottom: -20,
  },
  tagButton: {
    display: "flex",
    backgroundColor: "#EEEEEE",
    paddingVertical: 6.296,
    paddingHorizontal: 25.182,
    borderRadius: 8.394,
    marginRight: 8,
    marginBottom: 8,
    width: 105.975,
    height: 27.59,
    alignItems: "center",
    justifyContent: "center",
  },
  tagButtonActive: {
    display: "flex",
    backgroundColor: "#343434",
    paddingVertical: 6.296,
    paddingHorizontal: 25.182,
    borderRadius: 8.394,
    marginRight: 8,
    marginBottom: 8,
    width: 105.975,
    height: 27.59,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    color: "#9E9E9E",
    fontSize: 12,
  },
  tagTextActive: {
    color: "#fff",
    fontSize: 12,
  },
  floatingButton: {
    position: "absolute",
    bottom: 62,
    right: 20,
    width: 58.75,
    height: 58.75,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  gradientBackground: {
    width: "100%",
    height: "100%",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  } ,
  floatingButtonIcon: {
    width: 30,
    height: 30,
    tintColor: "#fff",
  }
});