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

### Multi-surface invite prompts (post-onboarding, post-checklist, Companion home)

**What:** Surface "Invite a friend" CTA at peak-positive moments beyond the Settings entry point, mirroring the iOS App Store review prompt pattern shipped in #245.
**Why:** Settings is a passive surface — most users will never go look. Contextual prompts (right after onboarding completion, after a Checklist item completes with confetti, on Companion home next to chips) capture users at the moment they feel most positive about the app.
**Pros:** Substantial multiplier on share volume. Reuses existing peak-moment patterns. Low marginal effort once the v1 invite flow is live.
**Cons:** Risk of feeling pushy if calibrated wrong. Each new surface needs cooldown logic (don't ask the same user 3x in a session).
**Context:** Ship after v1 referral feature (`feat/referrals`) lands and you have 1-2 weeks of baseline metrics. Then layer prompts and A/B test which surface drives the highest invite rate.
**Effort:** M (human) → S (CC)
**Depends on:** v1 referral feature (Settings entry, redeem-referral edge fn, welcome moment) shipped first.

### Branch.io / hosted-domain migration if attribution rate < 30% after 4 weeks

**What:** If the v1 clipboard-based attribution rate is materially worse than 30% combined (clipboard + manual), migrate to either (a) a hosted invite domain with apple-app-site-association for Universal Links, or (b) Branch.io for full deferred deep linking.
**Why:** Domain-free clipboard attribution is the right v1 trade-off (avoids hosting work) but realistic iOS 17+ clipboard hit rates are 30-50%. If the actual measured rate is below 30%, the welcome moment is firing on too few installs to justify the build effort.
**Pros:** Bulletproof attribution; UL also opens the app for already-installed users. Schema is forward-compatible — only client + edge fn changes are needed.
**Cons:** Adds infra (hosted domain) or vendor lock-in (Branch.io) + ATT prompt + privacy policy update.
**Context:** Trigger condition: 4 weeks of v1 metrics with attribution rate < 30%. Decision criterion is per-cohort, not per-day. The `referrals.source` enum already includes 'universal_link' for forward compat.
**Effort:** M (human) → M (CC) for hosted domain; L (human) → M (CC) for Branch.io.
**Depends on:** v1 referral feature shipped + 4 weeks of attribution metrics in PostHog.

## P3 — Low Priority

### Cohort hint on welcome-from-inviter moment

**What:** When inviter and invitee both have month + city set in their onboarding profile and they match, show "You're both new to Toronto, October 2026" on the welcome screen.
**Why:** Strengthens the "you're not alone in this" emotional beat that the welcome moment is designed to deliver.
**Pros:** Cheap, strengthens core differentiator (cohort-aware app for newcomers).
**Cons:** Limited applicability if inviter and invitee aren't actually in the same cohort. Need a graceful fallback when they don't match.
**Effort:** S (human) → XS (CC)
**Depends on:** v1 referral feature shipped.

### Pre-drafted DM from inviter to invitee on signup (DECISION RECORD — DO NOT IMPLEMENT)

**What:** Auto-compose a "Welcome to Unify! Let me know if you need anything" DM from inviter to invitee at the moment of redemption.
**Decision:** Rejected during /plan-ceo-review on 2026-04-28. Risk of feeling robotic if invitees realize the message is auto-generated. The "Say hi to Sarah" CTA on the welcome screen achieves the same outcome with the inviter's voice.
**Reconsider if:** v1 metrics show >50% of welcome-screen views do NOT result in an inviter↔invitee message exchange within 7 days, and you have evidence the friction is the missing first message rather than missing intent.
**Effort if implemented:** M (human) → ~30-45 min (CC).
