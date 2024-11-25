import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ImageSourcePropType,
} from "react-native";

interface TopicCardProps {
    icon: ImageSourcePropType;
    subTopicTitle: string;
    description: string;
}

const TopicCard: React.FC<TopicCardProps> = ({
  icon,
  subTopicTitle,
  description,
  }) => {
  return (
    <View style={styles.card}>
      <Image source={icon} style={styles.cardImage}/>
      <View>
        <Text style={[styles.cardText, {color: "#9F9D9D"}]}>{subTopicTitle}</Text>
        <Text style={[styles.cardText, {color: "#CECECE"}]}>{description}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    height: 150,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    padding: 25,
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 25,
    overflow: "hidden",
  },
  cardImage: {
    alignSelf: "flex-start",
    marginTop: 10,
    width: 60,
    height: 60,
  },
  cardText: {
    alignSelf: "flex-end",
    color: "#9F9D9D",
    paddingBottom: 10,
  }
});
  
  export default TopicCard;