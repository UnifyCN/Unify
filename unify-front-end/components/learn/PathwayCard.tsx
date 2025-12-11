import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import type { LinkProps } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Blob3 from '../../assets/images/Blob3.svg';
import Blob8 from '../../assets/images/Blob8.svg';
import Blob10 from '../../assets/images/Blob10.svg';
import Blob11 from '../../assets/images/Blob11.svg';
import Blob12 from '../../assets/images/Blob12.svg';

type Props = {
  title: string;
  modulesLabel: string;
  href?: LinkProps['href'];
  colorTheme?: string;
  icon?: string;
  index?: number;
};

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

export default function PathwayCard({
  title,
  modulesLabel,
  href,
  colorTheme,
  icon,
  index = 0,
}: Props) {
  const backgroundColor = colorTheme || '#d9d9d9';
  const iconName = mapIconName(icon || 'AccountBalanceOutlined');
  
  // Cycle through blobs: Blob3, Blob8, Blob10, Blob11, Blob12, repeat
  const blobIndex = index % 5;
  const BlobComponent = blobIndex === 0 ? Blob3 : blobIndex === 1 ? Blob8 : blobIndex === 2 ? Blob10 : blobIndex === 3 ? Blob11 : Blob12;

  const CardInner = (
    <>
      <View style={[styles.banner, { backgroundColor }]}>
        {/* Blob background overlay - cycles through Blob3, Blob8, Blob10, Blob11, Blob12 */}
        <View style={blobIndex === 0 ? styles.blob3Container : blobIndex === 1 ? styles.blob8Container : blobIndex === 2 ? styles.blob10Container : blobIndex === 3 ? styles.blob11Container : styles.blob12Container}>
          <BlobComponent 
            width={160} 
            height={160}
            fill="#FFFFFF"
            opacity={0.3}
          />
        </View>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={iconName as any} size={32} color="#FFFFFF" />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.meta}>{modulesLabel}</Text>
        </View>
      </View>
    </>
  );

  if (href) {
    return (
      <Link href={href} asChild>
        <TouchableOpacity activeOpacity={0.85} style={styles.card}>
          {CardInner}
        </TouchableOpacity>
      </Link>
    );
  }

  return <View style={styles.card}>{CardInner}</View>;
}

const styles = StyleSheet.create({
  card: {
    width: 172,
    height: 118,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    shadowColor: '#575757',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  banner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  blob3Container: {
    position: 'absolute',
    top: -68,
    right: -70,
    width: 160,
    height: 160,
    overflow: 'hidden',
    transform: [{ rotate: '-45deg' }],
  },
  blob8Container: {
    position: 'absolute',
    top: -75,
    right: -75,
    width: 160,
    height: 160,
    overflow: 'hidden',
    transform: [{ rotate: '35deg' }],
  },
  blob10Container: {
    position: 'absolute',
    top: -80,
    right: 90,
    width: 160,
    height: 160,
    overflow: 'hidden',
    transform: [{ rotate: '45deg' }],
  },
  blob11Container: {
    position: 'absolute',
    top: -100,
    right: 86,
    width: 160,
    height: 160,
    overflow: 'hidden',
    transform: [{ rotate: '-35deg' }],
  },
  blob12Container: {
    position: 'absolute',
    top: -58,
    right: -70,
    width: 160,
    height: 160,
    overflow: 'hidden',
    transform: [{ rotate: '-40deg' }],
  },
  iconContainer: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    marginTop: 'auto',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 0,
    lineHeight: 24,
  },
  meta: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});
