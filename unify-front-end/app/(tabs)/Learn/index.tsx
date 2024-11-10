import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Stack, useNavigation } from "expo-router";
import Modules from "./modules";

const TabNavigator=() => {
    const [activeTab, setActiveTab] = useState("Modules");
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
            </View>
        </>
    )
}

const Learn = () => {
    const [activeTab, setActiveTab] = useState("Modules");
    return(
        <>
            <Modules/>
            <View style={{backgroundColor: 'white', padding: 20}}>
                <TabNavigator/>
            </View>
        </>
    )
} 

const styles = StyleSheet.create({
    tabs: {
        backgroundColor: '#e0e0e0', 
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        },
    tab: {
        backgroundColor: "transparent",
        flex: 1,
        alignItems: 'center',
        paddingVertical: 4,
        borderRadius: 20,
        borderColor: "transparent",
    },
    activeTabLeft: {
        backgroundColor: 'black',
        marginRight: -30,  
    },
    activeTabRight: {
        backgroundColor: 'black',
        marginLeft: -30,  
    },
    
    inactiveTabText: {
        color: 'black',
    },

    activeTabText: {
        color: "white",
    }
  });

export default Learn;