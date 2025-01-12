import React, { useState } from "react";
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  Image,
} from "react-native";
import { Link } from "expo-router";

interface PopupModalProps {
  question: string;
  topResponse: string;
  bottomResponse: string;
  show: boolean;
  setShow: any;
  link: string;
  confirm: any;
}

const PopupModal: React.FC<PopupModalProps> = ({
  question,
  topResponse,
  bottomResponse,
  show,
  setShow,
  link,
  confirm
}) => {
  return (
    // Modalthat fades in when next button is pressed 
    <Modal transparent visible={show} animationType="fade">
      <View style={styles.modal}>
        <View style={styles.modalContent}>
          <Image source={require("../../assets/images/warn.png")} style={styles.image}></Image>
          <Text style={styles.questionText}>{question}</Text>
          {/* Proceed to quiz*/}
          <Link href={link as any} asChild>
            <TouchableOpacity style={styles.modalButton}
              // calls a function (ex. clearing quiz questions) after button is pressed
              onPress={() => {confirm()}}>
              <Text style={styles.yesText}>{topResponse}</Text>
            </TouchableOpacity>
          </Link>
          {/* Go back to key takeaways*/}
          <TouchableOpacity style={[styles.modalButton, styles.modalBottomButton]}
            onPress={setShow}>
            <Text style={styles.noText}>{bottomResponse}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: 'rgba(24, 24, 24, 0.4)', 
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  modalContent: {
    width: '80%',
    height: 325,
    backgroundColor: '#fff', 
    borderRadius: 16,
    alignItems: 'center',
  },
  modalButton: {
    paddingVertical: 11,
    borderRadius: 20,
    marginVertical: 5,
    alignItems: 'center',
    width: "auto",
    backgroundColor: '#3FADF2', 
    marginTop: 22
  },
  modalBottomButton: {
    backgroundColor: '#F5F5F5', 
    borderWidth: 1, 
    borderColor: '#000000', 
    marginTop: 10
  },
  questionText: {
    fontWeight: "bold", 
    fontSize: 17,
    marginHorizontal: 50,
    textAlign: "center",
  },
  noText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 16,
    paddingHorizontal: 25,
  },
  yesText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    paddingHorizontal: 25,
  },
  image: {
    alignSelf: "center",
    marginTop: 35,
    marginBottom: 20,
  },
});

export default PopupModal;