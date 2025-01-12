import React, { act, useState } from 'react';
import { ScrollView, StyleSheet, View, Text, useColorScheme, TouchableOpacity, Image, SafeAreaView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Search from '../../assets/images/search.svg';
import Carousel from '../../components/home/Carousel';

import ForYouFeed from '../../components/home/ForYouFeed';
import FollowingFeed from '../../components/home/FollowingFeed';
import GroupsFeed from '../../components/home/GroupsFeed';


export default function HomeScreen() {

  const router = useRouter();

  const [activeTab, setActiveTab] = useState("For You");

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
        <View style={styles.carouselContainer}>
          <Text style={styles.placeholderText}>Highlights</Text>
          <Carousel />
        </View>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/Learn/Lesson-library')}>
            <Image style={styles.cardImage} source={require('../../assets/images/nationalNews.png')} />
            <Text style={styles.cardDescription}>National News</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/(tabs)/Learn/journey-map')}>
            <Image style={styles.cardImage} source={require('../../assets/images/journeyMap.png')} />
            <Text style={styles.cardDescription}>Journey  Map</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.feedText}>Your Feed</Text>
        <View style={styles.tabs}>
          <TouchableOpacity
              onPress={() => setActiveTab('For You')}
              style={[styles.tab, activeTab === 'For You' && styles.activeTab]}
              >
                  <Text style={[styles.tabText, activeTab === 'For You' && styles.tabText]}>For You</Text>
          </TouchableOpacity>
          <TouchableOpacity
              onPress={() => setActiveTab('Following')}
              style={[styles.tab, activeTab === 'Following'&& styles.activeTab]}
              >
                  <Text style={[styles.tabText, activeTab === 'Following' && styles.tabText]}>Following</Text>
          </TouchableOpacity>
          <TouchableOpacity
              onPress={() => setActiveTab('Groups')}
              style={[styles.tab, activeTab === 'Groups' && styles.activeTab]}
              >
                  <Text style={[styles.tabText, activeTab === 'Groups' && styles.tabText]}>Groups</Text>
          </TouchableOpacity>
        </View>
        {activeTab === 'For You' && (
          <View style={[styles.focusBar, { left: '3%', width: '27%' }]} />
        )}
        {activeTab === 'Following' && (
          <View style={[styles.focusBar, { left: '36%', width: '27%' }]} />
        )}
        {activeTab === 'Groups' && (
          <View style={[styles.focusBar, { left: '70%', width: '27%' }]} />
        )}
        {activeTab === "For You" && <ForYouFeed />}
        {activeTab === "Following" && <FollowingFeed />}
        {activeTab === "Groups" && <GroupsFeed />}
      </ScrollView>
      <TouchableOpacity style={styles.floatingButton}>
        <LinearGradient
          colors={['#232323', '#000']}
          style={styles.gradientBackground}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        >
          <Image
            source={require("../../assets/images/postIcon.jpg")}
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
    paddingTop: 30,
    paddingBottom: 44,
  },
  carouselContainer: {
    width: "100%",
    paddingHorizontal: 20,
  },
  cardImage: {
    height: "100%",
    width: "100%",
    resizeMode: "cover",
    borderRadius: 12,
    position: "absolute",
  },
  cardDescription: {
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 19,
    color: "#fff",
    textAlign: "left",
    position: "absolute",
    top: "60%",
    left: "8%",
    width: "54%"
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#c7c7c7",
    width: "48%",
    overflow: "hidden",
    height: 120
  },
  cardContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  feedText: {
    fontSize: 26,
    lineHeight: 25,
    fontWeight: 600,
    color: "#000",
    marginTop: 44,
    textAlign: "left",
    paddingHorizontal: 20,
  },
  tabs: {
    marginTop: 16,
    backgroundColor: '#F9F9F9', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    backgroundColor: "transparent",
    flex: 1,
    alignItems: 'center',
    borderColor: "transparent",
    paddingVertical: 8,
  },
  activeTab: {
    backgroundColor: '#F9F9F9',
  },
  tabText: {
    fontSize: 14,
    fontWeight: 600,
  },
  focusBar: {
    borderRadius: 99,
    backgroundColor: "#000",
    flex: 1,
    width: "100%",
    height: 2,
    overflow: "hidden",
    marginBottom: 2,
    zIndex: 1,
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