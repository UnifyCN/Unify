import React from "react";
import { View, StyleSheet, Animated, useWindowDimensions} from "react-native";

interface PaginatorProps {
  data: Array<{ id: string }>;
  scrollX: Animated.Value;
}

const Paginator: React.FC<PaginatorProps> = ({ 
  data, 
  scrollX 
}) => {
  const { width } = useWindowDimensions();

  return (
    <View style={styles.container}>
      {data.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 30, 10],
          extrapolate: "clamp",
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: "clamp",
        });

        return (
          <Animated.View
            key={i.toString()}
            style={[styles.dot, { width: dotWidth, opacity }]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    height: 64,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000",
    marginHorizontal: 7,
  },
});

export default Paginator;