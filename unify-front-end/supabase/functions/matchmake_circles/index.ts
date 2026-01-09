import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Constants (matching pools.ts)
const COMMUNITY_CIRCLE_SIZE = 4;
const COMMUNITY_CIRCLE_DURATION_DAYS = 14;

type SupabaseClient = ReturnType<typeof createClient>;

type WaitlistRow = {
  user_id: string;
  pool_key: string;
  persona: string;
  time_in_canada: string;
  created_at: string;
};

type MatchHistoryRow = {
  user_a: string;
  user_b: string;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const HOUR_IN_MS = 60 * 60 * 1000;
const WELCOME_MESSAGE =
  'You have a new Unify Circle! Take a moment to introduce yourself and share what you hope to learn over the next 14 days.';
const CLOSING_MESSAGE =
  'This circle has wrapped up. Say thanks, follow one another, and keep the support going in DMs or future circles.';
const DAY_13_REMINDER_MESSAGE =
  'One day left! Make the most of your final moments together. Consider exchanging contact info or following each other.';

const responseHeaders = {
  'Content-Type': 'application/json',
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: responseHeaders }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase environment configuration');
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const summary = {
      waitingPoolsEvaluated: 0,
      circlesCreated: [] as Array<{
        poolKey: string;
        circleId: string;
        memberIds: string[];
      }>,
      failures: [] as Array<{ poolKey: string; reason: string }>,
      expiredCirclesClosed: 0,
      day13RemindersSent: 0,
      circlesDeleted: 0,
    };

    // Lifecycle operations: close expired → send day 13 reminders → delete old circles
    const closedResult = await closeExpiredCircles(supabase);
    summary.expiredCirclesClosed = closedResult;

    const reminderResult = await sendDay13Reminders(supabase);
    summary.day13RemindersSent = reminderResult;

    const deletedResult = await deleteEndedCircles(supabase);
    summary.circlesDeleted = deletedResult;

    const waitlistEntries = await fetchWaitlist(supabase);
    if (waitlistEntries.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, summary }),
        { status: 200, headers: responseHeaders }
      );
    }

    const groupedByPool = groupByPool(waitlistEntries);
    const activeUsers = await getActiveUserIds(supabase);

    for (const [poolKey, poolEntries] of groupedByPool.entries()) {
      summary.waitingPoolsEvaluated += 1;

      const availableEntries = poolEntries.filter(
        entry => !activeUsers.has(entry.user_id)
      );
      if (availableEntries.length < COMMUNITY_CIRCLE_SIZE) {
        continue;
      }

      const candidateGroups = await buildGroupsForPool(
        supabase,
        availableEntries
      );

      if (!candidateGroups.length) {
        continue;
      }

      for (const group of candidateGroups) {
        try {
          const refEntry = availableEntries[0];
          const circleId = await createCircleForGroup(
            supabase,
            poolKey,
            refEntry.persona,
            refEntry.time_in_canada,
            group
          );

          summary.circlesCreated.push({
            poolKey,
            circleId,
            memberIds: group,
          });
        } catch (error) {
          const reason =
            error instanceof Error ? error.message : 'Unknown error';
          summary.failures.push({ poolKey, reason });
          console.error(
            'matchmake_circles.createCircle.error',
            poolKey,
            reason
          );
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('matchmake_circles.error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
      headers: responseHeaders,
    });
  }
});

async function fetchWaitlist(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('community_match_waitlist')
    .select('user_id,pool_key,persona,time_in_canada,created_at')
    .eq('status', 'waiting')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch waitlist: ${error.message}`);
  }

  return data as WaitlistRow[];
}

function groupByPool(waitlist: WaitlistRow[]) {
  const map = new Map<string, WaitlistRow[]>();
  for (const entry of waitlist) {
    if (!map.has(entry.pool_key)) {
      map.set(entry.pool_key, []);
    }
    map.get(entry.pool_key)!.push(entry);
  }
  return map;
}

async function getActiveUserIds(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from('community_circle_members')
    .select('user_id, left_at, community_circles!inner(status)')
    .eq('community_circles.status', 'active')
    .is('left_at', null);

  if (error) {
    console.error('Failed to fetch active circle members', error);
    return new Set<string>();
  }

  const ids = new Set<string>();
  for (const row of data || []) {
    if (row.user_id) {
      ids.add(row.user_id);
    }
  }
  return ids;
}

async function buildGroupsForPool(
  supabase: SupabaseClient,
  entries: WaitlistRow[]
) {
  const userIds = entries.map(entry => entry.user_id);
  const historyPairs = await fetchMatchHistoryForUsers(supabase, userIds);
  const formedGroups: string[][] = [];
  const used = new Set<string>();

  for (let i = 0; i < entries.length; i++) {
    const anchor = entries[i];
    if (used.has(anchor.user_id)) {
      continue;
    }

    const group = [anchor.user_id];
    for (let j = i + 1; j < entries.length && group.length < COMMUNITY_CIRCLE_SIZE; j++) {
      const candidate = entries[j];
      if (used.has(candidate.user_id)) {
        continue;
      }

      const conflicts = group.some(memberId =>
        historyPairs.has(buildPairKey(memberId, candidate.user_id))
      );

      if (!conflicts) {
        group.push(candidate.user_id);
      }
    }

    if (group.length === COMMUNITY_CIRCLE_SIZE) {
      group.forEach(id => used.add(id));
      formedGroups.push(group);
    }
  }

  return formedGroups;
}

async function fetchMatchHistoryForUsers(
  supabase: SupabaseClient,
  userIds: string[]
) {
  const pairs = new Set<string>();
  if (!userIds.length) {
    return pairs;
  }

  const userSet = new Set(userIds);

  const [userAResponse, userBResponse] = await Promise.all([
    supabase
      .from('community_match_history')
      .select('user_a,user_b')
      .in('user_a', userIds),
    supabase
      .from('community_match_history')
      .select('user_a,user_b')
      .in('user_b', userIds),
  ]);

  if (userAResponse.error) {
    console.error('Failed to fetch match history (user_a)', userAResponse.error);
  }
  if (userBResponse.error) {
    console.error('Failed to fetch match history (user_b)', userBResponse.error);
  }

  const rows: MatchHistoryRow[] = [
    ...(userAResponse.data || []),
    ...(userBResponse.data || []),
  ] as MatchHistoryRow[];

  for (const row of rows) {
    if (userSet.has(row.user_a) && userSet.has(row.user_b)) {
      pairs.add(buildPairKey(row.user_a, row.user_b));
    }
  }

  return pairs;
}

function buildPairKey(userA: string, userB: string) {
  const [first, second] =
    userA < userB ? [userA, userB] : [userB, userA];
  return `${first}:${second}`;
}

async function createCircleForGroup(
  supabase: SupabaseClient,
  poolKey: string,
  persona: string,
  timeInCanada: string,
  memberIds: string[]
) {
  const endsAt = new Date(Date.now() + COMMUNITY_CIRCLE_DURATION_DAYS * DAY_IN_MS).toISOString();

  const { data: circle, error: circleError } = await supabase
    .from('community_circles')
    .insert({
      pool_key: poolKey,
      persona,
      time_in_canada: timeInCanada,
      status: 'active',
      ends_at: endsAt,
    })
    .select('id')
    .single();

  if (circleError || !circle) {
    throw new Error(circleError?.message || 'Failed to create circle');
  }

  const circleId = circle.id as string;

  const { error: membersError } = await supabase
    .from('community_circle_members')
    .insert(
      memberIds.map(userId => ({
        circle_id: circleId,
        user_id: userId,
        joined_at: null,
        left_at: null,
      }))
    );

  if (membersError) {
    throw new Error(`Failed to insert circle members: ${membersError.message}`);
  }

  await insertMatchHistory(supabase, memberIds);
  const { error: waitlistError } = await supabase
    .from('community_match_waitlist')
    .update({ status: 'matched' })
    .in('user_id', memberIds);
  if (waitlistError) {
    console.error('Failed to update waitlist statuses', waitlistError);
  }

  const { error: notificationError } = await supabase.from('community_notifications').insert(
    memberIds.map(userId => ({
      user_id: userId,
      type: 'circle_matched',
      title: "You've been matched!",
      body: 'Your Unify Circle is ready. Tap to meet your group.',
      data: { circle_id: circleId },
    }))
  );
  if (notificationError) {
    console.error('Failed to record in-app notifications', notificationError);
  }

  const { error: messageError } = await supabase.from('community_messages').insert({
    circle_id: circleId,
    sender_user_id: null,
    content: WELCOME_MESSAGE,
  });
  if (messageError) {
    console.error('Failed to insert welcome message', messageError);
  }

  return circleId;
}

async function insertMatchHistory(
  supabase: SupabaseClient,
  memberIds: string[]
) {
  const rows: MatchHistoryRow[] = [];
  for (let i = 0; i < memberIds.length; i++) {
    for (let j = i + 1; j < memberIds.length; j++) {
      const [userA, userB] =
        memberIds[i] < memberIds[j]
          ? [memberIds[i], memberIds[j]]
          : [memberIds[j], memberIds[i]];
      rows.push({ user_a: userA, user_b: userB });
    }
  }

  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase
    .from('community_match_history')
    .upsert(rows, { ignoreDuplicates: true, onConflict: 'user_a,user_b' });
  if (error) {
    console.error('Failed to upsert match history pairs', error);
  }
}

async function closeExpiredCircles(supabase: SupabaseClient) {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('community_circles')
    .select('id, persona, time_in_canada, status')
    .eq('status', 'active')
    .lte('ends_at', nowIso);

  if (error) {
    console.error('Failed to fetch expiring circles', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const circleIds = data.map((circle: { id: string }) => circle.id as string);

  const { error: updateError } = await supabase
    .from('community_circles')
    .update({ status: 'ended' })
    .in('id', circleIds);

  if (updateError) {
    console.error('Failed to mark circles as ended', updateError);
  }

  await supabase
    .from('community_messages')
    .insert(
      circleIds.map((circleId: string) => ({
        circle_id: circleId,
        sender_user_id: null,
        content: CLOSING_MESSAGE,
      }))
    );

  const { data: members, error: membersError } = await supabase
    .from('community_circle_members')
    .select('circle_id,user_id,left_at')
    .in('circle_id', circleIds);

  if (membersError) {
    console.error('Failed to fetch circle members for closeout', membersError);
    return circleIds.length;
  }

  const activeMembers =
    members?.filter((member: { left_at: string | null }) => member.left_at === null) ?? [];
  if (activeMembers.length > 0) {
    await supabase.from('community_notifications').insert(
      activeMembers.map((member: { user_id: string; circle_id: string }) => ({
        user_id: member.user_id,
        type: 'circle_ended',
        title: 'Your circle has wrapped up',
        body: 'Send a thank-you note and follow your circle members.',
        data: { circle_id: member.circle_id },
      }))
    );

  }

  return circleIds.length;
}

/**
 * Send Day 13 reminders to users whose circles end within 24 hours.
 * Only sends reminder once per circle (tracked by day_13_reminder_sent column).
 */
async function sendDay13Reminders(supabase: SupabaseClient) {
  const now = new Date();
  const in24Hours = new Date(now.getTime() + DAY_IN_MS);
  
  // Find active circles that end within 24 hours and haven't received reminder yet
  const { data, error } = await supabase
    .from('community_circles')
    .select('id')
    .eq('status', 'active')
    .eq('day_13_reminder_sent', false)
    .lte('ends_at', in24Hours.toISOString())
    .gt('ends_at', now.toISOString());

  if (error) {
    console.error('Failed to fetch circles needing Day 13 reminder', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const circleIds = data.map((circle: { id: string }) => circle.id as string);

  // Mark circles as having sent reminder (do this first to prevent duplicates)
  const { error: updateError } = await supabase
    .from('community_circles')
    .update({ day_13_reminder_sent: true })
    .in('id', circleIds);

  if (updateError) {
    console.error('Failed to mark circles as reminder sent', updateError);
    return 0;
  }

  // Get active members of these circles
  const { data: members, error: membersError } = await supabase
    .from('community_circle_members')
    .select('circle_id, user_id, left_at')
    .in('circle_id', circleIds);

  if (membersError) {
    console.error('Failed to fetch members for Day 13 reminder', membersError);
    return circleIds.length;
  }

  const activeMembers =
    members?.filter((member: { left_at: string | null }) => member.left_at === null) ?? [];

  if (activeMembers.length > 0) {
    // Insert in-app notifications
    const { error: notificationError } = await supabase
      .from('community_notifications')
      .insert(
        activeMembers.map((member: { user_id: string; circle_id: string }) => ({
          user_id: member.user_id,
          type: 'circle_ending_soon',
          title: 'One day left in your circle!',
          body: 'Make the most of your final moments. Consider exchanging contact info or following each other.',
          data: { circle_id: member.circle_id },
        }))
      );

    if (notificationError) {
      console.error('Failed to insert Day 13 reminder notifications', notificationError);
    }
  }

  return circleIds.length;
}

/**
 * Delete circles that have been ended for at least 1 hour (grace period).
 * Removes messages, members, notifications, and the circle itself.
 */
async function deleteEndedCircles(supabase: SupabaseClient) {
  const gracePeriodAgo = new Date(Date.now() - HOUR_IN_MS);
  
  // Find ended circles where ends_at is before the grace period
  const { data, error } = await supabase
    .from('community_circles')
    .select('id')
    .eq('status', 'ended')
    .lt('ends_at', gracePeriodAgo.toISOString());

  if (error) {
    console.error('Failed to fetch circles for deletion', error);
    return 0;
  }

  if (!data || data.length === 0) {
    return 0;
  }

  const circleIds = data.map((circle: { id: string }) => circle.id as string);

  // Delete in order due to foreign key constraints:
  // 1. Delete messages
  const { error: messagesError } = await supabase
    .from('community_messages')
    .delete()
    .in('circle_id', circleIds);

  if (messagesError) {
    console.error('Failed to delete circle messages', messagesError);
  }

  // 2. Delete members
  const { error: membersError } = await supabase
    .from('community_circle_members')
    .delete()
    .in('circle_id', circleIds);

  if (membersError) {
    console.error('Failed to delete circle members', membersError);
  }

  // 3. Delete notifications referencing these circles
  // Note: This uses a JSONB query to find notifications with matching circle_id
  for (const circleId of circleIds) {
    const { error: notifError } = await supabase
      .from('community_notifications')
      .delete()
      .eq('data->>circle_id', circleId);
    
    if (notifError) {
      console.error('Failed to delete notifications for circle', circleId, notifError);
    }
  }

  // 4. Delete the circles themselves
  const { error: circlesError } = await supabase
    .from('community_circles')
    .delete()
    .in('id', circleIds);

  if (circlesError) {
    console.error('Failed to delete circles', circlesError);
    return 0;
  }

  return circleIds.length;
}
