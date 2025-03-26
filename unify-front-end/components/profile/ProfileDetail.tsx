import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

interface ProfileDetailProps {
  title: string;
  info: string;
  filled: boolean;
  selectable?: boolean;
}

const ProfileDetail: React.FC<ProfileDetailProps> = ({
  title,
  info,
  filled,
  selectable,
}) => {
  return (
    <View>
      <View style={{ borderBottomColor: "#EEEEEE", borderBottomWidth: 1 }} />
      <View style={styles.detailContainer}>
        <Text style={styles.detailTitle}>{title}</Text>
        <View style={styles.infoContainer}>
          <Text style={[styles.detailInfo, !filled && styles.unfilledInfo]}>
            {info}
          </Text>
          {selectable && <Feather name="chevron-right" size={20} color="#999" />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  detailContainer: {
    flexDirection: "row",
    paddingHorizontal: 30,
    paddingVertical: 13,
    alignItems: "center",
  },
  detailTitle: {
    fontWeight: "700",
    fontSize: 18,
    width: "35%",
  },
  infoContainer: {
    flex: 1, 
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", 
  },
  detailInfo: {
    fontSize: 18,
    flexShrink: 1, 
  },
  unfilledInfo: {
    fontSize: 18,
    color: "#999999",
  },
});

export default ProfileDetail;
