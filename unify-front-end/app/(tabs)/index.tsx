import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { EventsCarousel } from '@/components/EventsCarousel';
import Header from '@/components/Header';
import { Theme } from '@/constants/Theme';
import { FloatingChatButton } from '@/components/ChatBot';

const WelcomeSection = () => {
  const [username, setUsername] = useState('User');

  useEffect(() => {
    // Simple cache check
    AsyncStorage.getItem('username').then(cached => {
      if (cached) setUsername(cached);
    });

    // Fetch fresh data
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()
          .then(({ data }) => {
            if (data?.username) {
              setUsername(data.username);
              AsyncStorage.setItem('username', data.username);
            }
          });
      }
    });
  }, []);

  return (
    <View style={styles.welcomeSection}>
      <Text style={styles.welcomeText}>Welcome Back, {username}!</Text>
      <LearnProgressCardCarousel />
    </View>
  );
};

// TODO: someone deal with this section
const NewsTipsSection = () => {
  const router = useRouter();

  const handleViewMore = () => {
    // TODO: Navigate to News & Tips screen when available
    // router.push('/(tabs)/NewsTipsScreen');
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>News & Tips</Text>
        <Feather name='chevron-right' size={20} color='#666' />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: 20, paddingVertical: 2 }}
      >
        <NewsCard
          title="Navigating Winter Roads"
          description="New to snow? ICBC article to help you avoid issues on the icy, winter roads."
        />
        <NewsCard
          title="Financial Planning Tips"
          description="Essential tips for managing your finances in Canada."
        />
        <TouchableOpacity
          style={styles.viewMoreCardContainer}
          onPress={handleViewMore}
          activeOpacity={0.8}
        >
          <View style={styles.viewMoreContent}>
            <ViewMoreCardNews width={332} height={132} />
            <View style={styles.viewMoreTextOverlay}>
              <Text style={styles.viewMoreText}>
                View more news{' '}
                <Feather name='arrow-right' size={16} color='#000' />
              </Text>
              <Text style={styles.viewMoreSubtext}>
                There's more to check out!
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const GatherEventsSection = () => {
  return (
    <View style={[styles.section, { paddingHorizontal: 20 }]}>
      <EventsCarousel
        title='Upcoming Gather Events'
        titleStyle={styles.sectionTitle}
      />
    </View>
  );
};

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Header />
      <StatusBar style='dark' />
      <ScrollView style={styles.scrollView}>
        <WelcomeSection />
        <NewsTipsSection />
        <GatherEventsSection />
      </ScrollView>
      <FloatingChatButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.white,
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.black,
  },
  progressText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '600',
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  resumeButton: {
    backgroundColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#000',
    fontFamily: 'Inter',
    fontWeight: 600,
  },
  carouselContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEventsContainer: {
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    minWidth: '100%',
  },
  emptyEventsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyEventsSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  viewMoreCardContainer: {
    width: 332,
    height: 132,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  viewMoreContent: {
    width: 332,
    height: 132,
    position: 'relative',
  },
  viewMoreTextOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  viewMoreSubtext: {
    fontSize: 14,
    color: '#000',
  },
});
