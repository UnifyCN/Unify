import React from "react";
import { TouchableOpacity, Image, Text, StyleSheet } from "react-native";
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
        <Image style={styles.cardImage} source={image} />
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDescription}>{description}</Text>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    // Each card as a light grey square
    backgroundColor: "#EEEEEE",
    width: 170,
    height: 170,
    borderRadius: 12,
    marginRight: 16,
    alignItems: "center",
  },
  cardImage: {
    width: 50,
    height: 50,
    alignSelf: "baseline",
    marginLeft: 18,
    marginBottom: 30,
    marginTop: 25,
  },
  cardTitle: {
    alignSelf: "baseline",
    marginLeft: 18,
    marginBottom: 5,
    color: "#9F9D9D",
    fontWeight: "600",
  },
  cardDescription: {
    alignSelf: "baseline",
    marginLeft: 18,
    marginBottom: 6,
    color: "#CECECE",
    fontWeight: "600",
  },
});

export default ProgressSectionCard;
