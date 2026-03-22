# Learn Feature Announcement Modal

## Overview

A generic, reusable announcement modal that displays once per storage key. First use case: telling users about the new text highlighting and Ask AI features on the Learn tab.

## Component: AnnouncementModal

**File:** `components/common/AnnouncementModal.tsx`

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `storageKey` | `string` | Yes | — | AsyncStorage key (e.g. `'announcement.learnHighlights.v1'`) |
| `title` | `string` | Yes | — | Modal title |
| `body` | `string` | Yes | — | Description/instructions text |
| `buttonLabel` | `string` | No | `"Got it"` | Dismiss button label |
| `icon` | `React.ReactNode` | No | — | Optional icon above the title |

### Behavior

- On mount, reads `storageKey` from AsyncStorage. Renders nothing until the read resolves (prevents flash for returning users). If read fails, defaults to showing the modal.
- If not seen, displays a centered modal with fade animation.
- Tapping the button writes `'true'` to AsyncStorage and dismisses the modal.
- Tapping the backdrop does nothing — user must use the button to ensure they read the content.
- Android back button (`onRequestClose`): dismisses the modal and marks as seen (same as tapping the button).
- Self-contained: no context, no provider. Drop it anywhere and pass props.

### Visual Treatment

- Centered card: white background, 16px border radius, max width ~320px
- Backdrop: `rgba(0, 0, 0, 0.4)` — matches existing `ExplainTermModal`
- Fade animation on appear (React Native Modal `animationType="fade"`)
- Content layout (vertical stack): title (bold, 18px) → body (regular, 15px, muted gray) → button (full-width, dark background `#1F2937`, white text, 10px border radius)
- Padding: 24px
- No close X button

### Versioning Strategy

The `storageKey` encodes the version. When shipping a new Learn feature:
1. Update the title, body, and icon props
2. Bump the key from `v1` to `v2` (e.g. `'announcement.learnHighlights.v2'`)

The user sees each version exactly once. Old keys remain in storage harmlessly.

## Integration: Learn Tab

**File:** `app/(tabs)/Learn/index.tsx`

Render `AnnouncementModal` at the bottom of the JSX tree:

```tsx
<AnnouncementModal
  storageKey="announcement.learnHighlights.v1"
  title="New: Highlight & Ask AI"
  body="Long press any word or phrase in a lesson to highlight it or ask AI to explain it. Your highlights are saved under 'Saved from Learn' in your profile."
  buttonLabel="Got it"
/>
```

## Reuse Outside Learn

The component is generic. Any screen can use it with a different `storageKey`:

```tsx
<AnnouncementModal
  storageKey="announcement.someOtherFeature.v1"
  title="New Feature"
  body="Description here."
/>
```

## Out of Scope

- Illustrations or graphics in the modal
- Multi-step onboarding flows
- Analytics tracking of modal views/dismissals
- "What's New" history screen
