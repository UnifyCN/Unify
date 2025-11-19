import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { Link, useRouter } from 'expo-router'; // added useRouter to be able to navigate to module-overview
import { getPathway } from '../../../data/pathways'; // getpathway reads the module data (titles, progress, etc...)

type Module = {
  id: string;
  title: string;
  moduleNumber: number;
  lessons: number;
  progress: number; // 0..1
  status?: 'locked' | 'in-progress' | 'completed';
};

// NOTE: This was part of the previous code but right now code uses pathways.ts to redirect the data from the submodules
/* 
const MOCK_MODULES: Module[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `m-${i + 1}`,
  title: 'Sub-Module Title',
  moduleNumber: i + 1,
  lessons: 6,
  progress: i === 0 ? 0.25 : 0,
  status: i === 0 ? 'in-progress' : 'locked',
})); 
*/

const PATH_ID = 'finance' as const;

export default function FinanceForNewcomers() {
  const router = useRouter(); // this is used to push push to the module overview screen with parameters

  const [expanded, setExpanded] = React.useState<string | null>(null);
  const anchorsRef = React.useRef<{ y: number; side: 'left' | 'right' }[]>([]);
  const [, forceTick] = React.useState(0);

  const handleToggle = (id: string) => {
    setExpanded(prev => (prev === id ? null : id));
  };

  const updateAnchor = (idx: number, itemY: number, leftIcon: boolean) => {
    const ICON_TOP = 18; // from styles.sideIcon.top
    const ICON_RADIUS = 22; // sideIcon height 44 / 2
    const centerY = itemY + ICON_TOP + ICON_RADIUS;
    anchorsRef.current[idx] = { y: centerY, side: leftIcon ? 'left' : 'right' };
    // force re-render to redraw path; batch updates are fine
    forceTick(t => t + 1);
  };

  //This reads the pathway object and grabs its modules
  const pathway = getPathway(PATH_ID);
  const sourceModules = pathway?.modules ?? [];

  // Builds the 8 objects of the module (subject to change depending of what the value of "i" is)
  const displayModules: Module[] = Array.from({ length: 8 }).map((_, i) => {
    const m = sourceModules[i];
    if (m) {
      return {
        id: m.id, // e.g., "m1"
        title: m.subtitle, // sub-module title from data
        moduleNumber: i + 1,
        lessons: m.lessonsCount ?? 0,
        progress: m.progress ?? 0,
        status:
          (m.progress ?? 0) >= 1
            ? 'completed'
            : (m.progress ?? 0) > 0
              ? 'in-progress'
              : 'locked',
      };
    }
    // placeholder for remaining slots to keep the zig-zag line consistent across 8 items
    return {
      id: `placeholder-${i + 1}`,
      title: 'Sub-Module Title',
      moduleNumber: i + 1,
      lessons: 6,
      progress: 0,
      status: 'locked',
    };
  });

  // Computes completed modules for the header progress text/bar.
  const completedCount = displayModules.filter(
    m => (m.progress ?? 0) >= 1
  ).length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Link href='/(tabs)/Learn' asChild>
            <TouchableOpacity style={styles.backButton}>
              <Feather name='chevron-left' size={30} color='#333' />
            </TouchableOpacity>
          </Link>
        </View>

        <Text style={styles.title}>Finance for Newcomers</Text>
        <Text style={styles.subtitle}>
          Empower newcomers to confidently manage their money, build financial
          stability, and grow long-term wealth in Canada.
        </Text>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          {/* ADDED: dynamic numerator; keep your UI text intact */}
          <Text style={styles.progressLabel}>
            Progress: {completedCount}/{displayModules.length} modules completed
          </Text>
          <View style={styles.progressTrack}>
            {/* ADDED: same visual as before but based on displayModules length */}
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(Math.max(1, completedCount) / displayModules.length) * 100}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Timeline track */}
        <View style={styles.timelineWrapper}>
          <ZigZagTrack anchors={anchorsRef.current} />

          {/*Iterates over displayModules (not the MOCK_MODULES.map)*/}
          {displayModules.map((m, idx) => {
            const isExpanded = expanded === m.id;
            const leftIcon = idx % 2 === 0;

            // This gives access to details of each module such as the subtitle and progress for each specific card
            const backing = sourceModules.find(mod => mod.id === m.id);

            return (
              <View
                key={m.id}
                style={styles.timelineItem}
                onLayout={e =>
                  updateAnchor(idx, e.nativeEvent.layout.y, leftIcon)
                }
              >
                {/* Side icon */}
                <View
                  style={[
                    styles.sideIcon,
                    leftIcon ? styles.sideLeft : styles.sideRight,
                  ]}
                >
                  {leftIcon ? (
                    <Feather name='dollar-sign' size={20} color={'#777'} />
                  ) : (
                    <MaterialCommunityIcons
                      name='bank'
                      size={20}
                      color={'#777'}
                    />
                  )}
                </View>

                {/* Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => handleToggle(m.id)}
                  style={[
                    styles.cardBox,
                    leftIcon ? styles.alignRight : styles.alignLeft,
                  ]}
                >
                  {isExpanded ? (
                    <View style={styles.cardExpanded}>
                      <View style={styles.badgeRow}>
                        {(backing?.progress ?? 0) > 0 &&
                        (backing?.progress ?? 0) < 1 ? (
                          <View style={styles.pill}>
                            <Text style={styles.pillText}>In Progress</Text>
                          </View>
                        ) : null}
                      </View>

                      {/* ADDED: make title dynamic when backed by real data */}
                      <Text style={styles.cardTitle}>
                        {backing?.subtitle ?? 'Mastering Banking in Canada'}
                      </Text>

                      <Text style={styles.cardBody}>
                        {/* Keep your placeholder body for now; can be made dynamic later */}
                        Learn about Canadian banking systems, account types, and
                        how to choose the right bank for your individual needs.
                      </Text>

                      <View style={styles.expandedFooter}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.progressSmall}>
                            Progress:{' '}
                            {Math.round((backing?.progress ?? 0) * 100)}%
                          </Text>
                          <View
                            style={[styles.progressTrack, { marginTop: 6 }]}
                          >
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${(backing?.progress ?? 0) * 100}%` },
                              ]}
                            />
                          </View>
                        </View>

                        {/* Navigates to a single, reusable Module Overview screen, passing the pathId and moduleId so the screen can render the correct content */}
                        <TouchableOpacity
                          style={styles.resumePill}
                          onPress={() =>
                            router.push({
                              pathname: '/(tabs)/Learn/Lessons/module-overview',
                              params: { pathId: PATH_ID, moduleId: m.id }, // e.g., finance + "m1"
                            })
                          }
                        >
                          <Text style={styles.resumeText}>Resume</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cardCollapsed}>
                      <Text style={styles.metaText}>
                        Module {m.moduleNumber} • {m.lessons} lessons
                      </Text>
                      <Text style={styles.collapsedTitle}>{m.title}</Text>
                      <View style={[styles.progressTrack, { marginTop: 8 }]}>
                        <View
                          style={[
                            styles.progressFill,
                            { width: `${m.progress * 100}%` },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}

          {/* <View style={styles.morePillWrapper}>
            <View style={styles.morePill}>
              <Text style={styles.moreText}>4 more modules ahead</Text>
            </View>
          </View> */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type Anchor = { y: number; side: 'left' | 'right' };
function ZigZagTrack({ anchors }: { anchors: Anchor[] }) {
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const onLayout = (e: any) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.w || height !== size.h) setSize({ w: width, h: height });
  };

  const d = React.useMemo(() => {
    const { w, h } = size;
    if (w === 0 || h === 0) return '';

    const inset = 26; // padding from edges
    const leftX = inset + 32; // slightly closer to icons
    const rightX = w - inset - 32;
    const r = 12; // corner radius (controls how rounded the square corners are)

    const ordered = [...anchors]
      .filter(a => Number.isFinite(a?.y))
      .sort((a, b) => a.y - b.y);
    if (ordered.length === 0) return '';

    // Start at first side, above first anchor a bit
    let currentSide: 'left' | 'right' = ordered[0].side;
    let x = currentSide === 'left' ? leftX : rightX;
    let y = ordered[0].y - r;
    let path = `M ${x} ${y}`;

    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i];
      const anchorY = a.y;
      const targetSide: 'left' | 'right' = a.side === 'left' ? 'right' : 'left';
      const nextX = targetSide === 'left' ? leftX : rightX;

      // Go straight down to the icon center (runs through the icon)
      path += ` L ${x} ${anchorY}`;
      // Go straight across to the opposite rail at the same Y
      path += ` L ${nextX} ${anchorY}`;
      // Drop slightly to continue the vertical leg on the opposite side
      path += ` L ${nextX} ${anchorY + r}`;

      // Update for next loop
      x = nextX;
      y = anchorY + r;
      currentSide = targetSide;
    }

    return path;
  }, [size, anchors]);

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents='none'
      onLayout={onLayout}
    >
      {d ? (
        <Svg width={size.w} height={size.h}>
          <Path
            d={d}
            stroke={'#EAEAEA'}
            strokeWidth={18}
            strokeLinecap='round'
            strokeLinejoin='round'
            fill='none'
          />
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#676767',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

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
  timelineItem: {
    marginBottom: 28,
    paddingHorizontal: 24,
    position: 'relative',
  },
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
  collapsedTitle: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },

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
  pill: {
    backgroundColor: '#EFEFEF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: { fontSize: 12, color: '#555' },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#000', marginTop: 10 },
  cardBody: { fontSize: 14, color: '#5b5b5b', marginTop: 8, lineHeight: 20 },
  expandedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  progressSmall: { fontSize: 12, color: '#6b6b6b' },
  resumePill: {
    backgroundColor: '#E7E7E8',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  resumeText: { fontWeight: '700', color: '#444' },

  morePillWrapper: { alignItems: 'center', marginTop: 8 },
  morePill: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  moreText: { color: '#6b6b6b', fontWeight: '600' },
});
