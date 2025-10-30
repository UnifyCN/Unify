import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import type { LinkProps } from 'expo-router';

type Props = { title: string; modulesLabel: string; href?: LinkProps['href']; colorHex?: string };

export default function PathwayCard({ title, modulesLabel, href, colorHex }: Props) {
  const CardInner = (
    <>
      {colorHex ? (
        <View
          pointerEvents='none'
          style={[StyleSheet.absoluteFillObject, { backgroundColor: colorHex, borderRadius: 12 }]}
        />
      ) : null}
      <View style={styles.banner} />
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      <Text style={styles.meta}>{modulesLabel}</Text>
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
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    shadowColor: '#575757',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  banner: {
    height: 100,
    // make banner flush with card edges
    marginHorizontal: -12,
    backgroundColor: '#d9d9d9',
    marginBottom: 12,
    overflow: 'hidden',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: '#000', marginBottom: 6 },
  meta: { fontSize: 12, color: '#666' },
});
