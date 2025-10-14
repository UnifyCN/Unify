import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Header from '@/components/Header';
import { useEvents } from '@/hooks/events/useEvents';
import EventCard from './EventCard';
import { useMemo, useState } from 'react';
import { ChartNoAxesGantt } from 'lucide-react-native';
import { Event } from '@/types/events';

const EventsScreen = () => {
  const router = useRouter();
  const { data: events, isLoading, error } = useEvents();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('Upcoming');
  const [selectedGenre, setSelectedGenre] = useState<string>('All Events');

  const tags = ['All', 'Upcoming', 'Past'];
  const genreTags = [
    'All Events',
    'Socials',
    'Finance',
    'Employment',
    'Housing',
    'Documentation',
    'Uncategorized',
  ];

  const selectTag = (tag: string) => {
    setSelectedTag(tag);
  };

  const handleFilterEvents = useMemo(() => {
    return events?.filter(event => {
      const matchesSearch = event.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      const matchesTag = (() => {
        switch (selectedTag) {
          case 'All':
            return true;
          case 'Past':
            return new Date(event.eventDatetime) < new Date();
          case 'Upcoming':
            return new Date(event.eventDatetime) >= new Date();
          default:
            return false;
        }
      })();

      const matchesGenre =
        selectedGenre === 'All Events' || event.genre === selectedGenre;

      return matchesSearch && matchesTag && matchesGenre;
    });
  }, [events, selectedTag, searchQuery, selectedGenre]);

  const renderEvent = ({ item }: { item: Event }) => (
    <View style={styles.eventItem}>
      <EventCard
        event={item}
        width={354}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/Gather/EventDetailScreen',
            params: { event: JSON.stringify(item) },
          })
        }
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar style='dark' />
        <Header />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading events...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <StatusBar style='dark' />
        <Header />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load events</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name='chevron-left' size={24} color='#000' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gather Events</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather
            name='search'
            size={24}
            color='#666'
            style={styles.searchIcon}
          />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder='Search for events near you'
            placeholderTextColor='#999'
          />
          {/* TODO: Implement addtional filter screen later */}
          {/* <TouchableOpacity>
            <ChartNoAxesGantt size={24} color='#666' />
          </TouchableOpacity> */}
        </View>
      </View>

      <View style={styles.tagsContainer}>
        {tags.map(tag => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagButton,
              selectedTag === tag && styles.tagButtonSelected,
            ]}
            onPress={() => selectTag(tag)}
          >
            <Text
              style={[
                styles.tagText,
                selectedTag === tag && styles.tagTextSelected,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Genre Tags Section */}
      <View style={styles.genreTagsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.genreTagsContainer}
          contentContainerStyle={styles.genreTagsContent}
        >
          {genreTags.map(genre => (
            <TouchableOpacity
              key={genre}
              style={[
                styles.genreTagItem,
                selectedGenre === genre && styles.genreTagItemSelected,
              ]}
              onPress={() => setSelectedGenre(genre)}
            >
              <Text
                style={[
                  styles.genreTagText,
                  selectedGenre === genre && styles.genreTagTextSelected,
                ]}
              >
                {genre}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={handleFilterEvents}
        renderItem={renderEvent}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.eventsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name='calendar' size={48} color='#ccc' />
            <Text style={styles.emptyText}>No events available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new events
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 16,
  },
  eventItem: {
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
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
  tagsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  tagButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6C6C6C',
    backgroundColor: '#FFFFFF',
  },
  tagButtonSelected: {
    backgroundColor: '#333333',
    borderColor: '#333333',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  genreTagsWrapper: {
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: '#fff',
    paddingBottom: 10,
  },
  genreTagsContainer: {
    maxHeight: 60,
  },
  genreTagsContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    height: 60,
  },
  genreTagItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    height: 50,
    marginRight: 12,
  },
  genreTagItemSelected: {
    borderBottomWidth: 2,
    borderColor: '#000',
  },
  genreTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  genreTagTextSelected: {
    fontWeight: '600',
  },
});

export default EventsScreen;