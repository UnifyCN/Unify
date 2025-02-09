import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";
import UserSuggestionCard from "@/components/profile/UserSuggestionCard";

const ProfileSuggestions = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="chevron-left" size={25} />
          </TouchableOpacity>
        </Link>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Discover people</Text>
        </View>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <View style={styles.contentContainer}>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        <UserSuggestionCard username="User_Name"/>
        
      </View>
        
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  contentContainer: {
    padding: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 100,
  },
  headerContentContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343434",
    textAlign: "center",
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "center", 
    paddingRight: 10,
  },
});

export default ProfileSuggestions;