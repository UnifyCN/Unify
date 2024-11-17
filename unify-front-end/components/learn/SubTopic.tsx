import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, } from 'react-native';
import SubtopicProgressCard from '../../components/learn/SubtopicProgressCard';

const SubTopic = () => {
    return (
        <ScrollView style={styles.container}>
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

export default SubTopic

const styles = StyleSheet.create({
    container: {
        flex:1,
        padding: 20,
        backgroundColor: "white",
    },
})