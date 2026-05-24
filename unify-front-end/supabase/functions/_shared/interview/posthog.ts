// supabase/functions/_shared/interview/posthog.ts
export interface ActiveUser {
  personId: string;
  email: string;
  name: string | null;
  surfaces14d: number;
  events14d: number;
  companionMsgs14d: number;
}

export interface FetchActiveUsersOpts {
  posthogHost: string;   // e.g. https://us.i.posthog.com
  projectId: string;     // PostHog project id, e.g. "250953"
  apiKey: string;        // Personal API key with project read scope
  fetchImpl?: typeof fetch;
}

const HOGQL = `
WITH surface_events AS (
  SELECT
    person_id,
    person.properties.email AS email,
    person.properties.name  AS name,
    multiIf(
      event IN ('post_created','post_liked','comment_created','post_saved','comment_liked','post_unliked','post_unsaved'),
        'feed',
      event IN ('companion_message_sent','companion_starter_prompt_used','companion_suggestion_clicked','companion_history_viewed'),
        'companion',
      event IN ('lesson_page_viewed','quiz_completed','lesson_ask_ai_used','lesson_highlight_created','lesson_highlight_removed','module_viewed','module_card_clicked'),
        'learn',
      event IN ('group_joined','group_viewed','group_left'),
        'groups',
      event IN ('checklist_task_completed','checklist_task_uncompleted'),
        'checklist',
      NULL
    ) AS surface,
    event,
    timestamp
  FROM events
  WHERE timestamp >= now() - INTERVAL 14 DAY
    AND event IN (
      'post_created','post_liked','comment_created','post_saved','comment_liked','post_unliked','post_unsaved',
      'companion_message_sent','companion_starter_prompt_used','companion_suggestion_clicked','companion_history_viewed',
      'lesson_page_viewed','quiz_completed','lesson_ask_ai_used','lesson_highlight_created','lesson_highlight_removed','module_viewed','module_card_clicked',
      'group_joined','group_viewed','group_left',
      'checklist_task_completed','checklist_task_uncompleted'
    )
)
SELECT
  person_id,
  email,
  name,
  count(DISTINCT surface) AS surfaces_14d,
  count() AS events_14d,
  countIf(event = 'companion_message_sent') AS companion_msgs_14d
FROM surface_events
WHERE surface IS NOT NULL
GROUP BY person_id, email, name
HAVING surfaces_14d >= 2
LIMIT 500
`.trim();

export async function fetchActiveUsers14d(
  opts: FetchActiveUsersOpts,
): Promise<ActiveUser[]> {
  const f = opts.fetchImpl ?? fetch;
  const res = await f(`${opts.posthogHost}/api/projects/${opts.projectId}/query/`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${opts.apiKey}`,
    },
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query: HOGQL } }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`PostHog query failed: ${res.status} ${text}`);
  }
  const data = await res.json() as { results: unknown[][] };
  const out: ActiveUser[] = [];
  for (const row of data.results ?? []) {
    const [personId, email, name, surfaces14d, events14d, companionMsgs14d] = row;
    if (typeof email !== 'string' || !email) continue;
    out.push({
      personId: String(personId),
      email,
      name: typeof name === 'string' ? name : null,
      surfaces14d: Number(surfaces14d),
      events14d: Number(events14d),
      companionMsgs14d: Number(companionMsgs14d),
    });
  }
  return out;
}
