import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface OnboardNavProps {
  currentIndex: number;
  totalSlides: number;
  onNext: () => void;
  onBack: () => void;
}

const OnboardNav: React.FC<OnboardNavProps> = ({ 
  currentIndex, 
  totalSlides, 
  onNext, 
  onBack 
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.navButtonContainer}  onPress={onBack}>
          <Feather name='chevron-left' size={26} color="#343434"/>
          <Text style={styles.navButton}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButtonContainer} onPress={onNext}>
        <Text style={styles.navButton}>{currentIndex === totalSlides - 1 ? 'Get Started' : 'Next'}</Text>
        <Feather name='chevron-right' size={26} color="#343434"/>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 30,
    position: "absolute",
    bottom: 30,
  },
  navButton: {
    fontWeight: "600",
    fontSize: 17,
  },
  navButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default OnboardNav;