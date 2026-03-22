# Unified "Saved from Learn" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate saved lesson pages and text highlights into a single "Saved from Learn" screen grouped by submodule, and simplify the "Saved" page back to a flat list of saved posts.

**Architecture:** The saved-lessons page merges two existing data sources (`useSavedLessonPages` and `useAllHighlights`) into submodule-grouped sections using a `useMemo` combiner. Existing memoized item components (`SavedLessonCard`, `HighlightItem`) are reused within new section cards. The saved page strips out all highlight-related code.

**Tech Stack:** React Native, Expo Router, React Query, Supabase (existing hooks only)

**Spec:** `docs/superpowers/specs/2026-03-22-unified-saved-from-learn-design.md`

**Skills:** Use `/frontend-design` when building the unified section cards. Use `/vercel-react-native-skills` for React Native performance patterns.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `unify-front-end/app/saved.tsx` | Strip highlights tab, revert to flat saved posts list |
| Modify | `unify-front-end/app/saved-lessons.tsx` | Rewrite to unified grouped view with pages + highlights |
| Modify | `unify-front-end/components/home/ProfileModal.tsx` | Rename "Saved Lessons" → "Saved from Learn" |
| Delete | `unify-front-end/components/learn/SavedHighlightsList.tsx` | No longer needed — logic absorbed into saved-lessons |

---

### Task 1: Simplify saved.tsx — Remove Highlights Tab

**Files:**
- Modify: `unify-front-end/app/saved.tsx`

- [ ] **Step 1: Rewrite saved.tsx to flat saved posts list**

Remove: `useState`, `TouchableOpacity` imports, `SavedHighlightsList` import, `SavedTab` type, `activeTab` state, segment control JSX, highlights tab conditional rendering, and all segment-related styles (`segmentContainer`, `segment`, `segmentActive`, `segmentText`, `segmentTextActive`).

The file should become:

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackHeader from '@/components/BackHeader';
import FeedWithHook from '@/components/FeedWithHook';
import { useGetSavedPosts } from '@/hooks/posts/useGetSavedPosts';
import EmptyFeedMessage from '@/components/profile/EmptyFeedMessage';
import UnifyReplyIcon from '@/components/icons/UnifyReply.svg';
import { Theme } from '@/constants/Theme';

export default function SavedPage() {
  return (
    <View style={styles.container}>
      <BackHeader title="Saved" />
      <FeedWithHook
        useFeedHook={useGetSavedPosts}
        ListEmptyComponent={
          <EmptyFeedMessage
            icon={<UnifyReplyIcon width={27} height={25} />}
            message="Looks a little quiet here..."
            submessage={
              <Text style={styles.emptyMessageSubtext}>
                Save posts to see them here
              </Text>
            }
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  emptyMessageSubtext: {
    fontSize: 14,
    color: Theme.textInput,
    textAlign: 'center',
    lineHeight: 20,
  },
});
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/app/saved.tsx
git commit -m "refactor: simplify saved page to flat posts list, remove highlights tab"
```

---

### Task 2: Rename Profile Modal Menu Item

**Files:**
- Modify: `unify-front-end/components/home/ProfileModal.tsx`

- [ ] **Step 1: Change label from "Saved Lessons" to "Saved from Learn"**

In `ProfileModal.tsx` at line 96, change the `label` prop:

```tsx
// Before:
label="Saved Lessons"

// After:
label="Saved from Learn"
```

- [ ] **Step 2: Commit**

```bash
git add unify-front-end/components/home/ProfileModal.tsx
git commit -m "refactor: rename 'Saved Lessons' to 'Saved from Learn' in profile modal"
```

---

### Task 3: Rewrite saved-lessons.tsx — Unified Grouped View

This is the main task. Rewrite the saved-lessons page to merge both data sources into submodule-grouped section cards. Use `/frontend-design` skill for the section card UI and `/vercel-react-native-skills` for performance patterns.

**Files:**
- Modify: `unify-front-end/app/saved-lessons.tsx`

**Data shapes to work with:**

```ts
// SavedLessonPageRow (from services/learn/lessonPageSaves.ts)
{
  id: string;
  lessonId: string;
  pageNumber: number;
  moduleId: string;
  submoduleId: string;
  lessonTitleSnapshot: string | null;
  pageTitleSnapshot: string | null;
  createdAt: string;
}

// Highlight (from services/highlights/highlightService.ts)
{
  id: string;
  user_id: string;
  lesson_id: string;
  page_key: string;
  block_key: string;
  start_word_index: number;
  end_word_index: number;
  selected_text: string;
  created_at: string;
  module_id?: string;
  submodule_id?: string;
  submodule_title?: string;
  page_num?: number;
}
```

- [ ] **Step 1: Add highlights hook import and fetch both data sources**

Add to imports:
```tsx
import { useAllHighlights } from '@/hooks/highlights/useHighlights';
import { Highlight } from '@/services/highlights/highlightService';
```

In `SavedLessonsPage`, add alongside existing `useSavedLessonPages()`:
```tsx
const { data: highlights, isLoading: highlightsLoading } = useAllHighlights();
```

Update the loading check to wait for both:
```tsx
const isLoadingAll = (isLoading && !data) || (highlightsLoading && !highlights);
```

- [ ] **Step 2: Build the unified grouping logic**

Define a section type and create a `useMemo` that merges both sources:

```tsx
interface UnifiedSection {
  key: string;
  submoduleTitle: string;
  moduleId: string;
  pages: SavedLessonPageRow[];
  highlights: Highlight[];
  latestDate: string; // for sorting groups
}
```

The `useMemo` should:
1. Group saved pages by `submoduleId`
2. Group highlights by `submodule_id` (fall back to `lesson_id`)
3. Merge groups with the same key
4. Sort pages within each group by `createdAt` descending
5. Sort highlights within each group by `created_at` descending
6. Sort groups by `latestDate` descending (most recent activity first)

```tsx
const sections = useMemo(() => {
  const groupMap: Record<string, UnifiedSection> = {};

  // Group saved pages
  for (const page of (data || [])) {
    const key = page.submoduleId;
    if (!groupMap[key]) {
      groupMap[key] = {
        key,
        submoduleTitle: page.lessonTitleSnapshot || 'Lesson',
        moduleId: page.moduleId,
        pages: [],
        highlights: [],
        latestDate: page.createdAt,
      };
    }
    groupMap[key].pages.push(page);
    if (page.createdAt > groupMap[key].latestDate) {
      groupMap[key].latestDate = page.createdAt;
    }
  }

  // Group highlights
  for (const h of (highlights || [])) {
    const key = h.submodule_id || h.lesson_id;
    if (!groupMap[key]) {
      groupMap[key] = {
        key,
        submoduleTitle: h.submodule_title || 'Lesson',
        moduleId: h.module_id || '',
        pages: [],
        highlights: [],
        latestDate: h.created_at,
      };
    }
    groupMap[key].highlights.push(h);
    if (h.created_at > groupMap[key].latestDate) {
      groupMap[key].latestDate = h.created_at;
    }
  }

  // Sort within groups and sort groups
  const result = Object.values(groupMap);
  for (const section of result) {
    section.pages.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    section.highlights.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  result.sort((a, b) => b.latestDate.localeCompare(a.latestDate));

  return result;
}, [data, highlights]);
```

- [ ] **Step 3: Create the HighlightItem component**

Move the `HighlightItem` component from `SavedHighlightsList.tsx` into `saved-lessons.tsx` (or keep it inline since it's small). It accepts `highlight` and `onNavigate` props:

```tsx
const HighlightItem = React.memo(function HighlightItem({
  highlight,
  onNavigate,
}: {
  highlight: Highlight;
  onNavigate: (h: Highlight) => void;
}) {
  const canNavigate = !!(highlight.module_id && highlight.submodule_id && highlight.page_num);
  return (
    <Pressable
      style={styles.highlightItem}
      onPress={() => onNavigate(highlight)}
      disabled={!canNavigate}
    >
      <View style={styles.highlightBar} />
      <Text style={styles.highlightText} numberOfLines={3}>
        "{highlight.selected_text}"
      </Text>
      {canNavigate && (
        <Feather name="chevron-right" size={16} color="#9CA3AF" style={styles.highlightChevron} />
      )}
    </Pressable>
  );
});
```

- [ ] **Step 4: Add navigateToHighlight callback**

```tsx
const navigateToHighlight = useCallback((h: Highlight) => {
  if (!h.module_id || !h.submodule_id || !h.page_num) return;
  router.push({
    pathname: '/(tabs)/Learn/modules/[moduleId]/[submoduleId]/lessons/[lessonId]/pages/[pageNum]' as any,
    params: {
      moduleId: h.module_id,
      submoduleId: h.submodule_id,
      lessonId: h.lesson_id,
      pageNum: h.page_num.toString(),
    },
  });
}, [router]);
```

- [ ] **Step 5: Build the section card renderer using /frontend-design**

Use the `/frontend-design` skill to create a distinctive, polished section card. The card should contain:
- **Group header**: Module icon (from `moduleMap`) + submodule title + total item count (pages + highlights)
- **Sub-header "SAVED PAGES"**: Only if both pages AND highlights exist in the group
- **Saved page items**: Reuse `SavedLessonCard` for each page
- **Sub-header "HIGHLIGHTS"**: Only if both pages AND highlights exist in the group
- **Highlight items**: Use `HighlightItem` for each highlight
- Module accent color theming on the section card border/header

```tsx
const renderSection = useCallback(({ item }: { item: UnifiedSection }) => {
  const mod = moduleMap[item.moduleId];
  const accentColor = mod?.color || DEFAULT_ACCENT;
  const iconName = mapIconName(mod?.icon || 'book');
  const moduleTitle = mod?.title || item.submoduleTitle;
  const hasBothTypes = item.pages.length > 0 && item.highlights.length > 0;
  const totalCount = item.pages.length + item.highlights.length;

  return (
    <View style={styles.sectionCard}>
      {/* Group header */}
      <View style={[styles.sectionHeader, { borderLeftColor: accentColor }]}>
        <View style={[styles.sectionIconCircle, { backgroundColor: accentColor + '18' }]}>
          <MaterialCommunityIcons name={iconName as any} size={18} color={accentColor} />
        </View>
        <Text style={styles.sectionTitle} numberOfLines={1}>{moduleTitle}</Text>
        <Text style={styles.sectionCount}>
          {totalCount} item{totalCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Saved pages */}
      {hasBothTypes && item.pages.length > 0 && (
        <Text style={styles.subHeader}>SAVED PAGES</Text>
      )}
      {item.pages.map(page => (
        <SavedLessonCard
          key={page.id}
          item={page}
          accentColor={accentColor}
          iconName={iconName}
          moduleTitle={moduleTitle}
          onPress={() => openLessonPage(page)}
        />
      ))}

      {/* Highlights */}
      {hasBothTypes && item.highlights.length > 0 && (
        <Text style={styles.subHeader}>HIGHLIGHTS</Text>
      )}
      {item.highlights.map(h => (
        <HighlightItem key={h.id} highlight={h} onNavigate={navigateToHighlight} />
      ))}
    </View>
  );
}, [moduleMap, openLessonPage, navigateToHighlight]);
```

- [ ] **Step 6: Update the FlatList, header title, count label, and empty state**

```tsx
// Update header
<BackHeader title="Saved from Learn" />

// Update count label
const totalItems = sections.reduce((sum, s) => sum + s.pages.length + s.highlights.length, 0);
// ...
{totalItems > 0 && (
  <Text style={styles.countLabel}>
    {totalItems} saved item{totalItems !== 1 ? 's' : ''}
  </Text>
)}

// Update FlatList
<FlatList
  data={sections}
  keyExtractor={item => item.key}
  renderItem={renderSection}
  contentContainerStyle={sections.length === 0 ? styles.emptyListContent : styles.listContent}
  refreshControl={...existing...}
  ListEmptyComponent={
    <EmptyFeedMessage
      icon={<Feather name="book-open" size={27} color={Theme.textInput} />}
      message="Nothing saved from Learn yet"
      submessage={
        <Text style={styles.emptyMessageSubtext}>
          Bookmark lesson pages or highlight text to save them here
        </Text>
      }
    />
  }
/>
```

- [ ] **Step 7: Add styles for section cards, sub-headers, and highlight items**

Add to the StyleSheet: `sectionCard`, `sectionHeader`, `sectionIconCircle`, `sectionTitle`, `sectionCount`, `subHeader`, `highlightItem`, `highlightBar`, `highlightText`, `highlightChevron`. Style the section card with rounded corners, border, and overflow hidden. Sub-headers should be uppercase, small, muted text with left padding.

- [ ] **Step 8: Update loading state to use `isLoadingAll`**

Replace:
```tsx
if (isLoading && !data) {
```
With:
```tsx
if (isLoadingAll) {
```

Update the loading/error screens to use "Saved from Learn" as the header title.

- [ ] **Step 9: Verify type-check passes**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 10: Commit**

```bash
git add unify-front-end/app/saved-lessons.tsx
git commit -m "feat: unified 'Saved from Learn' screen with grouped pages and highlights"
```

---

### Task 4: Delete SavedHighlightsList Component

**Files:**
- Delete: `unify-front-end/components/learn/SavedHighlightsList.tsx`

- [ ] **Step 1: Delete the file**

```bash
rm unify-front-end/components/learn/SavedHighlightsList.tsx
```

- [ ] **Step 2: Verify no remaining imports reference it**

Run: `grep -r "SavedHighlightsList" unify-front-end/`
Expected: No matches (the saved.tsx import was already removed in Task 1)

- [ ] **Step 3: Verify type-check passes**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add -u unify-front-end/components/learn/SavedHighlightsList.tsx
git commit -m "chore: delete SavedHighlightsList, absorbed into saved-lessons"
```

---

### Task 5: Final Verification

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 2: Verify no stale references**

Run: `grep -r "SavedHighlightsList\|Saved Lessons" unify-front-end/ --include="*.tsx" --include="*.ts"`
Expected: No matches for `SavedHighlightsList`. Only match for `Saved Lessons` should be in irrelevant places (not ProfileModal label).

- [ ] **Step 3: Push all changes**

```bash
git push
```
