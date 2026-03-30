import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistCardProps {
  scale?: number;
}

const ITEMS = [
  { title: 'Get your SIN', subtitle: 'Required for working and accessing services', completed: true },
  { title: 'Open a bank account', subtitle: 'Required for working and accessing services', completed: false },
  { title: 'Get a phone plan', subtitle: 'Required for working and accessing services', completed: false },
  { title: 'Apply for provincial health coverage\n(MSP/equivalent)', subtitle: 'Required for working and accessing services', completed: false },
];

export default function ChecklistCard({ scale = 1 }: ChecklistCardProps) {
  const s = scale;

  return (
    <View style={{ width: 271 * s }}>
      {/* Header */}
      <View style={[styles.header, { gap: 11 * s, marginBottom: 8 * s }]}>
        <View style={[styles.headerIcon, {
          width: 37 * s,
          height: 37 * s,
          borderRadius: 8 * s,
          padding: 5 * s,
        }]}>
          <Ionicons name="alert-circle" size={24 * s} color="#E03B3B" />
        </View>
        <View>
          <Text style={[styles.headerTitle, { fontSize: 12.3 * s }]}>Do Now</Text>
          <Text style={[styles.headerSubtitle, { fontSize: 10.8 * s }]}>0/4 complete</Text>
        </View>
      </View>

      {/* Timeline + items */}
      <View style={[styles.itemsContainer, { paddingLeft: 9 * s, gap: 0 }]}>
        {ITEMS.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            {/* Circle + line */}
            <View style={[styles.circleColumn, { width: 20 * s, marginRight: 15 * s }]}>
              {/* Connecting line above (except first item) */}
              {index > 0 && (
                <View style={[styles.lineSegment, {
                  width: 1.5 * s,
                  top: 0,
                  bottom: '50%',
                  backgroundColor: '#E0DEDE',
                }]} />
              )}
              {/* Connecting line below (except last item) */}
              {index < ITEMS.length - 1 && (
                <View style={[styles.lineSegment, {
                  width: 1.5 * s,
                  top: '50%',
                  bottom: 0,
                  backgroundColor: '#E0DEDE',
                }]} />
              )}
              {/* Circle indicator */}
              {item.completed ? (
                <View style={[styles.circleCompleted, {
                  width: 20 * s,
                  height: 20 * s,
                  borderRadius: 10 * s,
                }]}>
                  <Ionicons name="checkmark" size={14 * s} color="#fff" />
                </View>
              ) : (
                <View style={[styles.circleEmpty, {
                  width: 20 * s,
                  height: 20 * s,
                  borderRadius: 10 * s,
                  borderWidth: 1.5 * s,
                }]} />
              )}
            </View>

            {/* Item card */}
            <View style={[styles.itemCard, {
              borderRadius: 9 * s,
              paddingHorizontal: 12 * s,
              paddingVertical: 8 * s,
              marginVertical: 4.5 * s,
              borderWidth: 0.77 * s,
            }]}>
              <Text
                style={[
                  styles.itemTitle,
                  { fontSize: 10.8 * s },
                  item.completed && styles.itemTitleCompleted,
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.itemSubtitle,
                  { fontSize: 9.2 * s },
                  item.completed && styles.itemSubtitleCompleted,
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  headerIcon: {
    backgroundColor: '#FBCFCF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'FunnelSans_600SemiBold',
    color: '#000',
  },
  headerSubtitle: {
    fontFamily: 'FunnelSans_400Regular',
    color: '#000',
  },
  itemsContainer: {
    // Container for timeline items
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circleColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  lineSegment: {
    position: 'absolute',
    left: '50%',
    marginLeft: -0.75,
  },
  circleCompleted: {
    backgroundColor: '#E03B3B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleEmpty: {
    backgroundColor: '#fff',
    borderColor: '#E03B3B',
    zIndex: 1,
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderColor: '#D6D5D5',
    overflow: 'hidden',
  },
  itemTitle: {
    fontFamily: 'FunnelSans_500Medium',
    color: '#000',
  },
  itemTitleCompleted: {
    color: '#9B9797',
  },
  itemSubtitle: {
    fontFamily: 'FunnelSans_400Regular',
    color: '#727272',
    marginTop: 2,
  },
  itemSubtitleCompleted: {
    color: '#B4B1B1',
  },
});
