import React from "react";
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions
} from "react-native";
import { FC } from 'react';

interface OnboardItemProps {
  item: {
    id: string;
    graphic: FC;
    title: string;
    description: string;
  };
}

const OnboardItem: React.FC<OnboardItemProps> = ({
  item
}) => {
  const {width} = useWindowDimensions();
  const Graphic = item.graphic;
  return (
    <View style={[styles.contentContainer, {width}]}>
      <Graphic /> 
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    alignItems: "center", 
    justifyContent: "center",
    padding: 30,
  },
  title: {
    fontSize: 25,
    fontWeight: "bold",
    marginTop: 20,
  },
  description: {
    fontSize: 18,
    color: "#5C5C5C",
    textAlign: "center",
    marginTop: 20,
    width: "80%",
  },
});

export default OnboardItem;