import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import JourneyMap from './journey-map';
import Modules from './modules';

const TabNavigator = () => {
  const [activeTab, setActiveTab] = useState('Modules');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: activeTab === 'Modules' ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);

  const translateX = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  return (
    <>
      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab('Modules')}
          style={[styles.tab, activeTab === 'Modules' && styles.activeTabLeft]}
        >
          <Text
            style={[
              styles.inactiveTabText,
              activeTab === 'Modules' && styles.activeTabText,
            ]}
          >
            Modules
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('Journey Map')}
          style={[
            styles.tab,
            activeTab === 'Journey Map' && styles.activeTabRight,
          ]}
        >
          <Text
            style={[
              styles.inactiveTabText,
              activeTab === 'Journey Map' && styles.activeTabText,
            ]}
          >
            Journey Map
          </Text>
        </TouchableOpacity>

        <Animated.View
          style={[styles.slider, { transform: [{ translateX }] }]}
        />
      </View>
      {activeTab === 'Modules' ? <Modules /> : <JourneyMap />}
    </>
  );
};

const Learn = () => {
  const router = useRouter();

  const handleQuizPress = () => {
    router.push('/Learn/moduleComponents/quiz-intro');
  };

  return (
    <>
      <View style={styles.container}>
        {/* Header test, we can implement this in details after*/}
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Unify</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.quizButton}
              onPress={handleQuizPress}
            >
              <Text style={styles.quizButtonText}>Sample Quiz</Text>
            </TouchableOpacity>
            <Feather name='bell' size={24} color='black' />
          </View>
        </View>
        <ScrollView>
          <TabNavigator />
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343434',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  quizButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  quizButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabs: {
    backgroundColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    marginBottom: 20,
    position: 'relative',
  },
  tab: {
    backgroundColor: 'transparent',
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5.5,
    borderRadius: 20,
    borderColor: 'transparent',
    zIndex: 2,
  },
  activeTabLeft: {
    marginRight: -30,
  },
  activeTabRight: {
    marginLeft: -30,
  },
  inactiveTabText: {
    color: '#46A8DA',
    zIndex: 3,
  },
  activeTabText: {
    color: 'white',
    zIndex: 3,
  },
  slider: {
    position: 'absolute',
    width: '51%',
    height: '100%',
    backgroundColor: '#46A8DA',
    borderRadius: 20,
    zIndex: 1,
  },
});

export default Learn;
