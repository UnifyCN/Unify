import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Link, Href } from 'expo-router';

interface LessonHeroCardProps {
  moduleTitle?: string;
  submoduleTitle?: string;
  submoduleCount?: number;
  coverImageUrl?: string;
  colorHex?: string;
  href?: Href;
}

export default function LessonHeroCard({
  moduleTitle = 'Finance',
  submoduleTitle = 'Types of Banks & Credit Unions',
  submoduleCount = 0,
  coverImageUrl,
  colorHex,
  href,
}: LessonHeroCardProps) {
  const lessonsText = submoduleCount === 1 ? 'Lesson' : 'Lessons';

  const cardContent = (
    <View style={styles.card}>
      <View style={styles.banner}>
        {coverImageUrl ? (
          <Image
            source={{ uri: coverImageUrl }}
            style={styles.bannerImage}
            resizeMode='cover'
          />
        ) : null}
        <View style={styles.bannerOverlay} />
        <View style={styles.bannerTextWrap}>
          <Text style={styles.metaText}>
            {moduleTitle} • {submoduleCount} {lessonsText}
          </Text>
          <Text style={styles.title}>{submoduleTitle}</Text>
        </View>
        {href && (
          <View style={styles.resumeButtonContainer}>
            <View
              style={[
                styles.resumeButton,
                colorHex ? { backgroundColor: colorHex } : null,
              ]}
            >
              <Text style={styles.resumeButtonText}>Resume</Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity
          accessibilityRole='link'
          accessibilityLabel={submoduleTitle ? `Resume ${submoduleTitle}` : 'Resume lesson'}
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
    padding: 0,
    marginRight: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
    overflow: 'hidden',
  },
  banner: {
    height: 160,
    borderRadius: 16,
    backgroundColor: '#bdbdbd',
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
  metaText: { color: 'rgba(255,255,255,0.95)', fontSize: 12 },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginTop: 4,
  },
  resumeButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
  },
  resumeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D8492C',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  resumeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
