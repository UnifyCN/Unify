import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from "react-native";
import { Stack, useNavigation } from "expo-router";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import JourneyMap from "@/components/learn/JourneyMap";
import Modules from "./modules";

const TabNavigator=() => {
    const [activeTab, setActiveTab] = useState("Modules");
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(slideAnim, {
            toValue: activeTab === "Modules" ? 0 : 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
    }
    , [activeTab]);

    const translateX = slideAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-100, 100],
    });
    
    return(
        <>
            <View style={styles.tabs}>
                <TouchableOpacity
                    onPress={() => setActiveTab('Modules')}
                    style={[styles.tab, activeTab === 'Modules' && styles.activeTabLeft]}
                    >
                        <Text style={[styles.inactiveTabText, activeTab === 'Modules' && styles.activeTabText]}>Modules</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setActiveTab('Journey Map')}
                    style={[styles.tab, activeTab === 'Journey Map'&& styles.activeTabRight]}
                    >
                        <Text style={[styles.inactiveTabText, activeTab === 'Journey Map' && styles.activeTabText]}>Journey Map</Text>
                </TouchableOpacity>

                <Animated.View style={[styles.slider, { transform: [{ translateX }] }]} />
            </View>
            {activeTab === "Modules" ? <Modules/> : <JourneyMap/>}
        </>
    )
}

export default function Learn() {
    return(
        <>
        <View style={styles.container}>
              {/* Header test, we can implement this in details after*/}
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>Unify</Text>
                <Feather name="bell" size={24} color="black" />
            </View>
            <ScrollView>
                <TabNavigator/>
            </ScrollView>
        </View>
        </>
    )
} 

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 20,
    },
    headerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    headerText: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#343434",
    },
    tabs: {
        backgroundColor: '#e0e0e0',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        marginBottom: 20,
        position: 'relative',
    },
    tab: {
        backgroundColor: "transparent",
        flex: 1,
        alignItems: 'center',
        paddingVertical: 5.5,
        borderRadius: 20,
        borderColor: "transparent",
    },
    activeTabLeft: {
        marginRight: -30,
    },
    activeTabRight: {
        marginLeft: -30,
    },
    inactiveTabText: {
        color: 'black',
    },
    activeTabText: {
        color: "white",
    },
    slider: {
        position: 'absolute',
        width: '51%',
        height: '100%',
        backgroundColor: '#46A8DA',
        borderRadius: 20,
    },
  });
