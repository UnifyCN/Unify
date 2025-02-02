import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";
import SettingsOption from "@/components/profile/SettingsOption";

const ProfileSettings = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContentContainer}>
        <Link href="/(tabs)/profile" asChild>
          <TouchableOpacity style={styles.backButton}>
            <Feather name="chevron-left" size={25} />
          </TouchableOpacity>
        </Link>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Settings and activity</Text>
        </View>
      </View>
      <View style={{borderBottomColor: '#EEEEEE', borderBottomWidth: 1,}}/>

      <View style={styles.contentContainer}>
        <Text style={styles.sectionTitle}>How you use Unify</Text>
        <View style={styles.sectionContainer}>
          <SettingsOption title="Your activity"/>
          <SettingsOption title="Notifications"/>
          <SettingsOption title="Time management"/>
        </View>

        <Text style={styles.sectionTitle}>Who can see your content</Text>
        <View style={styles.sectionContainer}>
          <SettingsOption title="Your activity" detail="Private"/>
          <SettingsOption title="Notifications" detail="0"/>
        </View>

        <Text style={styles.sectionTitle}>How others can interact with you</Text>
        <View style={styles.sectionContainer}>
          <SettingsOption title="Tags and mentions"/>
          <SettingsOption title="Comments"/>
          <SettingsOption title="Restricted" detail="0"/>
          <SettingsOption title="Limit interactions"/>
          <SettingsOption title="Hidden words"/>
        </View>

        <Text style={styles.sectionTitle}>What you see</Text>
        <View style={styles.sectionContainer}>
          <SettingsOption title="Muted" detail="0"/>
          <SettingsOption title="Suggested content"/>
          <SettingsOption title="Like counts"/>
        </View>

        <Text style={styles.sectionTitle}>Your app and media</Text>
        <View style={styles.sectionContainer}>
          <SettingsOption title="Device permission"/>
          <SettingsOption title="Accessibility and translations"/>
        </View>

        <Text style={styles.sectionTitle}>More info and support</Text>
        <View style={styles.sectionContainer}>
          <SettingsOption title="Help"/>
          <SettingsOption title="Privacy centre"/>
          <SettingsOption title="Account status"/>
          <SettingsOption title="About"/>
        </View>

        <TouchableOpacity>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
  sectionContainer: {
    justifyContent: "space-between",
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#9E9E9E",
    fontWeight: "500",
  },
  loginText: {
    color: "#9E9E9E",
    fontSize: 18,
    paddingBottom: 5,
    fontWeight: "500",
  },
  logoutText: {
    color: "#FE0034",
    fontSize: 18,
    paddingBottom: 70,
    fontWeight: "500",
  }
});

export default ProfileSettings;