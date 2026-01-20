# AI Companion Contextualization - Deployment Guide

## 🚀 Quick Deployment Steps

Follow these steps to deploy the AI Companion Contextualization feature to production.

---

## ✅ Pre-Deployment Checklist

- [ ] Code changes reviewed and tested locally
- [ ] Database migration script ready
- [ ] Supabase project access confirmed
- [ ] Edge function deployment permissions verified
- [ ] Backup of current database taken

---

## 📝 Step-by-Step Deployment

### Step 1: Deploy Database Migration

**File**: `supabase/migrations/create_user_onboarding_profiles.sql`

**Instructions**:
1. Log in to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `create_user_onboarding_profiles.sql`
5. Paste into the SQL Editor
6. Click **Run** to execute
7. Verify success (should see "Success. No rows returned")

**Verification**:
```sql
-- Run this query to verify table exists
SELECT * FROM user_onboarding_profiles LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'user_onboarding_profiles';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'user_onboarding_profiles';
```

**Expected Results**:
- Table `user_onboarding_profiles` exists
- 4 RLS policies created (SELECT, INSERT, UPDATE, DELETE)
- 3 indexes created (persona, time_in_canada, onboarding_completed)
- Trigger for auto-updating `updated_at` timestamp

---

### Step 2: Deploy Edge Function

**File**: `supabase/functions/rag-query/index.ts`

**Instructions**:

#### Option A: Deploy via Supabase CLI (Recommended)
```bash
# 1. Navigate to project root
cd c:\Users\ericj\Unify\unify-front-end

# 2. Login to Supabase (if not already)
supabase login

# 3. Link to your project (if not already)
supabase link --project-ref YOUR_PROJECT_REF

# 4. Deploy the function
supabase functions deploy rag-query

# 5. Verify deployment
supabase functions list
```

#### Option B: Deploy via Supabase Dashboard
1. Go to **Edge Functions** in Supabase dashboard
2. Find `rag-query` function
3. Click **Deploy new version**
4. Upload the updated `index.ts` file
5. Confirm deployment

**Verification**:
```bash
# Test the function
supabase functions invoke rag-query --body '{"prompt":"test","userId":"test-user-id"}'

# Check logs
supabase functions logs rag-query
```

---

### Step 3: Verify Environment Variables

Ensure these environment variables are set in your Supabase Edge Function:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
GEMINI_MODEL=gemini-2.0-flash
S3_BUCKET_NAME=your-s3-bucket-name (if using S3 for docs)
S3_REGION=your-s3-region (if using S3)
```

**To Set/Update**:
1. Go to **Edge Functions** → **rag-query**
2. Click **Settings**
3. Add/update environment variables
4. Save changes
5. Redeploy function if needed

---

### Step 4: Deploy Frontend Changes

**Files Modified**:
- `supabase/functions/rag-query/index.ts` (hobby labels fix)

**Instructions**:

Since the main changes are in the Edge Function (backend), frontend deployment depends on your setup:

#### If using Expo/React Native:
```bash
# 1. Build new version
npm run build

# 2. Create new EAS build (if using EAS)
eas build --platform all

# 3. Or publish update (for OTA updates)
eas update --branch production
```

#### If using web deployment:
```bash
# Deploy to your hosting provider
npm run deploy
# or
vercel deploy --prod
# or
netlify deploy --prod
```

---

### Step 5: Post-Deployment Verification

#### Test 1: New User Onboarding
1. Create a new test user account
2. Complete the onboarding quiz
3. Check database:
   ```sql
   SELECT * FROM user_onboarding_profiles 
   WHERE id = 'test-user-uuid';
   ```
4. Verify data was saved correctly

#### Test 2: AI Companion Context
1. Log in as the test user
2. Open AI Companion
3. Send a message (e.g., "How do I open a bank account?")
4. Check Edge Function logs:
   ```bash
   supabase functions logs rag-query --limit 50
   ```
5. Look for:
   - `User ID: test-user-uuid`
   - `Fetched user onboarding profile`
   - `User profile context: The user is...`
   - `Has user profile context: true`

#### Test 3: Personalized Response
1. Send message: "What should I know about taxes?"
2. Verify response includes:
   - Persona-specific advice (e.g., "As an international student...")
   - Relevant to their time in Canada
   - Addresses their stated goals/interests
3. Response should NOT ask for persona/situation

#### Test 4: Edge Cases
1. **No Profile**: Create user, skip onboarding, test AI
   - Should work without errors
   - Logs: "No profile data found for user: ..."
   
2. **Partial Profile**: User with only persona, no goals
   - Should work with available context
   - Should not crash on missing fields

3. **Error Handling**: Invalid userId
   - Should gracefully continue without context
   - Should not break the chat experience

---

### Step 6: Monitor Production

#### Check Logs Regularly
```bash
# View recent function logs
supabase functions logs rag-query --limit 100

# Filter for errors
supabase functions logs rag-query | grep -i error

# Filter for profile fetches
supabase functions logs rag-query | grep -i "profile"
```

#### Monitor Database Performance
```sql
-- Check profile query performance
EXPLAIN ANALYZE 
SELECT * FROM user_onboarding_profiles 
WHERE id = 'sample-uuid';

-- Check for slow queries
SELECT * FROM pg_stat_statements 
WHERE query LIKE '%user_onboarding_profiles%'
ORDER BY mean_exec_time DESC;
```

#### Track Metrics
- Profile completion rate
- Profile fetch success rate
- Edge function response time
- User satisfaction with personalized responses

---

## 🔄 Rollback Plan

If issues arise, you can rollback:

### Rollback Edge Function
```bash
# List function versions
supabase functions list --with-versions rag-query

# Deploy previous version
supabase functions deploy rag-query --version PREVIOUS_VERSION_ID
```

### Rollback Database (if needed)
```sql
-- Drop table (CAREFUL - data loss!)
DROP TABLE IF EXISTS user_onboarding_profiles CASCADE;

-- Or disable RLS temporarily
ALTER TABLE user_onboarding_profiles DISABLE ROW LEVEL SECURITY;
```

### Disable Feature Temporarily
In `rag-query/index.ts`, comment out profile fetching:
```typescript
// Temporarily disable profile context
let userProfileContext = '';
/*
if (userId) {
  // ... profile fetching code ...
}
*/
```

---

## 🐛 Common Deployment Issues

### Issue 1: "Table doesn't exist"
**Cause**: Migration not run or failed  
**Fix**: Re-run migration SQL script in Supabase SQL Editor

### Issue 2: "RLS policy violation"
**Cause**: Service role key not set or incorrect  
**Fix**: Verify `SUPABASE_SERVICE_ROLE_KEY` in edge function settings

### Issue 3: "Profile fetch returns null"
**Cause**: User hasn't completed onboarding  
**Fix**: Expected behavior - feature gracefully handles this

### Issue 4: "Missing hobby labels"
**Cause**: Old version of edge function deployed  
**Fix**: Redeploy latest version with all hobby mappings

### Issue 5: Function timeout
**Cause**: Profile query too slow  
**Fix**: Check indexes exist, optimize query, cache profile data

---

## 📊 Success Metrics

### Immediate (Day 1)
- [ ] Database migration successful
- [ ] Edge function deployed without errors
- [ ] Test user can complete onboarding
- [ ] Profile data saves to database
- [ ] AI receives and uses profile context
- [ ] No errors in function logs

### Short-term (Week 1)
- [ ] 80%+ of new users complete onboarding
- [ ] Profile fetch success rate > 95%
- [ ] Zero critical errors related to profile fetching
- [ ] Response time increase < 100ms
- [ ] User feedback indicates improved relevance

### Long-term (Month 1)
- [ ] Reduced clarification questions in chat
- [ ] Higher user satisfaction scores
- [ ] Increased engagement with AI Companion
- [ ] Positive feedback on personalized responses
- [ ] Lower churn rate for new users

---

## 📞 Post-Deployment Support

### For Development Team
**Monitoring**:
- Check Supabase dashboard daily
- Review function logs for errors
- Monitor database performance
- Track user feedback

**Maintenance**:
- Update hobby/goal labels as needed
- Optimize profile context format
- Improve error handling based on logs

### For Product Team
**User Education**:
- Highlight feature in onboarding
- Show examples of personalized responses
- Explain benefits in marketing materials

**Feedback Collection**:
- Track: "Was this response helpful?"
- Monitor: Support tickets about AI responses
- Survey: User satisfaction with personalization

---

## 🎉 Launch Checklist

Before announcing the feature:

- [ ] All deployment steps completed successfully
- [ ] All verification tests passed
- [ ] No errors in production logs (24 hours)
- [ ] Database performance acceptable
- [ ] Edge function response time acceptable
- [ ] Test with multiple persona types
- [ ] Test with partial/complete profiles
- [ ] Error handling verified
- [ ] Rollback plan documented and tested
- [ ] Team trained on monitoring/support
- [ ] User documentation updated
- [ ] Marketing materials prepared
- [ ] Support team briefed on feature

---

## 📝 Deployment Notes

**Date**: _____________  
**Deployed by**: _____________  
**Version**: _____________  

**Issues encountered**:
- 
- 

**Resolutions**:
- 
- 

**Follow-up actions**:
- 
- 

**Metrics baseline** (before deployment):
- Avg response time: _____ ms
- User satisfaction: _____ %
- Onboarding completion: _____ %

**Metrics after deployment** (7 days later):
- Avg response time: _____ ms
- User satisfaction: _____ %
- Onboarding completion: _____ %
- Profile context usage: _____ %

---

## 🔗 Related Documentation

- [Implementation Summary](./AI_COMPANION_CONTEXTUALIZATION_IMPLEMENTATION.md)
- [Quick Reference Guide](./AI_COMPANION_CONTEXTUALIZATION_QUICK_REFERENCE.md)
- Database Migration: `supabase/migrations/create_user_onboarding_profiles.sql`
- Edge Function: `supabase/functions/rag-query/index.ts`

---

**Good luck with your deployment! 🚀**

If you encounter any issues not covered here, refer to the Supabase documentation or contact the development team.
