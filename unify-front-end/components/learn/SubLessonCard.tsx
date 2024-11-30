import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";

interface SubLessonCardProps {
  imageSource: ImageSourcePropType;
  title: string;
  description: string;
}

const SubLessonCard: React.FC<SubLessonCardProps> = ({
  imageSource,
  title,
  description,
}) => {
  return (
    <View style={styles.card}>
      {/* Image */}
      <Image source={imageSource} style={styles.image} />

      {/* Text Content */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    height: 160,
  },
  image: {
    width: "45%",
    height: "100%",
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: "#666",
  },
});

export default SubLessonCard;
