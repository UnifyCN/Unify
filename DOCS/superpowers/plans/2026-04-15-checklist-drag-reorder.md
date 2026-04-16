# Checklist Drag-and-Drop Reordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire up drag-and-drop reordering UI for checklist items within priority buckets, using the already-installed `react-native-draggable-flatlist` and existing backend persistence.

**Architecture:** `ChecklistSection` swaps its `View` + `.map()` for `DraggableFlatList`. On drag-end, the screen handler optimistically updates React Query cache via `replacePriorityBucket()` and persists to Supabase via `upsertChecklistTaskOrder()`. Saved order is already loaded on app open — no read-side changes needed.

**Tech Stack:** React Native 0.79, react-native-draggable-flatlist 4.0.3, react-native-reanimated 3.17, expo-haptics, Supabase

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `unify-front-end/services/checklist/getChecklistWithUserProgress.ts` | Modify | Fix custom task priority interleaving bug |
| `unify-front-end/components/checklist/ChecklistItem.tsx` | Modify | Remove unused `onLongPress` prop |
| `unify-front-end/components/checklist/ChecklistSection.tsx` | Modify | Replace View+map with DraggableFlatList, add drag handle |
| `unify-front-end/app/(tabs)/Checklist/index.tsx` | Modify | Wire reorder handler, cleanup duplicate logic, add haptics |
| `unify-front-end/__tests__/checklist/checklistOrder.test.ts` | Create | Unit test for ordering utility |

---

### Task 1: Fix custom task priority interleaving bug

Custom tasks are appended after all Sanity tasks via `[...sanityTasks, ...customTasks]`, ignoring their priority bucket. A custom task with priority "Do now" appears after all "Optional / later" Sanity tasks.

**Files:**
- Modify: `unify-front-end/services/checklist/getChecklistWithUserProgress.ts:84`

- [ ] **Step 1: Fix the merge to sort all tasks by priority order**

In `getChecklistWithUserProgress.ts`, replace the final return statement. Instead of concatenating, combine both arrays and sort by priority bucket order:

```typescript
import {
  CustomChecklistTask,
  SanityChecklistItem,
  UserTaskWithDetails,
  sanityChecklistItemToTaskDetails,
  Priority,
} from '@/types/checklist';
import { getChecklistByPersonaAndStage } from '@/services/sanity/checklist';
import { getUserTasks } from './getUserTasks';
import { deleteUserTasks } from './deleteUserTasks';
import { getCustomChecklistTasks } from './customChecklistTasks';
import { CHECKLIST_PRIORITY_ORDER, normalizeChecklistPriority } from '@/utils/checklistOrder';
```

Then replace lines 82-84 (the final return block):

```typescript
  const customRows = await getCustomChecklistTasks(userId);
  const customTasks = mapCustomTasksToChecklistRows(customRows);

  // Interleave custom tasks into correct priority positions
  const allTasks = [...sanityTasks, ...customTasks];
  const priorityIndex = new Map(
    CHECKLIST_PRIORITY_ORDER.map((p, i) => [p, i])
  );
  allTasks.sort((a, b) => {
    const aIdx = priorityIndex.get(normalizeChecklistPriority(a.task.priority)) ?? 99;
    const bIdx = priorityIndex.get(normalizeChecklistPriority(b.task.priority)) ?? 99;
    return aIdx - bIdx;
  });

  return allTasks;
```

- [ ] **Step 2: Verify the app still loads the checklist tab**

Run: `npx expo start` and open the Checklist tab. Confirm tasks display grouped correctly by priority and custom tasks appear within their assigned bucket rather than at the bottom.

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/services/checklist/getChecklistWithUserProgress.ts
git commit -m "fix: interleave custom checklist tasks by priority bucket

Custom tasks were appended after all Sanity tasks regardless of their
priority assignment. Now sorted into correct priority positions."
```

---

### Task 2: Clean up ChecklistItem — remove unused onLongPress

The `onLongPress` prop was added as prep for drag-and-drop but is never wired. With the drag-handle approach, long-press on the item isn't used for dragging.

**Files:**
- Modify: `unify-front-end/components/checklist/ChecklistItem.tsx`

- [ ] **Step 1: Remove onLongPress from the component**

Replace the full component file content. Remove `onLongPress` from the interface and the `TouchableOpacity`:

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails } from '@/types/checklist';

interface ChecklistItemProps {
  task: UserTaskWithDetails;
  onPress?: () => void;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  task,
  onPress,
}) => {
  const isCompleted = task.completed;
  const taskName = task.task.task_name?.trim() ?? '';
  const taskDescription = task.task.task_description?.trim() ?? '';

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedText
        style={[
          styles.taskName,
          isCompleted && { color: styles.taskDescription.color },
        ]}
      >
        {taskName}
      </ThemedText>
      <ThemedText style={styles.taskDescription}>{taskDescription}</ThemedText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6D5D5',
  },
  taskName: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '500',
    color: '#000',
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: '#727272',
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add unify-front-end/components/checklist/ChecklistItem.tsx
git commit -m "chore: remove unused onLongPress from ChecklistItem

Drag is initiated via drag handle, not long-press on the item."
```

---

### Task 3: Replace ChecklistSection with DraggableFlatList

This is the core UI change. Replace `View` + `.map()` with `DraggableFlatList` and add a drag handle icon.

**Files:**
- Modify: `unify-front-end/components/checklist/ChecklistSection.tsx`

- [ ] **Step 1: Rewrite ChecklistSection with DraggableFlatList**

Replace the full file with:

```tsx
import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from 'react-native-draggable-flatlist';
import { ThemedText } from '@/components/ThemedText';
import { UserTaskWithDetails, Priority } from '@/types/checklist';
import { ChecklistItem } from './ChecklistItem';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface ChecklistSectionProps {
  priority: Priority;
  tasks: UserTaskWithDetails[];
  onTaskPress?: (task: UserTaskWithDetails) => void;
  onReorder?: (reorderedTasks: UserTaskWithDetails[]) => void;
  onDragStart?: () => void;
}

const priorityConfig = {
  'Do now': {
    icon: 'error-outline' as const,
    color: '#E03B3B',
    backgroundColor: '#FBCFCF',
  },
  'Do soon': {
    icon: 'schedule' as const,
    color: '#F47734',
    backgroundColor: '#FBE4CF',
  },
  'Explore and connect': {
    icon: 'people' as const,
    color: '#F49E34',
    backgroundColor: '#FFEDBD',
  },
  'Explore & connect': {
    icon: 'people' as const,
    color: '#F49E34',
    backgroundColor: '#FFEDBD',
  },
  'Optional / later': {
    icon: 'pending' as const,
    color: '#5E8651',
    backgroundColor: '#CDE9D2',
  },
};

function getTaskKey(task: UserTaskWithDetails): string {
  if (task.source === 'custom' && task.custom_task_id != null) {
    return `custom:${task.custom_task_id}`;
  }
  if (task.sanity_checklist_id) {
    return `sanity:${task.sanity_checklist_id}`;
  }
  return `user_task:${task.user_task_id}`;
}

export const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  priority,
  tasks,
  onTaskPress,
  onReorder,
  onDragStart,
}) => {
  const config = priorityConfig[priority];
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;

  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<UserTaskWithDetails>) => {
      return (
        <ScaleDecorator activeScale={1.03}>
          <View
            style={[
              styles.row,
              isActive && styles.rowActive,
            ]}
          >
            <View style={styles.leftColumn}>
              <TouchableOpacity
                onPress={() => onTaskPress?.(item)}
                style={[
                  styles.checkboxCircle,
                  { backgroundColor: '#FFF', borderColor: config.color },
                  item.completed && {
                    backgroundColor: config.color,
                    borderColor: config.color,
                  },
                ]}
                activeOpacity={0.7}
                disabled={isActive}
              >
                {item.completed && (
                  <MaterialIcons name='check' size={20} color='#FFF' />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.centerColumn}>
              <ChecklistItem
                task={item}
                onPress={() => onTaskPress?.(item)}
              />
            </View>

            <TouchableOpacity
              onLongPress={() => {
                onDragStart?.();
                drag();
              }}
              delayLongPress={150}
              style={styles.dragHandle}
              activeOpacity={0.5}
            >
              <MaterialIcons name='drag-indicator' size={24} color='#BDBDBD' />
            </TouchableOpacity>
          </View>
        </ScaleDecorator>
      );
    },
    [config.color, onTaskPress, onDragStart]
  );

  const keyExtractor = useCallback(
    (item: UserTaskWithDetails) => getTaskKey(item),
    []
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: config.backgroundColor },
          ]}
        >
          <MaterialIcons name={config.icon} size={32} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.priority}>{priority}</ThemedText>
          <ThemedText style={styles.count}>
            {completedCount}/{totalCount} complete
          </ThemedText>
        </View>
      </View>
      <View style={styles.timeline}>
        <View
          style={[
            styles.timelineLine,
            { backgroundColor: config.backgroundColor },
          ]}
        />
        <DraggableFlatList
          data={tasks}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          onDragEnd={({ data }) => onReorder?.(data)}
          scrollEnabled={false}
          containerStyle={styles.listContainer}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  priority: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  count: {
    fontSize: 14,
    color: '#000',
    marginTop: 2,
  },
  timeline: {
    paddingLeft: 6,
  },
  timelineLine: {
    position: 'absolute',
    left: 24,
    top: 0,
    bottom: 30,
    width: 1,
    backgroundColor: '#E2E8F0',
    zIndex: 0,
  },
  listContainer: {
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  rowActive: {
    opacity: 0.95,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  leftColumn: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerColumn: {
    flex: 1,
  },
  checkboxCircle: {
    width: 26,
    height: 26,
    top: -6,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dragHandle: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
```

- [ ] **Step 2: Verify the component compiles and renders**

Run: `npx expo start` and open the Checklist tab. Confirm:
- Each item row now shows a ☰ drag handle icon on the right
- Tapping the checkbox still opens the detail modal
- The timeline vertical line still renders
- Long-pressing the drag handle initiates a drag (items won't persist order yet — that's Task 4)

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/components/checklist/ChecklistSection.tsx
git commit -m "feat: add drag-and-drop reordering UI to ChecklistSection

Replace View+map with DraggableFlatList from react-native-draggable-flatlist.
Each row gets a drag-indicator handle on the right. ScaleDecorator provides
visual feedback during drag. Reorder callback wired to parent."
```

---

### Task 4: Wire up reorder handler in Checklist screen + cleanup

Connect the `ChecklistSection` reorder callback to the existing persistence layer. Clean up duplicate logic.

**Files:**
- Modify: `unify-front-end/app/(tabs)/Checklist/index.tsx`

- [ ] **Step 1: Add imports for reorder utilities and haptics**

At the top of `Checklist/index.tsx`, add/update these imports:

Replace the existing imports block (lines 1-31) with:

```typescript
import React, { useEffect, useState, useCallback } from 'react';
import {
  Alert,
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAnalytics } from '@/utils/analytics';
import { useUserStage } from '@/hooks/onboarding/useUserStage';
import { useChecklistTasks } from '@/hooks/checklist/useChecklistTasks';
import { getOnboardingProfile } from '@/services/onboarding/getOnboardingProfile';
import { setChecklistItemCompletion } from '@/services/checklist/setChecklistItemCompletion';
import {
  deleteCustomChecklistTask,
  setCustomChecklistTaskCompletion,
} from '@/services/checklist/customChecklistTasks';
import { upsertChecklistTaskOrder } from '@/services/checklist/checklistTaskOrder';
import { ChecklistSection } from '@/components/checklist/ChecklistSection';
import { TaskDetailModal } from '@/components/checklist/TaskDetailModal';
import { supabase } from '@/lib/supabase';
import {
  ChecklistLinkTabSlug,
  Priority,
  UserTaskWithDetails,
} from '@/types/checklist';
import {
  CHECKLIST_PRIORITY_ORDER,
  normalizeChecklistPriority,
  getChecklistTaskOrderKey,
  replacePriorityBucket,
} from '@/utils/checklistOrder';
import { useHapticsPreference } from '@/context/HapticsContext';
import TabHeader from '@/components/home/HomeHeader';
import LoadingScreen from '@/components/LoadingScreen';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
```

- [ ] **Step 2: Replace duplicate priority grouping with shared utility + add reorder handler**

Replace the `normalizePriority` function, `tasksByPriority` reduce block, and `priorities` array (lines 141-162) with:

```typescript
  // Group tasks by priority using shared canonical order
  const tasksByPriority = tasks.reduce(
    (acc, task) => {
      const p = normalizeChecklistPriority(task.task.priority);
      if (!acc[p]) acc[p] = [];
      acc[p].push(task);
      return acc;
    },
    {} as Record<Priority, UserTaskWithDetails[]>
  );
```

Remove the local `normalizePriority` function and the `priorities` constant. The iteration in the JSX will use `CHECKLIST_PRIORITY_ORDER` instead.

- [ ] **Step 3: Add the handleReorder and handleDragStart callbacks**

Add these after `handleCloseModal` (around line 170):

```typescript
  const { hapticsEnabled } = useHapticsPreference();

  const handleDragStart = useCallback(() => {
    if (hapticsEnabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [hapticsEnabled]);

  const handleReorder = useCallback(
    async (priority: Priority, reorderedBucket: UserTaskWithDetails[]) => {
      // Optimistic UI update
      setTasks(prev => replacePriorityBucket(prev, priority, reorderedBucket));

      // Persist to Supabase in background
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const orderedKeys = reorderedBucket.map(t => getChecklistTaskOrderKey(t));
        await upsertChecklistTaskOrder(user.id, priority, orderedKeys);
      } catch (err) {
        console.error('Failed to persist checklist order:', err);
      }
    },
    [setTasks]
  );
```

- [ ] **Step 4: Update the JSX to use CHECKLIST_PRIORITY_ORDER and pass reorder props**

Replace the `priorities.map` JSX block (lines 364-375) with:

```tsx
        {CHECKLIST_PRIORITY_ORDER.map(priority => {
          const priorityTasks = tasksByPriority[priority] || [];

          return (
            <ChecklistSection
              key={priority}
              priority={priority}
              tasks={priorityTasks}
              onTaskPress={handleTaskPress}
              onReorder={(reordered) => handleReorder(priority, reordered)}
              onDragStart={handleDragStart}
            />
          );
        })}
```

- [ ] **Step 5: Verify end-to-end reorder flow**

Run: `npx expo start` and open the Checklist tab. Verify:
1. Long-press the drag handle on any item — haptic fires, item lifts with scale animation
2. Drag to a new position within the same priority bucket — item settles smoothly
3. Close and reopen the app — order is preserved
4. Tapping the checkbox still opens the detail modal (no interaction conflicts)
5. Custom items are draggable alongside Sanity items

- [ ] **Step 6: Commit**

```bash
git add unify-front-end/app/(tabs)/Checklist/index.tsx
git commit -m "feat: wire drag-and-drop reorder to persistence layer

- handleReorder optimistically updates cache then persists to Supabase
- Haptic feedback on drag start via expo-haptics
- Replace duplicate priority grouping with CHECKLIST_PRIORITY_ORDER
- Remove local normalizePriority in favor of shared normalizeChecklistPriority"
```

---

### Task 5: Add unit test for ordering utility

The `applyOrderWithinPriority` function is the core of order persistence. Add a test to guard against regressions.

**Files:**
- Create: `unify-front-end/__tests__/checklist/checklistOrder.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
import {
  applyOrderWithinPriority,
  getChecklistTaskOrderKey,
  normalizeChecklistPriority,
  replacePriorityBucket,
  CHECKLIST_PRIORITY_ORDER,
} from '@/utils/checklistOrder';
import { UserTaskWithDetails } from '@/types/checklist';

function makeSanityTask(
  sanityId: string,
  priority: string,
  name: string
): UserTaskWithDetails {
  return {
    user_task_id: 0,
    user_id: 'u1',
    task_id: null,
    sanity_checklist_id: sanityId,
    completed: false,
    completed_at: null,
    source: 'sanity',
    task: {
      task_name: name,
      task_description: '',
      priority: priority as any,
    },
  };
}

function makeCustomTask(
  customId: number,
  priority: string,
  name: string
): UserTaskWithDetails {
  return {
    user_task_id: 0,
    user_id: 'u1',
    task_id: null,
    custom_task_id: customId,
    sanity_checklist_id: null,
    completed: false,
    completed_at: null,
    source: 'custom',
    task: {
      task_name: name,
      task_description: '',
      priority: priority as any,
    },
  };
}

describe('checklistOrder', () => {
  describe('getChecklistTaskOrderKey', () => {
    it('returns sanity: prefix for sanity tasks', () => {
      const task = makeSanityTask('abc', 'Do now', 'Test');
      expect(getChecklistTaskOrderKey(task)).toBe('sanity:abc');
    });

    it('returns custom: prefix for custom tasks', () => {
      const task = makeCustomTask(42, 'Do now', 'Test');
      expect(getChecklistTaskOrderKey(task)).toBe('custom:42');
    });
  });

  describe('normalizeChecklistPriority', () => {
    it('normalizes "Explore & connect" to "Explore and connect"', () => {
      expect(normalizeChecklistPriority('Explore & connect')).toBe(
        'Explore and connect'
      );
    });

    it('leaves other priorities unchanged', () => {
      expect(normalizeChecklistPriority('Do now')).toBe('Do now');
    });
  });

  describe('applyOrderWithinPriority', () => {
    it('reorders tasks according to saved order', () => {
      const a = makeSanityTask('a', 'Do now', 'A');
      const b = makeSanityTask('b', 'Do now', 'B');
      const c = makeSanityTask('c', 'Do now', 'C');

      const result = applyOrderWithinPriority(
        [a, b, c],
        ['sanity:c', 'sanity:a', 'sanity:b']
      );

      expect(result.map(t => t.task.task_name)).toEqual(['C', 'A', 'B']);
    });

    it('appends tasks not in saved order at the end', () => {
      const a = makeSanityTask('a', 'Do now', 'A');
      const b = makeSanityTask('b', 'Do now', 'B');
      const c = makeSanityTask('c', 'Do now', 'C');

      const result = applyOrderWithinPriority(
        [a, b, c],
        ['sanity:b']
      );

      expect(result.map(t => t.task.task_name)).toEqual(['B', 'A', 'C']);
    });

    it('returns original order when savedOrder is empty', () => {
      const a = makeSanityTask('a', 'Do now', 'A');
      const b = makeSanityTask('b', 'Do now', 'B');

      const result = applyOrderWithinPriority([a, b], []);
      expect(result.map(t => t.task.task_name)).toEqual(['A', 'B']);
    });

    it('returns original order when savedOrder is null', () => {
      const a = makeSanityTask('a', 'Do now', 'A');
      const result = applyOrderWithinPriority([a], null);
      expect(result.map(t => t.task.task_name)).toEqual(['A']);
    });
  });

  describe('replacePriorityBucket', () => {
    it('replaces tasks in the target bucket while keeping others', () => {
      const doNow = makeSanityTask('a', 'Do now', 'A');
      const doSoon = makeSanityTask('b', 'Do soon', 'B');
      const newDoNow = makeSanityTask('c', 'Do now', 'C');

      const result = replacePriorityBucket(
        [doNow, doSoon],
        'Do now',
        [newDoNow]
      );

      const names = result.map(t => t.task.task_name);
      expect(names).toEqual(['C', 'B']);
    });
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd unify-front-end && npx jest __tests__/checklist/checklistOrder.test.ts --verbose`

Expected: All 7 tests pass.

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/__tests__/checklist/checklistOrder.test.ts
git commit -m "test: add unit tests for checklist ordering utilities

Cover getChecklistTaskOrderKey, normalizeChecklistPriority,
applyOrderWithinPriority, and replacePriorityBucket."
```
