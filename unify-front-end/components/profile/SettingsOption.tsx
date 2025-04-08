import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";

interface SettingsOptionProps {
  title: string;
  detail?: string;
}

const SettingsOption: React.FC<SettingsOptionProps> = ({
  title,
  detail,
}) => {
  return (
    <TouchableOpacity>
      <View style={styles.optionContainer}>
        <View style={styles.optionInfo}>
          <View style={styles.generalIcon} />
          <Text style={styles.optionTitle}>{title}</Text>
        </View>
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>{detail}</Text>
          <Feather name="chevron-right" size={25} color={"#999999"} />
        </View>
      </View>
    </TouchableOpacity>

  );
};

const styles = StyleSheet.create({
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 13,
  },
  optionInfo: {
    flexDirection: "row",
  },
  optionTitle: {
    fontSize: 18,
  },
  generalIcon: {
    width: 25,
    height: 25,
    backgroundColor: "#D9D9D9",
    borderRadius: 50,
    marginRight: 6,
  },
  detailsContainer: {
    flexDirection: "row",
    alignContent: "flex-end",
    
  },
  detailText: {
    fontSize: 18,
    color: "#999999"
  }
});

export default SettingsOption;
