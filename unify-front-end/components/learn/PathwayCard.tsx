import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import type { LinkProps } from 'expo-router';

type Props = { title: string; modulesLabel: string; href?: LinkProps['href'] };

export default function PathwayCard({ title, modulesLabel, href }: Props) {
  const CardInner = (
    <>
      <View style={styles.thumb} />
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
    backgroundColor: '#fff',
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  thumb: {
    width: '100%',
    height: 100,
    backgroundColor: '#d9d9d9',
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontSize: 16, fontWeight: '600', color: '#000' },
  meta: { marginTop: 6, fontSize: 12, color: '#666' },
});
