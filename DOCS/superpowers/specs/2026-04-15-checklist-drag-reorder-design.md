# Checklist Drag-and-Drop Reordering

**Date:** 2026-04-15
**Ticket:** [ClickUp 86ag8x76f](https://app.clickup.com/t/86ag8x76f)
**Status:** Design approved

## Problem

Users cannot reorder items in the Checklist tab. Tasks are displayed in a fixed order determined by priority buckets ("Do now", "Do soon", etc.) with no user control over item ordering within each bucket. Users want to arrange items to match their personal priorities.

## Solution

Add drag-and-drop reordering within each priority bucket using the existing `react-native-draggable-flatlist` package. The backend persistence layer (Supabase `checklist_task_order` table, services, ordering utils) is already built — this work wires up the UI and fixes existing code issues.

## Scope

- Reordering within priority buckets only (no cross-bucket dragging)
- Drag handle (☰ icon) on each item as the drag affordance
- Haptic feedback on drag start
- Persisted order restored on next app open
- Code cleanup of existing junior dev work

## Library Decision

The ticket specified `react-native-reanimated-dnd` v2.0.0, which requires RN >= 0.80, Reanimated >= 4.2, Gesture Handler >= 2.28, `react-native-worklets`, and New Architecture enabled. Unify is on RN 0.79.6, Reanimated 3.17, Gesture Handler 2.24, no worklets, and New Architecture disabled. **Incompatible — hard no.**

`react-native-draggable-flatlist` v4.0.3 is already installed (unused) and compatible with the current stack (needs RN >= 0.64, Reanimated >= 2.8, Gesture Handler >= 2.0).

## Data Flow

```text
User drags item → DraggableFlatList onDragEnd
  → optimistic React Query cache update (instant UI)
  → upsertChecklistTaskOrder() to Supabase (background, fire-and-forget)
  → on next app open, useChecklistTasks fetches + applies saved order
```

The read side of this flow already works. This design adds the write side.

## Components Changed

### 1. `ChecklistSection.tsx` — main change

Replace `View` + `.map()` with `DraggableFlatList`:
- Each row: existing checkbox (left) + `ChecklistItem` card (center) + drag handle ☰ (right)
- `onDragEnd` callback passes reordered array to parent
- `scrollEnabled={false}` since it's nested inside a parent `ScrollView`
- Timeline line (vertical connector) stays as absolute-positioned element

### 2. `ChecklistItem.tsx` — minor cleanup

Remove unused `onLongPress` prop and related logic. Drag is initiated via the handle, not long-press.

### 3. `Checklist/index.tsx` — wire up reorder + cleanup

Add `handleReorder(priority, reorderedTasks)`:
1. Build ordered keys via `getChecklistTaskOrderKey()`
2. Update local state via `setTasks()` + `replacePriorityBucket()`
3. Fire `upsertChecklistTaskOrder()` in background

Cleanup:
- Remove duplicate priority grouping logic (use `CHECKLIST_PRIORITY_ORDER` from `checklistOrder.ts`)
- Add haptic feedback on drag start (`ImpactFeedbackStyle.Medium`)

### 4. `getChecklistWithUserProgress.ts` — bug fix

Custom tasks are concatenated after sanity tasks (`[...sanityTasks, ...customTasks]`) ignoring their priority bucket assignment. Fix: interleave custom tasks into the correct priority positions before returning.

## UI Layout Per Row

```text
┌──────────────────────────────────────────────┐
│  ○  │  Task Name                     │  ☰   │
│     │  Task description              │      │
└──────────────────────────────────────────────┘
      checkbox    ChecklistItem card     drag handle
```

- Drag handle: `MaterialIcons` `drag-indicator`, 24px, color `#BDBDBD`
- Active drag: slight elevation + `scale(1.03)` + reduced opacity on vacated slot
- Haptic: `ImpactFeedbackStyle.Medium` on drag start

## Out of Scope

- Cross-bucket dragging
- Backend/Supabase schema changes
- New package installations
- TaskDetailModal changes
- Cache layer changes
