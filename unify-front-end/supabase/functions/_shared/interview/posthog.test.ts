// supabase/functions/_shared/interview/posthog.test.ts
import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { fetchActiveUsers14d, type ActiveUser } from './posthog.ts';

Deno.test('fetchActiveUsers14d posts HogQL to the configured endpoint', async () => {
  let captured: { url?: string; init?: RequestInit } = {};
  const stubFetch: typeof fetch = async (url, init) => {
    captured = { url: String(url), init };
    return new Response(JSON.stringify({
      results: [
        ['p1', 'a@example.com', 'Alice', 3, 12, 6],
        ['p2', 'b@example.com', 'Bob',   2, 4,  0],
      ],
    }), { status: 200 });
  };

  const users = await fetchActiveUsers14d({
    posthogHost: 'https://us.i.posthog.com',
    projectId: '250953',
    apiKey: 'phx_test',
    fetchImpl: stubFetch,
  });

  assertEquals(captured.url, 'https://us.i.posthog.com/api/projects/250953/query/');
  assertEquals(captured.init?.method, 'POST');
  const body = JSON.parse(String(captured.init?.body));
  assertEquals(body.query.kind, 'HogQLQuery');
  assertEquals(typeof body.query.query, 'string');
  assertEquals(body.query.query.includes('INTERVAL 14 DAY'), true);

  assertEquals(users.length, 2);
  const alice: ActiveUser = users[0];
  assertEquals(alice.personId, 'p1');
  assertEquals(alice.email, 'a@example.com');
  assertEquals(alice.name, 'Alice');
  assertEquals(alice.surfaces14d, 3);
  assertEquals(alice.events14d, 12);
  assertEquals(alice.companionMsgs14d, 6);
});

Deno.test('fetchActiveUsers14d throws on non-2xx response', async () => {
  const stubFetch: typeof fetch = async () =>
    new Response('{"detail":"unauthorized"}', { status: 401 });

  let threw = false;
  try {
    await fetchActiveUsers14d({
      posthogHost: 'https://us.i.posthog.com',
      projectId: '250953',
      apiKey: 'bad',
      fetchImpl: stubFetch,
    });
  } catch (e) {
    threw = true;
    assertEquals(String(e).includes('401'), true);
  }
  assertEquals(threw, true);
});

Deno.test('fetchActiveUsers14d skips rows with null email', async () => {
  const stubFetch: typeof fetch = async () =>
    new Response(JSON.stringify({
      results: [
        ['p1', 'a@example.com', 'Alice', 3, 12, 6],
        ['p2', null,            null,    2, 4,  0],
      ],
    }), { status: 200 });

  const users = await fetchActiveUsers14d({
    posthogHost: 'https://us.i.posthog.com',
    projectId: '250953',
    apiKey: 'phx_test',
    fetchImpl: stubFetch,
  });

  assertEquals(users.length, 1);
  assertEquals(users[0].email, 'a@example.com');
});
