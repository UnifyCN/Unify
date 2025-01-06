import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, useColorScheme, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Search from '../../assets/images/search.svg';
import Carousel from '../../components/home/Carousel';
import NationalNews from '../../assets/images/nationalNews.svg';
import Immigration from '../../assets/images/immigration.svg';

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
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.headContainer}>
        <Text style={styles.titleText}>unify</Text>
        <View style={styles.searchBar}>
          <Search style={styles.searchIcon} width={20} height={20} />
          <Text style={styles.search}>Search</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.placeholderText}>Highlights</Text>
        <Carousel />
        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <NationalNews style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Lesson 1</Text>
              <Text style={styles.cardDescription}>Description 1</Text>
            </View>
          </View>
          <View style={styles.card}>
            <Immigration style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Lesson 2</Text>
              <Text style={styles.cardDescription}>Description 2</Text>
            </View>
          </View>
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
    </SafeAreaView>
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignContent: "center",
    flexDirection: "row",
    backgroundColor: "#fff",
    gap: 28
  },
  searchIcon: {
    overflow: "hidden"
  },
  search: {
    fontSize: 15,
    color: "#9f9d9d",
    textAlign: "left"
  },
  searchBar: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#eee",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 24,
    paddingTop: 8,
    paddingRight: 124,
    paddingBottom: 8,
    gap: 8
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  titleText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#343434",
  },
  placeholderText: {
    fontSize: 24,
    lineHeight: 25,
    fontWeight: 600,
    color: "#000",
    textAlign: "left",
    marginBottom: 12,
  },
  scrollContainer: {
    display: "flex",
    height: "100%",
    width: "100%",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 44,
  },
  cardImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: 12,
  },
  cardContent: {
    position: "absolute",
    top: "50%",
    left: "5%",
    transform: [{ translateY: -50 }],
    width: "90%",
    zIndex: 1,
    alignItems: "flex-start",
  },
  cardTitle: {
    alignSelf: "baseline",
    color: "#9F9D9D",
    fontWeight: "600",
    marginBottom: 4
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
    height: "100%",
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    position: "relative",
  },
  cardContainer: {
    flexDirection: "row",
    height: 100,
    paddingTop: 12,
    justifyContent: "space-between",
    gap: 12
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