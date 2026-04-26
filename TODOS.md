# TODOS

## P1 — High Priority

### Push Notification Infrastructure + Policy Change Alerts
**What:** Build Expo push notification infrastructure (token storage, permission flow, backend notification service), then add policy-change-to-notification logic that matches changed topics to user onboarding profiles.
**Why:** When IRCC updates a policy, affected users should know immediately instead of discovering it during their next Companion conversation.
**Pros:** Massive engagement driver. Positions Unify as proactive, not reactive.
**Cons:** Significant scope (push infra from scratch). Notification fatigue risk if not carefully tuned.
**Context:** The crawler's change detection logging (from the RAG automated ingestion pipeline) provides the trigger data. Push token storage and delivery service are the missing pieces.
**Effort:** XL (human) → L (CC)
**Depends on:** RAG automated ingestion pipeline (change detection in crawl_logs), Personalization Engine (provides `onboarding_profiles` with city/province and `personalize` edge function pattern for matching policy changes to user profiles — see `docs/designs/personalization-engine.md`)

## P2 — Medium Priority

### Component Test Infrastructure (React Testing Library)
**What:** Set up `@testing-library/react-native` and configure Jest for component-level tests. Establish first component test patterns so future features can include component-level regression coverage by default.
**Why:** Project currently has only utility/service tests in `__tests__/`. Component-heavy features (Resources, Checklist, Learn) ship without component-level regression coverage. As the app grows, the absence of this infrastructure compounds into a risk every release.
**Pros:** Every future feature can ship with component tests at marginal cost. Establishes a culture where UI regressions get caught pre-merge.
**Cons:** Initial setup work + introducing a new test pattern means ramp time for the team. Maintenance burden on test fixtures.
**Context:** Surfaced during plan-eng-review of the Referral Monetization (Resources tab) design doc. The Resources feature shipped with manual QA only; component tests were deferred. Future features should not have to repeat that decision.
**Effort:** M (human) → S (CC)
**Depends on:** —

### i18n Extraction for Resources Copy
**What:** When multi-language support lands, extract hardcoded copy from the Resources screens (disclosure card, category descriptions, partner CTAs, error toasts, "How Unify partnerships work" link text) to a strings file consumed by an i18n library.
**Why:** Newcomer audience strongly implies multi-language support will be on the roadmap. Newcomers in their first 6-12 months often have stronger comprehension in their native language than in English. Hardcoded copy in components becomes harder to extract once it's spread across files.
**Pros:** Makes the feature ready for the broader i18n initiative without rework.
**Cons:** Pure scope creep until i18n is actually committed to.
**Context:** Surfaced during plan-eng-review of Referral Monetization (Resources tab). Flagged as code quality issue Q-3 — copy hardcoded in JSX. No i18n library currently in the project.
**Effort:** S (human) → S (CC)
**Depends on:** Project-level decision to add i18n (e.g., `i18n-js`, `react-i18next`, or Expo's localization solution)

### Intersection-based View Tracking for Partner Cards
**What:** Switch the `resources_partner_card_viewed` PostHog event from on-render firing to intersection/scroll-based detection (only fire when a card is actually visible in the viewport, with debouncing).
**Why:** At V1 scale (2 partners) on-render firing is fine. Once a category has 5+ partners, on-render fires events for cards the user never actually scrolls into view, polluting analytics with noise and inflating event counts in PostHog.
**Pros:** Cleaner analytics, accurate "saw this partner" attribution. Lower PostHog event volume = lower cost.
**Cons:** React Native intersection observation requires `onLayout` + scroll position math (no native API equivalent to web's IntersectionObserver). Implementation is non-trivial.
**Context:** Surfaced during plan-eng-review of Referral Monetization (Resources tab). Flagged as performance watch zone for V2 when partner count grows.
**Effort:** M (human) → S (CC)
**Depends on:** Resources tab live in production with partner count ≥5 per category
