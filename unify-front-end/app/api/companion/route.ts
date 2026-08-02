export const runtime = 'nodejs';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const authHeader = req.headers.get('authorization');
  const cookieHeader = req.headers.get('cookie') ?? '';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Missing Supabase config' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upstream = await fetch(`${supabaseUrl}/functions/v1/rag-query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({
      ...body,
      source: 'web',
    }),
  });

  const contentType = upstream.headers.get('content-type') || 'application/json';
  const text = await upstream.text();

  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': contentType,
    },
  });
}
