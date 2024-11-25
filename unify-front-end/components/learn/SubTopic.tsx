import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions, } from 'react-native';
import SubtopicProgressCard from '@/components/learn/SubtopicProgressCard';
import { Feather} from "@expo/vector-icons";
import { Link } from "expo-router";

const SubTopic = () => {
    const screenWidth = Dimensions.get('window').width;
    return (
        <ScrollView style={styles.container}>
            {/* Header Image */}
            <Image source={require("@/assets/images/lessonsImg.png")} 
            style={[styles.headerImg, {width: screenWidth}]}/>
            
            {/* Header */}
            {/* TODO: Change link to router.push(), and fix this*/}
            <View style={styles.headerContainer}>
                {/* Back Button and Learn Text */}
                <View style={styles.headerContentContainer}>
                <Link href="/(tabs)/learn/modules" asChild>
                    <TouchableOpacity style={styles.backButton}>
                    <Feather name="chevron-left" size={28} color="#343434" />
                    </TouchableOpacity>
                </Link>
                </View>

                {/* Header Icons */}
                <View style={styles.headerContentContainer}>
                {/* Search Icon */}
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="search" size={24} color="black" />
                </TouchableOpacity>
                {/* Bell Icon */}
                <TouchableOpacity style={styles.iconButton}>
                    <Feather name="bell" size={24} color="black" />
                </TouchableOpacity>
                </View>
            </View>
            <View style={{gap: 15}}>
                <Text style={{fontWeight:"700", fontSize: 16, fontFamily: "Inter"}}>Lessons</Text>
                <SubtopicProgressCard 
                    imageSource={require("../../assets/images/placeholderImg.png")} 
                    title={"Lorem ipsum"} 
                    description={"Lorem ipsum dolor sit amet, consectetur adipiscing elit"} 
                    progress={0.3}
                />
                <SubtopicProgressCard 
                    imageSource={require("../../assets/images/placeholderImg.png")} 
                    title={"Lorem ipsum"} 
                    description={"Lorem ipsum dolor sit amet, consectetur adipiscing elit"} 
                    progress={0.3}
                />
            </View>
            
        </ScrollView>
    )
}


const styles = StyleSheet.create({
    container: {
        flex:1,
        padding: 20,
        backgroundColor: "white",
    },
    headerImg: {
        position: "absolute",
        alignSelf: "center",
        height: 370,
      },
      headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
      },
      headerContentContainer: {
        flexDirection: "row",
        paddingBottom: 335,
      },
      backButton: {
        marginRight: 8,
      },
      iconButton: {
        padding: 8,
      },
})

export default SubTopic