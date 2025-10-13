import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import { useGroups } from '@/hooks/groups/useGroups';
import GroupCard from './GroupCard';
import { Group } from '@/types/groups';

export default function MoreGroupsScreen() {
  const { q } = useLocalSearchParams();
  const searchQuery = (q as string) ?? '';
  const { data: groups } = useGroups();

  const filtered: Group[] = (groups ?? []).filter(g =>
    !searchQuery ? true : g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderGroup = ({ item }: { item: Group }) => {
    const displayGroup: Group = {...item, name: `/${item.name.replace(/\s+/g, '')}`}
    return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 12 }}>
      <GroupCard group={displayGroup} width={354} onPress={() => {
        router.push({ pathname: '/Gather/GroupDetailScreen', params: { group: JSON.stringify(item) } });
      }} />
    </View>
  )};

  return (
    <View style={[styles.searchContainer, { backgroundColor: '#ffffffff', paddingTop: 0 },]}>
      
      <View style={[styles.header, { paddingTop: 0 }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderGroup}
        keyExtractor={(i: Group) => String(i.id)}
        style={{ marginLeft: -20 }}
        contentContainerStyle={{ paddingBottom: 40 }}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,

  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  cardList: {
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  cardItem: {
    width: '100%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
    paddingTop: 15, //TEST
  },
  containerText: {
    fontSize: 14,
    color: '#454545ff',
    textAlign: 'left',
    lineHeight: 20,
    maxWidth: 309,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '400',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyHeadline: {
    fontSize: 12,
    fontWeight: '500',
    color: '#464646ff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    //color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
    flex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
    searchFrame: {
      marginTop: 15,            
      alignSelf: 'center',  
      width: '100%',    
      maxWidth: 349,               
      height: 72,               
      paddingHorizontal: 20,    
      paddingVertical: 15,      
      backgroundColor: '#f5f5f5',
      borderRadius: 5,
      alignItems: 'flex-start', 
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
  });