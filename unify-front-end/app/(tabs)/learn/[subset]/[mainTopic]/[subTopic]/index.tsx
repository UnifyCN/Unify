import { View, Text } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'

const SubTopic = () => {
    const { subTopic } = useLocalSearchParams();
    //TODO: add a fetch logic for main topic and use it to create the title of the page, if the fetch doesn't exists, redirect to not-found
  return (
    <View>
      <Text>{subTopic}</Text>
    </View>
  )
}

export default SubTopic