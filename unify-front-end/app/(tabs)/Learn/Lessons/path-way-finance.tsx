import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Link } from 'expo-router';

type Module = {
  id: string;
  title: string;
  moduleNumber: number;
  lessons: number;
  progress: number; // 0..1
  status?: 'locked' | 'in-progress' | 'completed';
};

const MOCK_MODULES: Module[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `m-${i + 1}`,
  title: 'Sub-Module Title',
  moduleNumber: i + 1,
  lessons: 6,
  progress: i === 0 ? 0.25 : 0,
  status: i === 0 ? 'in-progress' : 'locked',
}));

export default function FinanceForNewcomers() {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const handleToggle = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Link href='/(tabs)/Learn' asChild>
            <TouchableOpacity style={styles.backButton}>
              <Feather name='chevron-left' size={24} color='#333' />
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={styles.title}>Finance for Newcomers</Text>
        <Text style={styles.subtitle}>
          Empower newcomers to confidently manage their money, build financial stability, and grow long-term wealth in Canada.
        </Text>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressLabel}>Progress: 1/8 modules completed</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(1 / MOCK_MODULES.length) * 100}%` }]} />
          </View>
        </View>

        {/* Timeline track */}
        <View style={styles.timelineWrapper}>
          <ZigZagTrack turns={MOCK_MODULES.length + 2} />

          {MOCK_MODULES.map((m, idx) => {
            const isExpanded = expanded === m.id;
            const leftIcon = idx % 2 === 0;
            return (
              <View key={m.id} style={styles.timelineItem}>
                {/* Side icon */}
                <View style={[styles.sideIcon, leftIcon ? styles.sideLeft : styles.sideRight]}>
                  {leftIcon ? (
                    <Feather name='dollar-sign' size={20} color={'#777'} />
                  ) : (
                    <MaterialCommunityIcons name='bank' size={20} color={'#777'} />
                  )}
                </View>

                {/* Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleToggle(m.id)}
                  style={[styles.cardBox, leftIcon ? styles.alignRight : styles.alignLeft]}
                >
                  {isExpanded ? (
                    <View style={styles.cardExpanded}>
                      <View style={styles.badgeRow}>
                        <View style={styles.pill}>
                          <Text style={styles.pillText}>In Progress</Text>
                        </View>
                      </View>
                      <Text style={styles.cardTitle}>Mastering Banking in Canada</Text>
                      <Text style={styles.cardBody}>
                        Learn about Canadian banking systems, account types, and how to choose the right bank for your individual needs.
                      </Text>
                      <View style={styles.expandedFooter}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.progressSmall}>Progress: 25%</Text>
                          <View style={[styles.progressTrack, { marginTop: 6 }]}>
                            <View style={[styles.progressFill, { width: '25%' }]} />
                          </View>
                        </View>
                        <View style={styles.resumePill}>
                          <Text style={styles.resumeText}>Resume</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cardCollapsed}>
                      <Text style={styles.metaText}>Module {m.moduleNumber} • {m.lessons} lessons</Text>
                      <Text style={styles.collapsedTitle}>{m.title}</Text>
                      <View style={[styles.progressTrack, { marginTop: 8 }]}>
                        <View style={[styles.progressFill, { width: `${m.progress * 100}%` }]} />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* More modules pill */}
          <View style={styles.morePillWrapper}>
            <View style={styles.morePill}>
              <Text style={styles.moreText}>4 more modules ahead</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ZigZagTrack({ turns = 8 }: { turns?: number }) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const d = React.useMemo(() => {
    const { w, h } = size;
    if (w === 0 || h === 0) return '';

    const inset = 26; // padding from edges
    const leftX = inset + 30;
    const rightX = w - inset - 30;
    const padTop = 12;
    const padBottom = 24;
    const segments = Math.max(1, turns);
    const stepY = (h - padTop - padBottom) / segments;

    const r = 14; // corner radius
    let path = `M ${leftX} ${padTop}`; // start
    let x = leftX;
    let y = padTop;
    for (let i = 0; i < segments; i++) {
      const nextX = x === leftX ? rightX : leftX;
      const nextY = y + stepY;
      const dir = nextX > x ? 1 : -1;

      // 1) Horizontal toward corner, stop short by r
      const hx = nextX - dir * r;
      path += ` L ${hx} ${y}`;

      // 2) Rounded corner to go downward
      path += ` Q ${nextX} ${y}, ${nextX} ${y + r}`;

      // 3) Vertical down, stop short by r
      const vy = nextY - r;
      path += ` L ${nextX} ${vy}`;

      // 4) Rounded corner to go horizontal at next row
      const afterCornerX = nextX + dir * r;
      path += ` Q ${nextX} ${nextY}, ${afterCornerX} ${nextY}`;

      // position for next iteration
      x = afterCornerX;
      y = nextY;
    }
    return path;
  }, [size, turns]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents='none' onLayout={onLayout}>
      {d ? (
        <Svg width={size.w} height={size.h}>
          <Path d={d} stroke={'#EAEAEA'} strokeWidth={18} strokeLinecap='round' strokeLinejoin='round' fill='none' />
        </Svg>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F2F2F3' },
  container: { paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8 },
  backButton: { padding: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#333', textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: '#676767', textAlign: 'center', marginTop: 8, lineHeight: 20 },

  progressCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  progressLabel: { fontWeight: '600', color: '#555', textAlign: 'center' },
  progressTrack: { height: 8, backgroundColor: '#E9E9EA', borderRadius: 6 },
  progressFill: { height: 8, backgroundColor: '#1d1d1d', borderRadius: 6 },

  timelineWrapper: { marginTop: 20, paddingBottom: 24, minHeight: 600 },
  timelineItem: { marginBottom: 28, paddingHorizontal: 24, position: 'relative' },
  sideIcon: {
    position: 'absolute',
    top: 18,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E1E1E1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    zIndex: 3,
  },
  sideLeft: { left: 10 },
  sideRight: { right: 10 },

  cardBox: { width: '72%' },
  alignLeft: { alignSelf: 'flex-start' },
  alignRight: { alignSelf: 'flex-end' },

  cardCollapsed: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  metaText: { color: '#8B8B8B', fontSize: 12 },
  collapsedTitle: { color: '#000', fontSize: 16, fontWeight: '600', marginTop: 6 },

  cardExpanded: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-start' },
  pill: { backgroundColor: '#EFEFEF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontSize: 12, color: '#555' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 10 },
  cardBody: { fontSize: 14, color: '#5b5b5b', marginTop: 8, lineHeight: 20 },
  expandedFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  progressSmall: { fontSize: 12, color: '#6b6b6b' },
  resumePill: { backgroundColor: '#E7E7E8', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  resumeText: { fontWeight: '700', color: '#444' },

  morePillWrapper: { alignItems: 'center', marginTop: 8 },
  morePill: { backgroundColor: '#fff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 999, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  moreText: { color: '#6b6b6b', fontWeight: '600' },
});
