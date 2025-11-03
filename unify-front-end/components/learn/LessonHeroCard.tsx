import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, Href } from 'expo-router';

interface LessonHeroCardProps {
  title?: string;
  description?: string;
  moduleTitle?: string;
  submoduleTitle?: string;
  progressPercent?: number;
  currentPage?: number;
  totalPages?: number;
  submoduleCount?: number;
  coverImageUrl?: string;
  colorHex?: string;
  href?: Href;
}

export default function LessonHeroCard({
  title = 'Mastering Banking in Canada',
  description = 'Learn the fundamentals of banking',
  moduleTitle = 'Finance',
  submoduleTitle = 'Types of Banks & Credit Unions',
  progressPercent = 0,
  currentPage = 1,
  totalPages = 10,
  submoduleCount = 0,
  coverImageUrl,
  colorHex,
  href,
}: LessonHeroCardProps) {
  const sectionsText = submoduleCount === 1 ? 'section' : 'sections';
  
  // Extract lesson number from title (e.g., "Lesson 5.3" or "5.3" from title)
  const extractLessonNumber = (lessonTitle?: string): string => {
    if (!lessonTitle) return `Lesson ${currentPage}`;
    
    // Match patterns like "Lesson 5.3", "5.3", "Lesson 5", "5", etc.
    const match = lessonTitle.match(/(?:Lesson\s+)?(\d+(?:\.\d+)?)/i);
    if (match && match[1]) {
      return `Lesson ${match[1]}`;
    }
    
    // Fallback to currentPage if no lesson number found
    return `Lesson ${currentPage}`;
  };
  
  const lessonNumberText = extractLessonNumber(title);
  
  // Remove lesson number prefix from title (e.g., "Lesson 5.3: " or "5.3: ")
  const cleanTitle = (lessonTitle?: string): string => {
    if (!lessonTitle) return '';
    
    // Remove patterns like "Lesson 5.3: ", "Lesson 5.3 ", "5.3: ", "5.3 ", etc.
    const cleaned = lessonTitle.replace(/^(?:Lesson\s+)?\d+(?:\.\d+)?\s*:?\s*/i, '').trim();
    return cleaned || lessonTitle; // Fallback to original if regex removes everything
  };
  
  const displayTitle = cleanTitle(title);
  
  const cardContent = (
    <View style={styles.card}>
      <View style={styles.banner}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.bannerImage}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerTextWrap}>
          <Text style={styles.metaText}>
            {moduleTitle} • {submoduleCount} {sectionsText}
          </Text>
          <Text style={styles.title}>{submoduleTitle}</Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View>
          <Text style={styles.caption}>
            Continue from {lessonNumberText}:
          </Text>
          <Text style={styles.subtitle}>{displayTitle}</Text>
        </View>
        <View style={[styles.playButton, colorHex ? { backgroundColor: colorHex } : null]}>
          <MaterialIcons name='play-arrow' size={28} color='#fff' />
        </View>
      </View>
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity
          accessibilityRole='link'
          accessibilityLabel={title ? `Open lesson: ${title}` : 'Open lesson'}
        >
          {cardContent}
        </TouchableOpacity>
      </Link>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingTop: 0,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  banner: {
    height: 160,
    // make banner flush with card edges
    marginHorizontal: -16,
    borderRadius: 16,
    backgroundColor: '#bdbdbd',
    marginBottom: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 20,
    position: 'relative',
  },
  bannerImage: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bannerTextWrap: {
    // place text at the bottom-left inside the banner
    alignSelf: 'flex-start',
    position: 'relative',
    zIndex: 1,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { color: 'rgba(255,255,255,0.95)', fontSize: 12 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingRight: 15,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    // subtle top shadow to separate from banner
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  caption: { color: '#7a7a7a', fontSize: 12 },
  subtitle: { color: '#000', fontSize: 16, fontWeight: '700', maxWidth: 290 },
  playButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#575757',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderLeftColor: '#fff',
    borderTopWidth: 7,
    borderTopColor: 'transparent',
    borderBottomWidth: 7,
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
});
