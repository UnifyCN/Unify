// @ts-nocheck We do not need the actual Deno import since it's used by supabase serverless functions so ignore
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { captureAiGeneration, computeGeminiCost } from "../_shared/posthogCapture.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

const SYSTEM_PROMPT = `You are a friendly, patient guide helping newcomers to Canada understand unfamiliar terms they encounter while learning about immigration, finances, taxes, housing, healthcare, and life in Canada.

When given a term or phrase, provide:
1. A clear, simple explanation in 2-3 sentences maximum
2. Use plain everyday language — avoid jargon
3. If relevant, briefly mention how this applies specifically in the Canadian context
4. If the term is an acronym, spell it out first

Your audience has recently arrived in Canada and may not be familiar with Canadian-specific terminology, government programs, financial systems, or legal language. Be warm and encouraging.

Respond ONLY with the explanation text — no formatting, no headers, no bullet points.`;

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return jsonResponse({ error: "Missing Supabase env vars" }, 500);
  }

  if (!GEMINI_API_KEY) {
    return jsonResponse({ error: "Missing GEMINI_API_KEY" }, 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Validate auth
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const { data: authData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError || !authData?.user) {
      return jsonResponse({ error: "Invalid user" }, 401);
    }

    // Parse request body
    const body = await req.json();
    const { term } = body;
    let { lessonContext } = body;

    if (!term || typeof term !== "string" || term.trim().length === 0) {
      return jsonResponse({ error: "Missing or empty term" }, 400);
    }

    if (term.length > 500) {
      return jsonResponse({ error: "Term too long (max 500 chars)" }, 400);
    }

    // Validate and bound lessonContext
    if (lessonContext != null) {
      if (typeof lessonContext !== "string") {
        lessonContext = undefined;
      } else {
        lessonContext = lessonContext.trim().replace(/\s+/g, " ");
        if (lessonContext.length === 0) {
          lessonContext = undefined;
        } else if (lessonContext.length > 500) {
          lessonContext = lessonContext.slice(0, 500);
        }
      }
    }

    // Build the prompt
    const userPrompt = lessonContext
      ? `The user is reading a lesson about "${lessonContext}" and wants to understand this term or phrase: "${term.trim()}"`
      : `Explain this term or phrase to a newcomer to Canada: "${term.trim()}"`;

    // Call Gemini API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Gemini API error: ${response.status}`);
      return jsonResponse({ error: "AI service unavailable" }, 502);
    }

    const data = await response.json();
    const explanation =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    if (!explanation) {
      return jsonResponse({ error: "No explanation generated" }, 502);
    }

    // Send $ai_generation event to PostHog LLM analytics
    const usageMetadata = data.usageMetadata;
    if (usageMetadata) {
      const inputTokens = usageMetadata.promptTokenCount || 0;
      const outputTokens = usageMetadata.candidatesTokenCount || 0;
      const cost = computeGeminiCost(inputTokens, outputTokens, GEMINI_MODEL);

      captureAiGeneration(authData.user.id, {
        $ai_model: GEMINI_MODEL,
        $ai_provider: "google",
        $ai_input_tokens: inputTokens,
        $ai_output_tokens: outputTokens,
        $ai_total_tokens: usageMetadata.totalTokenCount || 0,
        $ai_input_cost_usd: cost.inputCost,
        $ai_output_cost_usd: cost.outputCost,
        $ai_total_cost_usd: cost.totalCost,
        // Custom properties for filtering
        feature: "ask_ai_learn",
        term_length: term.length,
      });
    }

    return jsonResponse({ explanation });
  } catch (error) {
    if (error.name === "AbortError") {
      return jsonResponse({ error: "Request timed out" }, 504);
    }
    console.error("explain-term error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
