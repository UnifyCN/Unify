import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import * as Progress from 'react-native-progress';


// TODO: Fetch images and information from backend
const SubtopicProgressCard = ({imageSource, title, description, progress}: 
    {imageSource: any, title: string, description: string, progress: number}): JSX.Element => {
    return (
        <View style={styles.container}>
            <View style={styles.imageContainer}>
                <Image source={imageSource}/>
            </View>
            <View style={styles.descriptionContainer}>
                <Text style={{fontWeight:"700", fontSize: 16, fontFamily: "Inter"}}>{title}</Text>
                <Text style={{fontSize: 12}}>{description}</Text>
            </View>
            <Progress.Circle style={{transform: [{ rotate: '90deg' }]}} size={70} progress={progress} color="#343434" unfilledColor="white" borderColor="transparent" strokeCap="round" showsText={true} thickness={10} textStyle={styles.progressText}/>
        </View>
    )
}

const styles = StyleSheet.create({
    container:{
        padding: 24,
        flexDirection: "row",
        backgroundColor: "#EEEEEE",
        borderRadius: 16,
        alignItems: "flex-start",
        gap: 21,
        fontFamily: "Inter",
    },
    imageContainer:{
        backgroundColor: "white",
        padding: 5,
        borderRadius: 40,
    },
    descriptionContainer: {
        flexDirection: "column",
        width: '40%',
        gap: 3,
        fontFamily: "Inter",
    },
    progressText: {
        fontSize: 16,
        fontFamily: "Inter",
        fontWeight: 700,
        transform: [{ rotate: '-90deg' }],
      },
})

export default SubtopicProgressCard