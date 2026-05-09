import type { ApiProvider, ProviderResponse } from 'promptfoo'

interface CallContext {
  vars?: Record<string, unknown>
}

interface RagResponse {
  answer?: string
  sources?: unknown[]
  queryType?: string
  disclaimer?: string
  suggestedNextSteps?: unknown[]
  lastVerified?: string
  tokenUsage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
  estimatedCostUsd?: number
}

const provider: ApiProvider = {
  id: () => 'companion-rag-query',

  async callApi(prompt: string, context?: CallContext): Promise<ProviderResponse> {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy evals/.env.example to evals/.env.local and fill in real values.',
      )
    }

    const evalProfile = (context?.vars?.profile as Record<string, unknown> | undefined) ?? null

    const startedAt = Date.now()

    const res = await fetch(`${supabaseUrl}/functions/v1/rag-query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
        'x-eval-mode': '1',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        conversationIdentifier: null,
        messages: [],
        eval_profile: evalProfile,
      }),
    })

    const latencyMs = Date.now() - startedAt

    if (!res.ok) {
      const errBody = await res.text().catch(() => '<unreadable>')
      throw new Error(`rag-query returned ${res.status}: ${errBody}`)
    }

    const data = (await res.json()) as RagResponse

    if (!data.answer || typeof data.answer !== 'string') {
      throw new Error(`rag-query response missing 'answer' field. Got: ${JSON.stringify(data).slice(0, 500)}`)
    }

    return {
      output: data.answer,
      tokenUsage: {
        prompt: data.tokenUsage?.prompt_tokens ?? 0,
        completion: data.tokenUsage?.completion_tokens ?? 0,
        total: data.tokenUsage?.total_tokens ?? 0,
      },
      cost: data.estimatedCostUsd ?? 0,
      raw: data,
      metadata: {
        sources: data.sources ?? [],
        queryType: data.queryType ?? null,
        suggestedNextSteps: data.suggestedNextSteps ?? [],
        lastVerified: data.lastVerified ?? null,
        latency_ms: latencyMs,
      },
    } as ProviderResponse
  },
}

export default provider
