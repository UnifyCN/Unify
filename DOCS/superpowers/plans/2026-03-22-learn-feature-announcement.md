# Learn Feature Announcement Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generic, reusable announcement modal that shows once per version key, and use it on the Learn tab to announce the text highlighting and Ask AI features.

**Architecture:** A single self-contained component (`AnnouncementModal`) manages its own visibility via AsyncStorage. It renders nothing until the storage read resolves, then either shows the modal or stays hidden. The Learn tab renders it with highlight-specific content.

**Tech Stack:** React Native, AsyncStorage, React Native Modal

**Spec:** `docs/superpowers/specs/2026-03-22-learn-feature-announcement-design.md`

**Skills:** Use `/frontend-design` when building the modal UI.

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `unify-front-end/components/common/AnnouncementModal.tsx` | Generic show-once announcement modal |
| Modify | `unify-front-end/app/(tabs)/Learn/index.tsx` | Render AnnouncementModal with highlight feature content |

---

### Task 1: Create AnnouncementModal Component

**Files:**
- Create: `unify-front-end/components/common/AnnouncementModal.tsx`

- [ ] **Step 1: Create the AnnouncementModal component**

Use the `/frontend-design` skill to create a distinctive, polished modal. The component must:

1. Accept props: `storageKey: string`, `title: string`, `body: string`, `buttonLabel?: string` (default `"Got it"`), `icon?: React.ReactNode`
2. On mount, read `storageKey` from AsyncStorage. Render nothing until the read resolves. If read fails, default to showing the modal.
3. If the key is `'true'`, render nothing permanently.
4. If not seen, render a centered modal with fade animation.
5. The dismiss handler writes `'true'` to AsyncStorage and hides the modal.
6. `onRequestClose` (Android back button) triggers the same dismiss handler.
7. Backdrop tap does nothing — user must use the button.

**Visual spec:**
- Centered card: white background, 16px border radius, max width ~320px
- Backdrop: `rgba(0, 0, 0, 0.4)`
- Fade animation: `animationType="fade"` on React Native Modal
- Content stack (vertical): optional icon → title (bold, 18px) → body (regular, 15px, muted gray `#6B7280`) → button (full-width, `#1F2937` background, white text, 10px border radius)
- Padding: 24px
- No close X button
- Backdrop is a plain `View` (no tap handler) — card is also a plain `View`. No backdrop dismiss needed, so no `TouchableOpacity` wrappers required.

**Reference patterns:**
- `ExplainTermModal` (`components/learn/ExplainTermModal.tsx`) — Modal structure, overlay, fade animation
- `HapticsContext` (`context/HapticsContext.tsx`) — AsyncStorage read pattern with loading guard

```tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AnnouncementModalProps {
  storageKey: string;
  title: string;
  body: string;
  buttonLabel?: string;
  icon?: React.ReactNode;
}

export default function AnnouncementModal({
  storageKey,
  title,
  body,
  buttonLabel = 'Got it',
  icon,
}: AnnouncementModalProps) {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const seen = await AsyncStorage.getItem(storageKey);
        if (seen !== 'true') {
          setVisible(true);
        }
      } catch {
        // If read fails, show the modal (safe default)
        setVisible(true);
      } finally {
        setLoaded(true);
      }
    })();
  }, [storageKey]);

  const dismiss = useCallback(async () => {
    setVisible(false);
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch {
      // Best-effort write — modal won't re-show this session anyway
    }
  }, [storageKey]);

  if (!loaded || !visible) return null;

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <Pressable style={styles.button} onPress={dismiss}>
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#1F2937',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/components/common/AnnouncementModal.tsx
git commit -m "feat: add generic AnnouncementModal component with AsyncStorage show-once logic"
```

---

### Task 2: Integrate on Learn Tab

**Files:**
- Modify: `unify-front-end/app/(tabs)/Learn/index.tsx`

- [ ] **Step 1: Add import and render AnnouncementModal**

Add import at the top of the file:
```tsx
import AnnouncementModal from '@/components/common/AnnouncementModal';
```

Add the modal between the closing tag of `styles.container` (the inner `View`) and the closing tag of `styles.root` (the outermost `View`). Structurally, this is a sibling of the `styles.container` View, inside `styles.root`:

```tsx
      </View>
      <AnnouncementModal
        storageKey="announcement.learnHighlights.v1"
        title="New: Highlight & Ask AI"
        body="Long press any word or phrase in a lesson to highlight it or ask AI to explain it. Your highlights are saved under 'Saved from Learn' in your profile."
        buttonLabel="Got it"
      />
    </View>
```

The modal renders at the end of the JSX tree so it overlays all Learn tab content.

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add unify-front-end/app/(tabs)/Learn/index.tsx
git commit -m "feat: show highlight & Ask AI announcement on Learn tab"
```

---

### Task 3: Final Verification

- [ ] **Step 1: Full type-check**

Run: `npx tsc --noEmit --project unify-front-end/tsconfig.json`
Expected: No errors

- [ ] **Step 2: Verify no stale references**

Run: `grep -r "AnnouncementModal" unify-front-end/ --include="*.tsx" --include="*.ts"`
Expected: Exactly 2 matches — the component file and the Learn tab import/usage.

- [ ] **Step 3: Push all changes**

```bash
git push
```
