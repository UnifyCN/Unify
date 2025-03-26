import React from "react";
import {Feather } from "@expo/vector-icons";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

interface UserSuggestionCardProps {
  username: string;
  avatar?: string;
  onFollow?: () => void;
  onClose?: () => void;
  horizontalGap?: boolean;
}

const UserSuggestionCard: React.FC<UserSuggestionCardProps> = ({
  username,
  avatar,
  onFollow,
  onClose,
  horizontalGap = false,
}) => {
  return (
    <View style={[horizontalGap && styles.gapWrapper]}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Feather  name='x' size={24} color="#CFCFCF"/>
        </TouchableOpacity>
        <View style={styles.infoContainer}>
          <Image source={{ uri: avatar }} style={styles.avatar}/>
          <Text style={styles.username}>{username}</Text>
          <TouchableOpacity style={styles.followButton} onPress={onFollow}>
            <Text style={styles.followButtonText}>Follow</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 8,
    flexBasis: "48%",
    borderWidth: 2,
    borderColor: "#ECECEC",
    alignItems: "center",
    padding: 38,
    paddingTop: 45,
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 40,
    borderColor: "#ECECEC",
    borderWidth: 2,
    marginBottom: 5,
    alignSelf: "center",
  },
  infoContainer: {
    flex: 1,
    justifyContent: "center",
  },
  username: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  followButton: {
    backgroundColor: "#3FADF2",
    paddingVertical: 3,
    paddingHorizontal: 16,
    borderRadius: 6,
    width: 90,
  },
  followButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "400",
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
  },
  gapWrapper: {
    marginRight: 10,
  },
});

export default UserSuggestionCard;
