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
            <Image style={styles.longCardImage} source={card.image} />
            <Text style={styles.longCardTitle}>{card.title}</Text>
            <Text style={styles.longCardDescription}>{card.description}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    ));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headContainer}>
        <Text style={styles.titleText}>Unify</Text>
        <View style={styles.iconContainer}>
          <TouchableOpacity>
            <Feather name="bell" size={28} color="#343434" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Feather name="search" size={24} color="black" />
          </TouchableOpacity>
        </View>
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
                style={styles.longCardImage}
                source={require("../../assets/images/placeholderImg.png")}
              />
              <Text style={styles.longCardTitle}>Lesson Title</Text>
              <Text style={styles.longCardDescription}>Short description</Text>
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
            source={require("../../assets/images/postIcon.svg")}
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
    paddingVertical: "5%",
    paddingHorizontal: "8%",
    alignContent: "center",
    flexDirection: "row",
    backgroundColor: "#EEEEEE",
  },
  iconContainer: {
    display: "flex",
    flexDirection: "row",
    gap: "25%",
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
    marginLeft: "3%",
  },
  scrollContainer: {
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: "5%",
    paddingVertical: "5%",
  },
  cardImage: {
    width: "25%",
    height: "25%",
    alignSelf: "baseline",
    marginLeft: 16,
    marginBottom: 30,
    marginTop: 20,
  },
  cardTitle: {
    alignSelf: "baseline",
    marginLeft: 16,
    marginBottom: 12,
    color: "#9F9D9D",
    fontWeight: "600",
  },
  cardDescription: {
    alignSelf: "baseline",
    marginLeft: "12%",
    marginBottom: "4%",
    color: "#CECECE",
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#EEEEEE",
    width: "50%",
    height: "140%",
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
  },
  cardContainer: {
    flexDirection: "row",
    paddingVertical: "10%",
    paddingHorizontal: "5%",
    justifyContent: "space-between",
    marginBottom: -16,
  },
  longCard: {
    backgroundColor: "#EEEEEE",
    width: "105%",
    height: "100%",
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
    paddingVertical: "18%",
  },
  longCardImage: {
    height: "70%",
    width: "20%",
    alignSelf: "baseline",
    marginLeft: 16,
    marginBottom: 30,
  },
  longCardTitle: {
    alignSelf: "baseline",
    marginLeft: 16,
    marginBottom: 12,
    color: "#9F9D9D",
    fontWeight: "600",
  },
  longCardDescription: {
    alignSelf: "baseline",
    marginLeft: "12%",
    marginBottom: "4%",
    color: "#CECECE",
    fontWeight: "600",
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
    paddingVertical: "4%",
    paddingHorizontal: "3%",
    marginBottom: "-5%",
    marginLeft: 12,
  },
  tagButton: {
    display: "flex",
    backgroundColor: "#EEEEEE",
    paddingVertical: "2%",
    paddingHorizontal: "6%",
    borderRadius: 8,
    marginRight: "2%",
    marginBottom: "2%",
    width: "30%", 
    height: "80%", 
    alignItems: "center",
    justifyContent: "center",
  },
  tagButtonActive: {
    display: "flex",
    backgroundColor: "#343434",
    paddingVertical: "2%",
    paddingHorizontal: "6%",
    borderRadius: 8, 
    marginRight: "2%",
    marginBottom: "2%",
    width: "30%",
    height: "80%",
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