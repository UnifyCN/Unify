import { 
  StyleSheet, 
  Text, 
  View,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Feather } from "@expo/vector-icons";

export default function TabTwoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headContainer}>
        <Text style={styles.titleText}>unify</Text>
        <Feather  name='menu' size={28} color="black"/>
      </View>
      <View style={styles.divider} />
      <ScrollView>
        <View style={styles.contentContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.avatarContainer}>
                  <Image
                  //change to avatar image later
                    source={{ uri: "https://via.placeholder.com/100" }}
                    style={styles.avatar}
                  />
            </View>

            <View style={styles.profileInfoContainer}>
              <Text style={styles.username}>User_Name</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statsInfoContainer}>
                  <Text style={styles.statsText}>60</Text>
                  <Text style={styles.statsLabel}>posts</Text>
                </View>
                <View style={styles.statsInfoContainer}> 
                  <Text style={styles.statsText}>100</Text>
                  <Text style={styles.statsLabel}>following</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.personalDetails}>
            <Text style={styles.actualName}>Actual_Name</Text>
            <Text style={styles.locationText}>
              From Taiwan 🇹🇼 • Living in Burnaby 🍁
            </Text>
          </View>
          <View style={styles.socialIconsContainer}>
            <TouchableOpacity>
              <FontAwesome name="instagram" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Feather name="twitter" size={24} color="black" />
            </TouchableOpacity>
            <TouchableOpacity>
              <FontAwesome name="facebook" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Edit profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Share profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    padding: 30,
  },
  headContainer: {
    display: "flex",
    width: "auto",
    justifyContent: "space-between",
    alignItems: "center",
    flexShrink: 0,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    backgroundColor: "#fff",
    gap: 28
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ddd",
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#EEEEEE",
  },
  titleText: {
    fontSize: 24,
    fontWeight: 700,
    color: "#343434",
  },
  profileContainer: {
    alignItems: "flex-start",
    flexDirection: "row",
  },
  profileInfoContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    paddingLeft: 30,
  },
  username: {
    paddingTop: 10,
    fontSize: 23,
    fontWeight: "700",
    marginVertical: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 8,
  },
  statsInfoContainer: {
    flexDirection: "column",
    paddingRight: 10,
  },
  statsText: {
    fontSize: 16,
    fontWeight: "600",
    marginHorizontal: 8,
    color: "#343434",
  },
  statsLabel: {
    fontSize: 14,
    color: "#000",
  },
  actualName: {
    fontSize: 15,
    fontWeight: "600",
  },
  locationText: {
    fontSize: 15,
    marginBottom: 12,
  },
  personalDetails: {
    paddingTop: 15,
  },
  socialIconsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    gap: 16,
    marginVertical: 8,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#F9F9F9",
    padding: 8,
    borderRadius: 4,
    minWidth: "40%",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
