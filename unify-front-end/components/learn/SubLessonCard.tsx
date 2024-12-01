import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import { Link } from "expo-router";

interface SubLessonCardProps {
  imageSource: ImageSourcePropType;
  title: string;
  description: string;
  link: string;
}

const SubLessonCard: React.FC<SubLessonCardProps> = ({
  imageSource,
  title,
  description,
  link,
}) => {
  return (
    <Link href={link as any} asChild>
      <TouchableOpacity style={styles.card}>
        {/* Image */}
        <Image source={imageSource} style={styles.image} />

        {/* Text Content */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2, // Add shadow for Android
    shadowColor: "#000", // Add shadow for iOS
    shadowOffset: { width: 0, height: 2 }, // Add shadow for iOS
    shadowOpacity: 0.2, // Add shadow for iOS
    shadowRadius: 4, // Add shadow for iOS
    height: 160,
    borderWidth: 1, // Add border width
    borderColor: "#ccc", // Add grey border color
  },
  image: {
    width: "45%",
    height: "100%",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
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
