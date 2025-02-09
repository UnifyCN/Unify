import { 
  StyleSheet, Text, View,Image, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Feather } from "@expo/vector-icons";
import { StatusBar } from 'expo-status-bar';
import { useRouter } from "expo-router";
import PostsFeed from '../../components/profile/PostsFeed';
import RepliesFeed from '../../components/profile/RepliesFeed';
import SavedFeed from '../../components/profile/SavedFeed';
import FeedProfile2 from "@/assets/images/Feed_Profile2.svg";
import UserSuggestionCard from '@/components/profile/UserSuggestionCard';

export default function TabTwoScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Posts");
  const [showDropdown, setShowDropdown] = useState(false);

  const renderFeedContent = () => {
    switch (activeTab) {
      case 'For You':
        return <PostsFeed />;
      case 'Replies':
        return <RepliesFeed />;
      case 'Saved':
        return <SavedFeed />;
      default:
        return <PostsFeed />;
    }
  };

  const renderHeader = () => (
    <View style={styles.container}>
      <View style={styles.headContainer}>
        <Text style={styles.titleText}>unify</Text>
          <TouchableOpacity onPress={() => router.push('/Profile/profile-settings')}>
            <Feather  name='menu' size={26} color="black"/>
          </TouchableOpacity>
      </View>
      <View style={styles.divider} />
      <ScrollView>
        <View style={styles.contentContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarBorder}>
              <View style={styles.avatarContainer}>
                <FeedProfile2 width={100} height={100} />
              </View>
            </View>
            <View style={styles.profileInfoContainer}>
              <Text style={styles.mainHeader}>User_Name</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statsInfoContainer}>
                  <Text style={styles.statsText}>60</Text>
                  <Text style={styles.statsLabel}>posts</Text>
                </View>
                <View style={styles.statsInfoContainer}> 
                  <Text style={styles.statsText}>100</Text>
                  <Text style={styles.statsLabel}>following</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.personalDetails}>
            <Text style={styles.headerTwo}>Actual_Name</Text>
            <Text style={styles.locationText}>
              From Taiwan 🇹🇼 • Living in Burnaby 🍁
            </Text>
          </View>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity>
              <FontAwesome name="instagram" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="twitter" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="facebook" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button} onPress={() => router.push('/Profile/edit-profile')}>
              <Text style={styles.buttonText}>Edit profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Share profile</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => setShowDropdown(!showDropdown)}>
              <Feather  name='user-plus' size={20} color="black"/>
            </TouchableOpacity>
          </View>

          {showDropdown && (
            <View>
              <View style={styles.dropDownDetails}>
                <Text style={styles.headerTwo} >Discover people</Text>
                <TouchableOpacity onPress={() => router.push('/Profile/profile-suggestions')}>
                  <Text style={styles.headerTwoLink}>See all</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedContainer}>
                <UserSuggestionCard username="User_Name" horizontalGap={true}/>
                <UserSuggestionCard username="User_Name" horizontalGap={true}/>
                <UserSuggestionCard username="User_Name" horizontalGap={true}/>
                <UserSuggestionCard username="User_Name"/>
              </ScrollView>
            </View>
          )}

        </View>

         {/* Tabs*/}
         <View style={styles.tabsContainer}>
            <TouchableOpacity
              onPress={() => setActiveTab('Posts')}
              style={[styles.tab, activeTab === 'Posts' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'Posts'  && styles.activeTabText]}>Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('Replies')}
              style={[styles.tab, activeTab === 'Replies' && styles.activeTab]}>
              <Text style={[styles.tabText, activeTab === 'Replies'  && styles.activeTabText]}>Replies</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab('Saved')}
              style={[styles.tab, activeTab === 'Saved' && styles.activeTab]} >
              <Text style={[styles.tabText, activeTab === 'Saved' && styles.activeTabText]}>Saved</Text>
            </TouchableOpacity>
          </View>
      </ScrollView>
    </View>
    );

    return (
        <SafeAreaView style={styles.container}>
          <StatusBar style="dark" />
          {/* FlatList for the entire scrollable content */}
          <FlatList
            data={[{ key: 'feed' }]}  // Simple dummy data to trigger the render method
            renderItem={() => (
              <View style={styles.feedContainer}>
                {renderFeedContent()}
              </View>)}
            keyExtractor={(item) => item.key}
            // Move header and non-scrollable parts here
            ListHeaderComponent={renderHeader}/>
        </SafeAreaView>
      );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 30,
  },
  headContainer: {
    display: "flex",
    width: "auto",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    backgroundColor: "#fff",
    gap: 28
  },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2, 
    borderColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  titleText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#343434",
  },
  profileContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  profileInfoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingLeft: 35,
  },
  mainHeader: {
    paddingTop: 3,
    fontSize: 23,
    fontWeight: "700",
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 2,
  },
  statsInfoContainer: {
    flexDirection: "column",
    paddingRight: 10,
    marginRight: 10,
  },
  statsText: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 8,
    color: "#343434",
    textAlign: "center",
  },
  statsLabel: {
    fontSize: 17,
    color: "#000",
  },
  headerTwo: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerTwoLink: {
    fontSize: 17,
    fontWeight: "600",
    color: "#3FADF2",
  },
  locationText: {
    fontSize: 16,
    marginBottom: 12,
  },
  personalDetails: {
    paddingTop: 15,
    paddingBottom: 3,
  },
  socialIconsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 16,
    marginVertical: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#FEFEFE",
    padding: 8,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "500",
  },
  tabsContainer: { 
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
  tabText: {
    fontSize: 14,
    fontWeight: 600,
    color: "#9E9E9E",
    paddingBottom: 5,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  activeTabText: {
    color: "black",
    fontWeight: "600",
    borderBottomWidth: 2,
    borderBottomColor: "black",
    paddingHorizontal: 10,
  },
  feedContainer: {
    paddingBottom: 44,
    marginBottom: 36,
  },
  suggestedContainer: {
  },
  dropDownDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  userCard: {
    marginRight: 10,
  }
});
