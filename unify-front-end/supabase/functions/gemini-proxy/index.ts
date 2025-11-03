// NOTE: THIS IS NOT USED ANYMORE WE USE THE RAG-QUERY FUNCTION INSTEAD
// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

Deno.serve(async (req: Request) => {
  try {
    const { prompt } = await req.json();
    const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash';
    const preprompt = Deno.env.get('GEMINI_PREPROMPT') || '';
    const apiKey = Deno.env.get('GEMINI_API_KEY');

    // Combine preprompt with user prompt if preprompt exists
    const fullPrompt = preprompt ? `${preprompt}\n\nUser: ${prompt}` : prompt;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            maxOutputTokens: 150,
          },
        }),
      }
    );

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(
      JSON.stringify({ error: 'An unknown error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
