import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { Href, Link } from "expo-router";

interface ProgressSectionCardProps {
  title: string;
  description: string;
  image: any;
  href: Href;
}

export function ProgressSectionCard({
  title,
  description,
  image,
  href,
}: ProgressSectionCardProps) {
  return (
    <Link href={href} asChild style={styles.card}>
      <TouchableOpacity>
        <ImageBackground
          source={image}
          style={styles.cardImage}
          imageStyle={styles.imageStyle}
        >
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </ImageBackground>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EEEEEE",
    width: 170,
    height: 170,
    borderRadius: 12,
    marginRight: 16,
    overflow: "hidden",
  },
  cardImage: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 10,
  },
  imageStyle: {
    borderRadius: 12,
  },
  cardTitle: {
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 5,
  },
  cardDescription: {
    color: "#fff",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: 5,
    borderRadius: 5,
    marginTop: 5,
  },
});

export default ProgressSectionCard;
