import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";
import FeedProfile2 from "@/assets/images/Feed_Profile2.svg";
import ProfileDetail from "@/components/profile/ProfileDetail";

const EditProfile = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="chevron-left" size={25} />
          </TouchableOpacity>
        </Link>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Profile</Text>
        </View>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <View style={styles.avatarContainer}>
        <View style={styles.avatarBorder}>
          <View style={styles.avatar}>
            <FeedProfile2 width={100} height={100}/>
          </View>
        </View>
        <Text style={styles.editText}>Edit picture</Text>
      </View>

      <ProfileDetail title="Name" info="Actual_Name" filled={true}/>
      <ProfileDetail title="Username" info="User_Name" filled={true}/>
      <ProfileDetail title="Pronouns" info="Prounouns" filled={false}/>
      <ProfileDetail title="Bio" info="From Taiwan 🇹🇼 • Living in Burnaby 🍁" filled={true}/>
      <ProfileDetail title="Gender" info="Gender" filled={false} selectable={true}/>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>
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
  avatarContainer: {
    marginBottom: 12,
    flex: 1,
    alignItems: "center",
    marginTop: 40,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  avatarBorder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2, 
    borderColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
  },
  editText: {
    color: "#0094F6",
    fontWeight: "700",
    fontSize: 17,
    paddingTop: 9,
  },
});

export default EditProfile;