import { View, StyleSheet, FlatList, Animated, ViewToken, TouchableOpacity, Text } from 'react-native';
import { useState, useRef } from 'react';
import { useRouter } from "expo-router";
import OnboardSlides from '@/components/onboarding/OnboardSlides';
import OnboardItem from '@/components/onboarding/OnboardItem';
import Paginator from '@/components/onboarding/Paginator';
import OnboardNav from '@/components/onboarding/OnboardNav';

export default function Onboarding() {
  const scrollX = useRef(new Animated.Value(0)).current;
  const [currentIndex, setCurrentIndex] = useState(0);
  const slidesRef = useRef<FlatList>(null);
  const router = useRouter();

  const viewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < OnboardSlides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/create-account');
    }
  };
  const handleBack = () => {
    if (currentIndex === 0) {
      endOnboarding();
    } else {
      slidesRef.current?.scrollToIndex({ index: currentIndex - 1 });
    }
  };
  const endOnboarding = () => {
    router.push('/create-account');
    setCurrentIndex(0);
  };

  return (
    <View style={styles.container}>
      <View style={styles.skipContainer}>
        <TouchableOpacity onPress={endOnboarding}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.onboardContent}>
        <FlatList 
          data={OnboardSlides} 
          renderItem={({ item }) => <OnboardItem item={item} />} 
          keyExtractor={(item) => item.id.toString()}
          horizontal 
          showsHorizontalScrollIndicator={false}
          pagingEnabled 
          bounces={false} 
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          scrollEventThrottle={32}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
        <Paginator data={OnboardSlides}scrollX={scrollX}/>
      </View>
      <OnboardNav 
        currentIndex={currentIndex} 
        totalSlides={OnboardSlides.length} 
        onNext={handleNext} 
        onBack={handleBack} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  onboardContent: {
    flex: .7,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },
  skipContainer: {
    padding: 30,
    paddingTop: 50,
    alignItems: "flex-end",
  },
  skipButton: {
    color: "#5C5C5C",
    fontSize: 17,
    marginTop: 20,
  }
});