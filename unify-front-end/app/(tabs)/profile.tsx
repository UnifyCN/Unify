import React, { useState } from 'react';
import { StyleSheet, TextInput, Button, View, Text, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Login successful', `Token: ${data.token}`);
        console.log("success")
      } else {
        Alert.alert('Login failed', data.msg);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  const handleSignUp = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: signUpUsername, password: signUpPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        Alert.alert('Sign up successful', `Token: ${data.token}`);
        console.log("success");
      } else {
        Alert.alert('Sign up failed', data.msg);
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong');
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={<Ionicons size={310} name="code-slash" style={styles.headerImage} />}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Profile</ThemedText>
      </ThemedView>
      <ThemedText>This will be the profile page of Unify.</ThemedText>

      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={loginUsername}
          onChangeText={setLoginUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={loginPassword}
          onChangeText={setLoginPassword}
        />
        <Button title="Login" onPress={handleLogin} />

        <Text style={styles.formTitle}>Sign Up</Text>
        <TextInput
          style={styles.input}
          placeholder="Username"
          value={signUpUsername}
          onChangeText={setSignUpUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={signUpPassword}
          onChangeText={setSignUpPassword}
        />
        <Button title="Sign Up" onPress={handleSignUp} />
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  input: {
    height: 40,
    borderColor: 'white',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});