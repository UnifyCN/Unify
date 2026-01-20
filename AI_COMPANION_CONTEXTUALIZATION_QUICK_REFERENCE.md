# AI Companion Contextualization - Quick Reference

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER SIGNUP                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              ONBOARDING QUIZ (OnboardingQuiz.tsx)                │
│  - Select Persona (student/worker/refugee)                       │
│  - Time in Canada (not arrived / < 1yr / 1-2yr / 2-3yr / 3+)   │
│  - Goals (learn/community/answers)                               │
│  - Learning Interests (immigration/jobs/finance/housing)         │
│  - Hobbies (career/wellness/tech/food/etc)                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│     SAVE TO DATABASE (saveOnboardingProfile.ts)                  │
│     Table: user_onboarding_profiles                              │
│     Linked to: auth.users.id                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ╔═══════════════════════════════════╗
              ║   USER PROFILE STORED IN DB       ║
              ╚═══════════════════════════════════╝
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
   ┌──────────────────┐          ┌──────────────────┐
   │  FUTURE VISITS   │          │   OTHER USERS    │
   │  (Same User)     │          │  (Different ID)  │
   └──────────────────┘          └──────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    USER OPENS AI COMPANION                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              USER ASKS QUESTION (useSendMessage.ts)              │
│  - Get authenticated userId                                      │
│  - Format conversation history (last 10 messages)                │
│  - Call: callGeminiAPI(message, convId, history, userId)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│           FRONTEND API CALL (gemini.ts)                          │
│  supabase.functions.invoke('rag-query', {                       │
│    prompt: "How do I open a bank account?",                      │
│    conversationId: "abc-123",                                    │
│    messages: [...last 10],                                       │
│    userId: "user-uuid-456"  ◀── USER ID SENT                     │
│  })                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│         EDGE FUNCTION HANDLER (rag-query/index.ts)               │
│                                                                  │
│  1. Receive request with userId                                 │
│  2. FETCH USER PROFILE:                                          │
│     SELECT * FROM user_onboarding_profiles                       │
│     WHERE id = userId                                            │
│                                                                  │
│  3. BUILD PROFILE CONTEXT:                                       │
│     "The user is an international student.                       │
│      They have been in Canada for less than 1 year.              │
│      Their goals include: learn something new, get quick         │
│      trustworthy answers.                                        │
│      They're interested in: PR & immigration, jobs & career."    │
│                                                                  │
│  4. CLASSIFY QUERY (immigration/settlement/general)              │
│                                                                  │
│  5. RAG RETRIEVAL (if needed):                                   │
│     - Generate embedding for question                            │
│     - Search knowledge base (match_chunks)                       │
│     - Retrieve relevant document chunks                          │
│                                                                  │
│  6. BUILD SYSTEM INSTRUCTION:                                    │
│     ┌─────────────────────────────────────────────────┐         │
│     │ PREPROMPT (optional)                             │         │
│     │ + USER PROFILE CONTEXT ◀── INJECTED HERE         │         │
│     │ + SYSTEM INSTRUCTION (role, rules, format)       │         │
│     │ + KNOWLEDGE BASE CONTEXT (RAG results)           │         │
│     └─────────────────────────────────────────────────┘         │
│                                                                  │
│  7. FORMAT REQUEST FOR GEMINI:                                   │
│     contents: [                                                  │
│       { role: "user", text: systemInstruction },                 │
│       { role: "model", text: "Understood..." },                  │
│       ...conversationHistory,                                    │
│       { role: "user", text: currentQuestion }                    │
│     ]                                                            │
│                                                                  │
│  8. CALL GEMINI API                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GEMINI AI (Google)                              │
│  Processes:                                                      │
│  - User profile context (persona, time, goals)                   │
│  - Conversation history (last 10 messages)                       │
│  - Current question                                              │
│  - Knowledge base information (RAG)                              │
│                                                                  │
│  Generates: Personalized, context-aware response                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            RESPONSE FORMATTING (rag-query/index.ts)              │
│  - Extract AI answer                                             │
│  - Parse suggestions (if any)                                    │
│  - Include sources (if RAG was used)                             │
│  - Add disclaimer (if applicable)                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RETURN TO FRONTEND                                  │
│  {                                                               │
│    answer: "For international students in Canada...",            │
│    sources: [...],                                               │
│    queryType: "newcomer_settlement",                             │
│    disclaimer: "This is general information...",                 │
│    suggestedNextSteps: ["How to compare banks?", ...]            │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│            DISPLAY TO USER (UI Component)                        │
│  ✅ Personalized answer based on their profile                   │
│  ✅ No need to re-explain situation                              │
│  ✅ Relevant, actionable advice                                  │
│  ✅ Consistent across all conversations                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Example: Before vs After

### ❌ BEFORE (Without Context)
```
User: "How do I open a bank account?"

AI: "I don't know your situation. Are you a student, worker, 
or refugee? How long have you been in Canada? What are your 
financial goals?"

User: "I'm an international student, been here 2 months."

AI: "For international students new to Canada, you'll need..."
```
**Problems**: 
- Wasted 1 of 3 daily prompts on clarification
- Frustrating back-and-forth
- Repetitive in every chat

---

### ✅ AFTER (With Context)
```
User: "How do I open a bank account?"

AI: "As an international student who's been in Canada less 
than a year, here's what you need to open a bank account:

## Short Answer
Visit any major bank (RBC, TD, Scotiabank) with your passport, 
study permit, and proof of enrollment.

## Explanation
Most banks have student packages with no monthly fees. Since 
you're focusing on learning about finance, I recommend 
starting with a student chequing account...
```
**Benefits**:
- Immediate, relevant answer
- No clarification needed
- Personalized to student status
- Maximizes value of limited prompts

---

## 📊 Context Injection Example

### User Profile in Database
```json
{
  "id": "user-123",
  "persona": "international_student",
  "time_in_canada": "less_than_1_year",
  "goals": ["learn_something", "quick_answers"],
  "learning_interests": ["pr_immigration", "employment", "finance"],
  "hobbies": ["career_growth", "technology", "personal_finance"]
}
```

### Converted to AI Context
```
USER PROFILE CONTEXT:
The user is an international student. They have been in Canada 
for less than 1 year. Their goals include: learn something new, 
get quick, trustworthy answers. They're interested in learning 
about: PR & immigration, jobs & career, money & banking. Their 
hobbies and interests: career & professional growth, technology 
& digital skills, personal finance.

Use this context to personalize your responses and make them 
more relevant to the user's situation and interests.
```

### AI System Instruction (Complete)
```
[PREPROMPT - optional custom instructions]

USER PROFILE CONTEXT:
The user is an international student. They have been in Canada 
for less than 1 year...

You are Unify's AI assistant, helping newcomers to Canada 
navigate immigration and settlement topics...

KNOWLEDGE BASE CONTEXT:
[Document: Opening a Bank Account in Canada]
For newcomers, you'll need: passport, study/work permit...
```

---

## 🔐 Security & Privacy

### Row Level Security (RLS)
```sql
-- Users can ONLY access their own profile
CREATE POLICY "Users can view their own onboarding profile"
    ON user_onboarding_profiles
    FOR SELECT
    USING (auth.uid() = id);
```

### Data Handling
- ✅ Only non-sensitive data used (persona, goals, interests)
- ✅ No financial, health, or personally identifiable info
- ✅ Profile stored securely in Supabase with RLS
- ✅ Service role key used server-side only
- ✅ User can't access other users' profiles

---

## 🛠️ Troubleshooting

### Issue: AI doesn't use profile context
**Check**:
1. Is `userId` being passed in API call? (Check network tab)
2. Does user have a profile in database? (Check Supabase table)
3. Are there logs showing profile fetch? (Check function logs)
4. Is profile context being built? (Look for "User profile context:" log)

### Issue: Profile fetch fails
**Check**:
1. Database table exists and RLS policies are correct
2. Service role key has permission to read table
3. User ID matches between auth.users and user_onboarding_profiles
4. Check error logs in Supabase edge function

### Issue: Hobbies not showing in context
**Check**:
1. ✅ FIXED: All hobby types now have labels in mapping
2. Verify user profile has hobbies array populated
3. Check logs for "Their hobbies and interests:" output

---

## 📈 Performance Considerations

### Database Query
- **Indexed**: `persona`, `time_in_canada`, `onboarding_completed`
- **Complexity**: Simple SELECT by primary key (very fast)
- **Caching**: Frontend can cache profile data (React Query)

### API Latency
- Profile fetch adds ~50-100ms to request
- Acceptable trade-off for personalization
- Parallel with other operations (negligible impact)

### Token Usage
- Profile context adds ~50-150 tokens per request
- Still well within Gemini limits
- Improves response quality (worth the cost)

---

## 🎓 Best Practices

1. **Always pass userId when available**
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   callGeminiAPI(message, convId, history, user?.id);
   ```

2. **Handle missing profiles gracefully**
   ```typescript
   if (!profile) {
     // Continue without context - don't break the chat
   }
   ```

3. **Keep profile context concise**
   - Only include relevant fields
   - Use human-readable labels
   - Don't overwhelm the AI with too much context

4. **Update profile mapping when adding new options**
   - Add new persona types → update personaLabels
   - Add new hobbies → update hobbyLabels
   - Keep labels user-friendly and clear

5. **Monitor and log**
   ```typescript
   console.log('Has user profile context:', !!userProfileContext);
   console.log('User profile context:', userProfileContext);
   ```

---

## ✨ Future Enhancements

### Phase 2 (Planned)
1. **Profile Editing in App**
   - Let users update persona/goals in Settings
   - Automatically refreshes AI context

2. **Long-term Conversation Memory**
   - Vector-based semantic search of chat history
   - Remember important facts across sessions
   - "You mentioned last week that..."

3. **Advanced Preference Learning**
   - Learn user's preferred response tone
   - Detect and adapt to language proficiency
   - Personalize content depth and complexity

4. **Context Expansion**
   - Include user's location (city/province)
   - Track progress in Learn modules
   - Reference community participation

---

## 📞 Support

**For Development Issues**:
- Check Supabase function logs
- Review database query performance
- Verify RLS policies

**For User Issues**:
- Guide users to complete onboarding
- Check profile data completeness
- Test with different persona types

**For AI Response Quality**:
- Review system instructions
- Adjust context format if needed
- Monitor user feedback and ratings
