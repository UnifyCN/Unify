import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LessonHeroCardProps {
  moduleTitle?: string;
  submoduleTitle?: string;
  currentPage?: number;
  totalPages?: number;
  currentSection?: number;
  totalSections?: number;
  coverImageUrl?: string;
  colorHex?: string;
  icon?: string;
  href?: Href;
}

// Map Material UI icon names to MaterialCommunityIcons outline variants
const mapIconName = (iconName: string): string => {
  const iconMap: { [key: string]: string } = {
    AccountBalanceOutlined: 'bank-outline',
    AssignmentIndOutlined: 'account-tie-outline',
    CottageOutlined: 'home-outline',
    ArticleOutlined: 'file-document-outline',
    PassportOutlined: 'passport',
  };
  return iconMap[iconName] || 'bank-outline';
};

export default function LessonHeroCard({
  moduleTitle = 'Finance',
  submoduleTitle = 'Types of Banks & Credit Unions',
  currentPage = 1,
  totalPages = 8,
  currentSection = 1,
  totalSections = 4,
  coverImageUrl,
  colorHex,
  icon,
  href,
}: LessonHeroCardProps) {
  const iconName = mapIconName(icon || 'AccountBalanceOutlined');

  const cardContent = (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Icon on top-left */}
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons 
            name={iconName as any} 
            size={36} 
            color={colorHex || '#000000'} 
          />
        </View>
        
        {href && (
          <View style={styles.continueButtonContainer}>
            <View
              style={[
                styles.continueButton,
                colorHex ? { backgroundColor: colorHex } : null,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </View>
          </View>
        )}

        <View style={styles.textContainer}>
          <Text style={styles.metaText}>
            {moduleTitle} • Section {currentSection} out of {totalSections}
          </Text>
          <Text style={styles.title}>{submoduleTitle}</Text>
        </View>
      </View>
    </View>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity
          accessibilityRole='link'
          accessibilityLabel={
            submoduleTitle ? `Resume ${submoduleTitle}` : 'Resume lesson'
          }
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
    borderWidth: 0.8,
    borderColor: '#CDCBCB',
    borderRadius: 16,
    padding: 0,
    marginRight: 10,
    shadowOffset: { width: 0, height: 3 },
    overflow: 'hidden',
  },
  content: {
    minHeight: 160,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 20,
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 2,
    width: 101,
    height: 36,
    borderRadius: 10,
  },
  continueButton: {
    width: '100%',
    height: '100%',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#D8492C',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 22,
  },
  textContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  metaText: { 
    color: '#000000', 
    fontSize: 14,
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    lineHeight: 28,
  },
});
