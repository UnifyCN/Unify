import * as React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon1 from "../../assets/images/checkMarkIcon.svg"
import Icon2 from "../../assets/images/eye.svg"
import Facebook from "../../assets/images/Facebook.svg"
import Google from "../../assets/images/Google.svg"
import Apple from "../../assets/images/Apple.svg"

export default function LoginScreen() {
  return (
    <View style={{ flex: 1, paddingLeft: 20, paddingRight: 20, backgroundColor: "#fff",  }}>
        <View style={{  marginBottom: 16, paddingTop: 145 }}>
            <Text style={styles.logintext}>Log in</Text>
        </View>
        <View style={styles.input}>
            <Text style={styles.inputText}>Email address</Text>
            <View style={styles.inputField}>
                <Text style={styles.text}>helloworld@gmail.com</Text>
                <Icon1 width={20} height={20} />
            </View>
        </View>
        <View style={styles.input}>
            <Text style={styles.inputText}>Password</Text>
            <View style={styles.inputField}>
                <Text style={styles.text}>......</Text>
                <Icon2 style={{alignContent: 'flex-end'}} width={20} height={20} />
            </View>
        </View>
        <View style={{paddingTop: 15}}>
            <Text style={{textAlign: 'right'}}>Forgot password?</Text>
        </View>
        <View style={{marginTop: 28, paddingVertical: 10, paddingHorizontal: 128}}>
            <View style={styles.buttonBlack}>
                <Text style={styles.button}>Log in</Text>
            </View>
        </View>
        <View style={styles.orLogIn}>
            <View style={styles.lineView}></View>
            <Text style={styles.orText}>Or Login with</Text>
            <View style={styles.lineView}></View>
        </View>
        <View style={styles.buttonBucket}>
            <View style={styles.buttonWithIcon}>
                <Facebook width={20} height={20} />
            </View>
            <View style={styles.buttonWithIcon}>
                <Google width={20} height={20} />
            </View>
            <View style={styles.buttonWithIcon}>
                <Apple width={20} height={20} />
            </View>
        </View>
        <View style={styles.footer}>
            <Text style={{fontSize: 14, lineHeight: 18, color: "rgba(0, 0, 0, 0.7)", textAlign: "left"}}>Don't have an account?</Text>
            <Text style={{fontSize: 14, lineHeight: 18, textDecorationLine: "underline", fontWeight: "600", textAlign: "left", color: "#000"}}>Sign up</Text>
        </View>
    </View>
  );
}

const FontFamily = {
    interBold: "Inter-Bold",
};

const styles = StyleSheet.create({
  logintext: {
    fontSize: 30,
    fontWeight: 700,
    fontFamily: FontFamily.interBold,
    color: 'black',
    textAlign: "left",
    letterSpacing: -0.3,
  },
  input:{
    marginTop: 22,
  },
  inputText: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 6,
    fontFamily: "Inter-Regular",
    color: "#000",
    textAlign: "left"
  },
  inputField: {
    borderRadius: 10,
    backgroundColor: "#fff",
    borderStyle: "solid",
    borderColor: "#d8dadc",
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
 },
 text: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: "Inter-Regular",
    color: "#000",
    textAlign: "left",
    flex: 1
 },
 button: {
    fontSize: 16,
    fontWeight: "500",
    fontFamily: "Inter-Medium",
    color: "#fff",
    textAlign: "center"
 },
 buttonBlack: {
    borderRadius: 40,
    backgroundColor: "#343434",
    flex: 1,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
    paddingVertical: 10
    },
    orLogIn: {
        marginTop: 51,
        flexDirection: "row",
        alignItems: "center",
    },
    lineView: {
        borderStyle: "solid",
        borderColor: "#d8dadc",
        borderTopWidth: 1,
        flex: 1,
        width: "100%",
        height: 1
    },
    orText: {
        color: 'rgba(0, 0, 0, 0.7)',
        fontSize: 14,
        lineHeight: 18,
        marginHorizontal: 10,
    },
    buttonBucket: {
        marginTop: 22,
        flexDirection: "row",
        alignItems: "center",
        gap: 15
    },
    buttonWithIcon: {
        borderRadius: 10,
        backgroundColor: "#fff",
        borderStyle: "solid",
        borderColor: "#d8dadc",
        borderWidth: 1,
        flex: 1,
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 45,
        paddingVertical: 18,
    },
    footer: {
        marginTop: 98,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5
    }
});