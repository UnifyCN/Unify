# Unified "Saved from Learn" Screen

## Overview

Consolidate saved lesson pages and text highlights into a single "Saved from Learn" screen, grouped by submodule/lesson. Remove highlights from the social "Saved" page, which reverts to a flat list of saved posts.

## Changes

### 1. Profile Modal (`components/home/ProfileModal.tsx`)

- Rename menu item label from "Saved Lessons" to "Saved from Learn"
- Keep `book` icon and `/saved-lessons` route

### 2. Saved Page (`app/saved.tsx`)

- Remove segmented tab control (`activeTab` state, TouchableOpacity tabs)
- Remove `SavedHighlightsList` import and highlights tab rendering
- Render `FeedWithHook` directly (flat list of saved posts)
- Header stays "Saved"

### 3. Saved Lessons Page (`app/saved-lessons.tsx`) — Primary Change

#### Data Sources

- `useSavedLessonPages()` — bookmarked pages (existing hook)
- `useAllHighlights()` — text highlights (existing hook from `hooks/highlights/useHighlights.ts`)

#### Grouping Logic

1. Group both data sources by `submoduleId` (fall back to `lessonId` for highlights without submodule data)
2. Each group becomes a section card with the submodule title as header
3. Within each group:
   - **Saved pages first** — sorted chronologically (newest first)
   - **Highlights below** — sorted chronologically (newest first)
4. Groups ordered by most recent activity across both types (newest item in group determines group position)

#### Section Card Layout

```
┌─ [icon] Filing Your Taxes ──────────────┐
│                                          │
│  SAVED PAGES                             │
│  ┌─ [bar] Tax Forms & Documents     → ─┐│
│  │   Lesson 2 · 3 days ago              ││
│  ├─ [bar] Important Deadlines       → ─┤│
│  │   Lesson 2 · 1 week ago              ││
│  └──────────────────────────────────────┘│
│                                          │
│  HIGHLIGHTS                              │
│  ┌─ [yellow bar] "T4 slip"          → ─┐│
│  ├─ [yellow bar] "RRSP contribution" → ─┤│
│  └──────────────────────────────────────┘│
└──────────────────────────────────────────┘
```

- Section sub-headers ("SAVED PAGES", "HIGHLIGHTS") only shown when both types exist in a group
- If a group has only one type, items render directly without a sub-header
- Module color theming from `useSanityModules()` applies to accent bars and icons

#### Visual Treatment

- **Saved pages**: Reuse existing `SavedLessonCard` style — accent bar (module color), module icon in circle, page title, lesson title + time ago meta row, chevron
- **Highlights**: Reuse existing highlight item style — yellow highlight bar, quoted italic text, chevron for navigable items
- **Group header**: Module icon + submodule title + item count badge, styled similar to current `SavedHighlightsList` section headers but with module color theming

#### Navigation

- Saved page tap → lesson page (existing `openLessonPage` logic)
- Highlight tap → lesson page via `module_id`/`submodule_id`/`lessonId`/`page_num` (existing `navigateToHighlight` logic)

#### Empty State

- Message: "Nothing saved from Learn yet"
- Submessage: "Bookmark lesson pages or highlight text to save them here"

### 4. Component Cleanup

- `SavedHighlightsList` (`components/learn/SavedHighlightsList.tsx`) — delete file (logic absorbed into unified saved-lessons page)
- Remove `SavedHighlightsList` import from `app/saved.tsx`

### 5. Implementation Notes

- Use `/frontend-design` skill when building the unified section cards for distinctive, polished UI
- Use `/vercel-react-native-skills` for React Native performance patterns (memoized list items, stable callbacks, useMemo for grouping)
- The grouping/merging logic should live in a `useMemo` that combines both data sources
- Each section item component should be `React.memo`'d
- Use `FlatList` for the outer list of groups

### 6. Out of Scope

- Highlight creation/deletion flow in lesson pages — unchanged
- Highlight data model / Supabase tables — unchanged
- Bookmark feature in `SubmoduleProgressBar` — unchanged
- Analytics events — unchanged
