import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import CircularProgress from "react-native-circular-progress-indicator";
import { Link } from "expo-router";

interface ProgressCardProps {
  imageSource: any;
  title: string;
  description: string;
  progress: number;
  link: string;
}

const ProgressCard: React.FC<ProgressCardProps> = ({
  imageSource,
  title,
  description,
  progress,
  link,
}) => {
  return (
    <Link href={link as any} asChild>
      <TouchableOpacity style={styles.card}>
        {/* Background Image */}
        <Image source={imageSource} style={styles.image} />

        <View style={styles.overlay}>
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Progress bar*/}
            <View style={styles.progressContainer}>
              {progress === 100 ? (
                <MaterialIcons name="check-circle" size={40} color="#4caf50" />
              ) : (
                <CircularProgress
                  value={progress}
                  maxValue={100}
                  radius={35}
                  progressValueColor={"#fff"}
                  activeStrokeColor={"#9fc9f5"}
                  inActiveStrokeColor={"#d0d0d0"}
                  inActiveStrokeOpacity={0.4}
                  inActiveStrokeWidth={5}
                  activeStrokeWidth={5}
                  valueSuffix={"%"}
                  titleColor="#fff"
                />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    height: 170,
  },
  image: {
    width: "100%",
    height: 170,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
    padding: 16,
    justifyContent: "center",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
    marginRight: 40,
    marginLeft: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#fff", // White text for better contrast
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    color: "#ddd", // Light text for better contrast
  },
  progressContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProgressCard;
