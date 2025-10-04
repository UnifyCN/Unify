import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { useModule } from '@/hooks/learn/useModule';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

export default function ModuleIndex() {
  const router = useRouter();
  const { moduleId } = useLocalSearchParams<{ moduleId: string }>();

  const { data: moduleData, isLoading, error } = useModule(moduleId || '');

  // Layout and anchors for the connecting path
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const anchorsRef = useRef<number[]>([]);
  const rowTopsRef = useRef<number[]>([]);
  const cardBoxesRef = useRef<
    Array<{ relY: number; height: number } | undefined>
  >([]);
  const [layoutTick, setLayoutTick] = useState(0);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setContainerWidth(width);
    setContainerHeight(height);
  };

  const setRowTopAndAnchor = (index: number, rowTop: number) => {
    rowTopsRef.current[index] = rowTop;
    const iconCenterY = rowTop + 20 + ICON_SIZE / 2;
    anchorsRef.current[index] = iconCenterY;
    setLayoutTick(t => t + 1);
  };

  const setCardBox = (index: number, relY: number, height: number) => {
    cardBoxesRef.current[index] = { relY, height };
    setLayoutTick(t => t + 1);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading module...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !moduleData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            Error loading module: {error?.message || 'Unknown error'}
          </Text>
          <Link href='/(tabs)/Learn'>Go back to Learn</Link>
        </View>
      </SafeAreaView>
    );
  }

  const displaySubmodules = moduleData.submodules.map((submodule, i) => ({
    id: submodule.id,
    title: submodule.title,
    moduleNumber: i + 1,
    stages: submodule.total_stages,
    progress: submodule.progress_percent / 100,
    status: submodule.is_completed
      ? 'completed'
      : submodule.progress_percent > 0
        ? 'in-progress'
        : 'not-started',
  }));

  const completedCount = moduleData.completed_submodules;
  const totalModules = moduleData.total_submodules;

  // Get module icon based on title
  const getModuleIcon = (title: string) => {
    // Just emojis for now, will have actual icons after the hifi design
    if (
      title.toLowerCase().includes('banking') ||
      title.toLowerCase().includes('finance')
    ) {
      return '🏦';
    } else if (title.toLowerCase().includes('investing')) {
      return '📈';
    } else if (
      title.toLowerCase().includes('housing') ||
      title.toLowerCase().includes('renting')
    ) {
      return '🏠';
    } else if (
      title.toLowerCase().includes('employment') ||
      title.toLowerCase().includes('job')
    ) {
      return '💼';
    }
    return '📚';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Feather name='arrow-left' size={24} color='#000' />
          </TouchableOpacity>
        </View>

        {/* Module Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>{moduleData.title}</Text>
          <Text style={styles.description}>{moduleData.description}</Text>
        </View>

        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            Progress: {completedCount}/{totalModules} modules completed
          </Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${moduleData.progress_percent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Learning Pathway */}
        <View style={styles.pathwayContainer} onLayout={onContainerLayout}>
          {/* SVG Connecting Path behind items */}
          <TrackPath
            width={containerWidth}
            height={containerHeight}
            anchors={anchorsRef.current}
            frames={displaySubmodules.map((_, i) => {
              const rowTop = rowTopsRef.current[i];
              const box = cardBoxesRef.current[i];
              if (rowTop == null || !box) return undefined;
              const framePad = 12;
              const top = rowTop + box.relY - framePad;
              const bottom = rowTop + box.relY + box.height + framePad;
              return { top, bottom };
            })}
            tick={layoutTick}
          />

          {displaySubmodules.map((m, i) => {
            const iconOnRight = i % 2 === 0; // alternate sides
            return (
              <View
                key={m.id}
                style={[styles.pathwayItem]}
                onLayout={e => {
                  const { y } = e.nativeEvent.layout;
                  setRowTopAndAnchor(i, y);
                }}
              >
                {/* Module Card */}
                <TouchableOpacity
                  style={[
                    styles.moduleCard,
                    iconOnRight ? styles.cardShiftRight : styles.cardShiftLeft,
                    m.status === 'completed' && styles.completedCard,
                  ]}
                  onLayout={e => {
                    const { y, height } = e.nativeEvent.layout;
                    setCardBox(i, y, height);
                  }}
                  onPress={() => {
                    router.push({
                      pathname:
                        '/(tabs)/Learn/modules/[moduleId]/[submoduleId]' as any,
                      params: { moduleId, submoduleId: m.id },
                    });
                  }}
                >
                  <View style={styles.moduleContent}>
                    <Text style={styles.moduleNumberText}>
                      Module {m.moduleNumber} • {m.stages} lessons
                    </Text>
                    <Text style={styles.moduleTitle}>{m.title}</Text>
                    <View style={styles.moduleProgressLine} />
                  </View>
                </TouchableOpacity>

                {/* Module Icon */}
                <View
                  style={[
                    styles.moduleIcon,
                    iconOnRight ? styles.iconRight : styles.iconLeft,
                    m.status === 'completed' && styles.completedIcon,
                  ]}
                >
                  {m.status === 'completed' ? (
                    <Feather name='check' size={20} color='#fff' />
                  ) : (
                    <Text style={styles.iconEmoji}>
                      {getModuleIcon(m.title)}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const ICON_SIZE = 48;

// Renders an SVG path that alternates between left and right rails through given anchors
function TrackPath({
  width,
  height,
  anchors,
  frames,
  tick,
}: {
  width: number;
  height: number;
  anchors: number[];
  frames: Array<{ top: number; bottom: number } | undefined>;
  tick: number;
}) {
  const path = useMemo(() => {
    if (!width || !height || !anchors?.length) return '';

    const padding = 20;
    const railLeft = padding + ICON_SIZE / 2 + 8; // icon center left
    const railRight = width - padding - ICON_SIZE / 2 - 8; // icon center right

    let d = '';
    let currentX = railRight; // start at first icon on right rail
    let currentY = anchors[0];
    d += `M ${currentX} ${currentY}`;

    const clamp = (v: number, min: number, max: number) =>
      Math.max(min, Math.min(max, v));

    for (let i = 0; i < anchors.length - 1; i++) {
      const yi = anchors[i];
      const yj = anchors[i + 1];
      const isRight = i % 2 === 0;
      const railS = isRight ? railRight : railLeft; // current item rail
      const railT = isRight ? railLeft : railRight; // next item rail

      // Move to correct rail and the exact anchor for item i
      if (currentX !== railS) d += ` H ${railS}`;
      if (currentY !== yi) d += ` V ${yi}`;
      currentX = railS;
      currentY = yi;

      // Pick a safe Y to cross horizontally between cards
      const fCur = frames?.[i];
      const fNext = frames?.[i + 1];
      const gap = 12;
      let crossTop = fCur
        ? fCur.bottom + gap
        : Math.min(yi, yj) + Math.abs(yj - yi) * 0.4;
      let crossBottom = fNext
        ? fNext.top - gap
        : Math.max(yi, yj) - Math.abs(yj - yi) * 0.4;
      if (crossTop > crossBottom) {
        // fallback to midpoint if overlap
        const mid = (yi + yj) / 2;
        crossTop = mid;
        crossBottom = mid;
      }
      let crossY = clamp(
        (crossTop + crossBottom) / 2,
        Math.min(yi, yj) + 4,
        Math.max(yi, yj) - 4
      );

      // Draw orthogonal L: down/up to crossY, across to other rail, down/up to next anchor
      d += ` V ${crossY}`;
      d += ` H ${railT}`;
      d += ` V ${yj}`;
      currentX = railT;
      currentY = yj;
    }

    return d;
  }, [width, height, anchors, frames, tick]);

  if (!path) return null;

  return (
    <Svg
      pointerEvents='none'
      style={StyleSheet.absoluteFill}
      width={width}
      height={height}
    >
      <Path
        d={path}
        stroke='#E5E7EB'
        strokeWidth={10}
        fill='none'
        strokeLinejoin='miter'
        strokeLinecap='butt'
      />
      <Path
        d={path}
        stroke='#FFFFFF'
        strokeWidth={6}
        fill='none'
        strokeLinejoin='miter'
        strokeLinecap='butt'
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: '100%',
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },

  // Title Section
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 38,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6B7280',
    lineHeight: 24,
    paddingHorizontal: 20,
    maxWidth: width - 40,
  },

  // Progress Card
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },

  // Learning Pathway
  pathwayContainer: {
    marginTop: 8,
    paddingBottom: 24,
    // Make sure children render above the path
    // backgroundColor: 'rgba(255,0,0,0.02)'
  },
  pathwayTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 24,
  },
  pathwayItem: {
    position: 'relative',
    marginBottom: 24,
    paddingTop: 8,
  },

  // Module Card
  moduleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    // dynamic horizontal shift via cardShiftRight/Left
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardShiftRight: {
    marginRight: ICON_SIZE + 36,
    marginLeft: 0,
  },
  cardShiftLeft: {
    marginLeft: ICON_SIZE + 36,
    marginRight: 0,
  },
  completedCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  moduleContent: {
    flex: 1,
  },
  moduleNumberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 24,
  },
  moduleProgressLine: {
    height: 2,
    backgroundColor: '#E5E7EB',
    borderRadius: 1,
    width: 40,
  },

  // Module Icon
  moduleIcon: {
    position: 'absolute',
    top: 20,
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: ICON_SIZE / 2,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  iconRight: { right: 20 },
  iconLeft: { left: 20 },
  completedIcon: {
    backgroundColor: '#10B981',
    borderColor: '#059669',
  },
  iconEmoji: {
    fontSize: 24,
  },

  // Connecting Path (replaced by SVG TrackPath)

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});
