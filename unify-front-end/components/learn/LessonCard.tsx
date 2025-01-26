import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  ImageSourcePropType,
  ViewStyle,
} from "react-native";

interface LessonCardProps {
  imageSource: ImageSourcePropType;
  title: string;
  description: string;
  style?: ViewStyle; // Add an optional `style` prop
}

const LessonCard: React.FC<LessonCardProps> = ({
  imageSource,
  title,
  description,
  style, // Destructure the `style` prop
}) => {
  return (
    <>
      {/* Apply custom styles */}
      <View style={[styles.card, style]}> 
        <ImageBackground
          source={imageSource}
          style={styles.cardImage}
          imageStyle={styles.imageStyle}
        >
          {/* Overlay */}
          <View style={styles.overlay} />

          {/* Title and Description */}
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </ImageBackground>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 25,
  },
  cardImage: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
  },
  imageStyle: {
    borderRadius: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Dark cover overlay
    borderRadius: 12,
  },
  textContainer: {
    padding: 10,
    marginLeft: 8,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: "#ddd",
  },
});

export default LessonCard;