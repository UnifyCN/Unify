import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function Onboarding() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create account</Text>

        <Text style={styles.label}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Your username"
          value={username}
          onChangeText={setUsername}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Your email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry={!passwordVisible}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)} 
          >
            <Feather
              name={passwordVisible ? "eye" : "eye-off"}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.checkboxContainer}>
        <TouchableOpacity
            style={[
              styles.checkbox,
              termsAccepted && styles.checkboxChecked, 
            ]}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            {termsAccepted && (
              <Feather name="check" size={16} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity>
            <Text style={styles.checkboxText}>
              I accept the terms and privacy policy
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={() => router.push("/(tabs)")}>
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Already have an account?{" "}
          <Text style={styles.link}>Log in</Text>
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    marginTop: 150,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 17,
    fontSize: 16,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  checkboxChecked: {
    backgroundColor: "#333", 
    borderColor: "#333",
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
    textDecorationLine: "underline",
  },
  link: {
    textDecorationLine: "underline",
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    alignItems: "center",
    marginTop: 50,
    alignSelf: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  footerText: {
    marginTop: "auto",
    marginBottom: 50,
    textAlign: "center",
    fontSize: 14,
  },
});
