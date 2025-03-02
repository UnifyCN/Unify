import { useState, memo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, SafeAreaView} from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated'
import { useScrollContext } from '@/context/ScrollContext';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Search from '@/assets/images/search.svg';
import CreatePost from '@/assets/images/create_post_button.svg'
import Carousel from '@/components/home/Carousel';
import ForYouFeed from '@/components/home/ForYouFeed';
import FollowingFeed from '@/components/home/FollowingFeed';
import GroupsFeed from '@/components/home/GroupsFeed';


interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Header = memo(({ activeTab, setActiveTab }: HeaderProps) => {
  const router = useRouter();
  
  return (
    <View>
      <View style={styles.headContainer}>
        <Text style={styles.titleText}>unify</Text>
        <View style={styles.searchBar}>
          <Search style={styles.searchIcon} width={20} height={20} />
          <Text style={styles.search}>Search</Text>
        </View>
      </View>
      <View style={styles.divider} />

      <View style={styles.carouselContainer}>
        <Text style={styles.placeholderText}>Highlights</Text>
        <Carousel />
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/(tabs)/learn/Lesson-library')}
        >
          <Image 
            style={styles.cardImage} 
            source={require('@/assets/images/nationalNews.png')} 
          />
          <Text style={styles.cardDescription}>National News</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push('/(tabs)/learn/journey-map')}
        >
          <Image 
            style={styles.cardImage} 
            source={require('@/assets/images/journeyMap.png')} 
          />
          <Text style={styles.cardDescription}>Journey Map</Text>
        </TouchableOpacity>
      </View>
      
      <Text style= {{fontWeight: 600, fontSize: 24, color: "black", paddingHorizontal: 20, marginTop: 20}}>
        Your Feed
      </Text>
      <View style={styles.tabs}>
        {['For You', 'Following', 'Groups'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState("For You");

  const renderFeedContent = () => {
    switch (activeTab) {
      case 'Following':
        return <FollowingFeed />;
      case 'Groups':
        return <GroupsFeed />;
      default:
        return <ForYouFeed />;
    }
  }

  const [scrollValue,] = useScrollContext();
  const previousScrollValue = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    // Change this if this cause any error 
    onScroll: (e) => {
      const offsetY = e.contentOffset.y;
      const SCROLL_DISTANCE = 200;
      if (offsetY < 0 || offsetY > e.contentSize.height)
        return;

      scrollValue.value = Math.max(
        0, Math.min(1, scrollValue.value + (offsetY - previousScrollValue.value) / SCROLL_DISTANCE)
      );

      previousScrollValue.value = offsetY;
    }
  }
);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <Animated.FlatList
        data={[{ key: 'feed' }]}
        renderItem={() => (
          <View style={styles.feedContainer}>
            {renderFeedContent()}
          </View>
        )}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={
          <Header 
            activeTab={activeTab} 
            setActiveTab={setActiveTab}
          />
        }
        onScroll={scrollHandler}
      />
      <TouchableOpacity style={styles.floatingButton}>
        <CreatePost />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // Ensure the container takes up the full screen
    backgroundColor: "#fff",
    flexDirection: "column",
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
  carouselContainer: {
    paddingTop: 30,
    width: "100%",
    paddingHorizontal: 20,
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
  feedContainer: {
    paddingBottom: 44,
    marginBottom: 36,
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
  floatingButton: {
    position: "absolute",
    bottom: 85,
    right: 20,
    width: 58.75,
    height: 58.75,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 2 },
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
  },
  floatingButtonIcon: {
    width: 30,
    height: 30,
  }
});