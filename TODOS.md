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
