import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ImageBackground,
  View,
} from "react-native";
import { Href, Link } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";

interface ProgressSectionCardProps {
  title: string;
  description: string;
  image: any;
  href: Href;
}

export function ProgressSectionCard({
  title,
  image,
  href,
}: ProgressSectionCardProps) {
  const [liked, setLiked] = useState(false);

  return (
    <Link href={href} asChild style={styles.card}>
      <TouchableOpacity>
        <ImageBackground
          source={image}
          style={styles.cardImage}
          imageStyle={styles.imageStyle}
        >
          {/* Overlay */}
          <View style={styles.overlay} />
          <TouchableOpacity
            style={styles.heartIcon}
            onPress={() => setLiked(!liked)}
          >
            <FontAwesome
              name={liked ? "heart" : "heart-o"}
              size={24}
              color={liked ? "red" : "white"}
            />
          </TouchableOpacity>
          <Text style={styles.cardTitle}>{title}</Text>
        </ImageBackground>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EEEEEE",
    width: 200,
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
    fontSize: 18,
    color: "#fff",
    padding: 5,
    borderRadius: 5,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Dark cover overlay
    borderRadius: 12,
  },
  heartIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});

export default ProgressSectionCard;
