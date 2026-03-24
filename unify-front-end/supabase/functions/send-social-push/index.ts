import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const JSON_HEADERS = { 'Content-Type': 'application/json' };

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

type NotificationRow = {
  id: string;
  user_id: string;
  triggered_by_user_id: string | null;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
};

function isUuid(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      id
    )
  );
}

/** Same batching pattern as matchmake-circles `sendPushNotifications`. */
async function sendExpoPushToUsers(
  supabase: SupabaseClient,
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
  channelId?: string
): Promise<void> {
  if (!userIds.length) return;

  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('token')
    .in('user_id', userIds);

  if (error) {
    console.error('send-social-push: push_tokens', error);
    return;
  }
  if (!tokens?.length) return;

  const messages = tokens.map(({ token }: { token: string }) => ({
    to: token,
    sound: 'default' as const,
    title,
    body,
    data: data ?? {},
    priority: 'high' as const,
    ...(channelId ? { channelId } : {}),
  }));

  const batchSize = 100;
  const timeoutMs = 5000;
  const staleTokens: string[] = [];

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(batch),
        signal: controller.signal,
      });
      if (!res.ok) {
        console.error('send-social-push: expo batch', i, await res.text());
      } else {
        // Parse push tickets to detect stale tokens
        const result = await res.json();
        if (result.data) {
          for (let j = 0; j < result.data.length; j++) {
            const ticket = result.data[j];
            if (ticket.status === 'error') {
              console.error('send-social-push: ticket error', ticket.message, ticket.details);
              if (ticket.details?.error === 'DeviceNotRegistered') {
                staleTokens.push(batch[j].to);
              }
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        console.error('send-social-push: expo timeout', i);
      } else {
        console.error('send-social-push: expo error', i, e);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  // Clean up stale tokens that are no longer registered
  if (staleTokens.length > 0) {
    const { error: deleteError } = await supabase
      .from('push_tokens')
      .delete()
      .in('token', staleTokens);
    if (deleteError) {
      console.error('send-social-push: failed to delete stale tokens', deleteError);
    } else {
      console.log(`send-social-push: cleaned ${staleTokens.length} stale token(s)`);
    }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('send-social-push: missing Supabase env');
    return new Response(JSON.stringify({ error: 'Server misconfigured' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const jwt = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  if (!jwt) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const {
    data: { user },
    error: authError,
  } = await supabaseService.auth.getUser(jwt);

  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), {
      status: 401,
      headers: JSON_HEADERS,
    });
  }

  let body: { notification_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (!isUuid(body.notification_id)) {
    return new Response(JSON.stringify({ error: 'Invalid notification_id' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const { data: row, error: rowError } = await supabaseService
    .from('community_notifications')
    .select('id, user_id, triggered_by_user_id, type, title, body, data')
    .eq('id', body.notification_id)
    .maybeSingle();

  if (rowError) {
    console.error('send-social-push: load notification', rowError);
    return new Response(JSON.stringify({ error: 'Failed to load notification' }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const notification = row as NotificationRow | null;
  if (!notification) {
    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: JSON_HEADERS,
    });
  }

  if (!['liked', 'commented', 'followed'].includes(notification.type)) {
    return new Response(JSON.stringify({ error: 'Unsupported notification type' }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (notification.triggered_by_user_id !== user.id) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: JSON_HEADERS,
    });
  }

  // Check if the recipient has opted into push notifications
  const { data: profile } = await supabaseService
    .from('onboarding_profiles')
    .select('wants_reminders')
    .eq('user_id', notification.user_id)
    .maybeSingle();

  if (profile?.wants_reminders === false) {
    return new Response(JSON.stringify({ ok: true, skipped: 'user_opted_out' }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  }

  const dataPayload = notification.data ?? {};
  const postId = dataPayload.post_id;
  const pushData: Record<string, string | number> = {
    type: notification.type,
  };
  if (typeof postId === 'number') pushData.post_id = postId;
  else if (typeof postId === 'string' && postId !== '') {
    const n = Number(postId);
    pushData.post_id = Number.isFinite(n) ? n : postId;
  }

  const actorUserId = dataPayload.actor_user_id;
  if (notification.type === 'followed' && typeof actorUserId === 'string' && actorUserId !== '') {
    pushData.actor_user_id = actorUserId;
  }

  const commentId = dataPayload.comment_id;
  if (notification.type === 'commented') {
    if (typeof commentId === 'number') pushData.comment_id = commentId;
    else if (typeof commentId === 'string' && commentId !== '') {
      const n = Number(commentId);
      pushData.comment_id = Number.isFinite(n) ? n : commentId;
    }
  }

  const channelId = notification.type === 'learn_reminder' ? 'learn' : 'social';

  await sendExpoPushToUsers(
    supabaseService,
    [notification.user_id],
    notification.title,
    notification.body,
    pushData,
    channelId
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: JSON_HEADERS,
  });
});
