import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ProgressSectionLL } from '@/components/learn/ProgressSectionLL';
import { ProgressSectionIP } from '@/components/learn/ProgressSectionIP';
import { ProgressSectionComplete } from '@/components/learn/ProgressSectionComplete';

const Modules = () => {
  const [selectedTag, setSelectedTag] = useState('All');

  const tags = [
    'All',
    'Housing',
    'Finance',
    'Employment',
    'Item B',
    'Item C',
    'Item D',
    'Item E',
    'Item F',
  ];

  // Mocked lesson library data
  const LessonLibraryMainTopic = [
    {
      id: '1',
      title: 'Introduction to Housing',
      description: 'Learn about renting, leasing, and housing laws.',
    },
    {
      id: '2',
      title: 'Financial Basics',
      description: 'Understanding banking, credit, and budgeting.',
    },
    {
      id: '3',
      title: 'Employment Essentials',
      description: 'Resumes, interviews, and workplace rights.',
    },
  ];

  return (
    <View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentBox}>
          {/* Welcome Message */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>Welcome</Text>
            <Text style={styles.userName}>Your Name</Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <MaterialIcons
              name='search'
              size={30}
              color='#555'
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder='Search something to learn?...'
              placeholderTextColor='#888'
            />
          </View>

          {/* Tags search */}
          <View style={styles.tagsContainer}>
            {tags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={
                  selectedTag === tag
                    ? styles.tagButtonActive
                    : styles.tagButton
                }
                onPress={() => setSelectedTag(tag)}
              >
                <Text
                  style={
                    selectedTag === tag ? styles.tagTextActive : styles.tagText
                  }
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ paddingBottom: 50 }}>
          <ProgressSectionLL
            header='Lesson Library'
            navigatePage={'/(tabs)/Learn/Lesson-library'}
          />
          <ProgressSectionIP
            header='In-Progress'
            navigatePage={'/(tabs)/Learn/In-progress'}
          />
          <ProgressSectionComplete
            header='Complete'
            navigatePage={'/(tabs)/Learn/moduleComponents/lesson-library'}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  contentBox: {
    backgroundColor: '#EEEEEE',
    padding: 20,
    borderRadius: 12,
  },
  welcomeContainer: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343434',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#343434',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#fff',
    padding: 10,
    height: 70,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 17,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  tagButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagButtonActive: {
    backgroundColor: '#343434',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#9E9E9E',
    fontSize: 14,
  },
  tagTextActive: {
    color: '#fff',
    fontSize: 14,
  },
});

export default Modules;
