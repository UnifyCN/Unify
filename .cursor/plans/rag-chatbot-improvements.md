# RAG Chatbot Improvements Plan

## 0. Git Branch Setup

Create a new git branch for these changes before starting implementation.

## 1. Enhanced System Instructions with Immigration Guardrails

Update the system prompt in [`rag-query/index.ts`](../../unify-front-end/supabase/functions/rag-query/index.ts) (code stored here, user will deploy to Supabase):

**Legal Disclaimer Guardrails:**
- Explicit instruction to NEVER provide legal advice or make eligibility determinations
- Refuse to answer "Am I eligible?", "Will I get approved?", "Which visa should I apply for?" with personal recommendations
- Always frame responses as educational/informational, not actionable legal guidance

**Official Source Redirects:**
- Instruct the model to recommend IRCC.gc.ca for official information
- Include disclaimer when discussing rules that may change
- Suggest consulting immigration lawyers/consultants for personal situations

**Tone and Clarity:**
- Newcomer-friendly language (avoid jargon, explain acronyms)
- Empathetic and supportive tone
- Clear, structured responses

**Formatting Instructions:**
- Use Markdown formatting (headers, bold, bullet points)
- For immigration/newcomer answers, structure responses using these sections in order:
  - `## Short Answer` - Direct answer to the question
  - `## Explanation` - More detail and context
  - `## What You Can Do Next` - Actionable steps
  - `## Important Notes` - Caveats, disclaimers, things to watch out for

**Standardized Disclaimer:**
```
"This is general information, not legal advice. For decisions about your specific situation, please check the official IRCC website or talk to a licensed immigration professional."
```

**Note:** Leave `GEMINI_PREPROMPT` unchanged - do not modify its usage.

## 2. Query Routing System

**Pipeline Order:**
```
User Query → Classifier → [immigration/newcomer] → Embeddings → RAG → Response
                       → [general] → Direct Gemini → Response
```

**Step 1: Constrained Classifier (runs BEFORE embeddings/RAG)**
Create a minimal Gemini Flash call with system message:
```
"You are a classifier. Given a user question, respond with exactly one label: immigration, newcomer_settlement, or general. Do not explain, do not add text."
```
This avoids unnecessary vector searches for obviously general queries.

**Step 2: Route Based on Classification**
- `immigration` or `newcomer_settlement` → RAG pipeline with knowledge base
- `general` → Non-RAG Gemini with global guardrails only

**Step 3: Fallback Behavior**
- If classifier fails → default to **general path** (safer than assuming immigration-related)
- General path still includes global safety rules (no legal/medical/financial advice)

**Step 4: Immigration Queries Without Good KB Hits**
"Without good KB hits" = no chunks returned OR all chunks have similarity below threshold (from `match_chunks`)
- Still answer using general knowledge + guardrails
- Set `sources` to `undefined`
- Include disclaimer: "This may not be covered in Unify's internal resources; please double-check with IRCC or a licensed immigration professional."

## 3. Updated Response Structure

```typescript
{
  answer: string;
  sources?: Source[];
  queryType: 'immigration' | 'newcomer_settlement' | 'general';
  disclaimer?: string;
}
```

## 4. Frontend Updates

- Update [`MessageWithSources.tsx`](../../unify-front-end/components/companion/MessageWithSources.tsx) to render Markdown
- Display disclaimer when present in response

## Files to Modify

| File | Changes |
|------|---------|
| `unify-front-end/supabase/functions/rag-query/index.ts` | Main refactor - classifier, routing, guardrails, formatting |
| `unify-front-end/components/companion/MessageWithSources.tsx` | Markdown rendering + disclaimer display |
| `unify-front-end/helpers/companion/messageHelpers.ts` | Update response parsing for new fields |
| `unify-front-end/types/chatbot.ts` | Add new types for routing metadata |

## Implementation Todos

- [ ] Create new git branch for chatbot improvements
- [ ] Create enhanced system instructions with immigration guardrails
- [ ] Add structured section format (Short Answer, Explanation, Next Steps, Notes)
- [ ] Add standardized disclaimer constant and logic
- [ ] Implement constrained 3-label classifier BEFORE embeddings
- [ ] Add routing logic with fallback to general path on failure
- [ ] Handle immigration queries without KB hits (no chunks or low similarity)
- [ ] Add Markdown formatting instructions and response structure
- [ ] Update MessageWithSources to render Markdown and disclaimers
- [ ] Update types and helper functions for new response format

