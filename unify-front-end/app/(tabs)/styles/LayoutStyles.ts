import { StyleSheet } from "react-native";

export const tabLayoutStyles = StyleSheet.create({
  tabContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  underline: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 100,
    height: 2,
    backgroundColor: "#000",
  },
});