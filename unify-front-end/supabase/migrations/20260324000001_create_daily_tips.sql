-- ============================================================================
-- Daily tips table
-- Stores AI-generated daily tips for each persona×stage cohort (4×5 = 20/day)
-- ============================================================================

CREATE TABLE daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona TEXT NOT NULL,
  stage TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  tip_text TEXT NOT NULL,
  source_refs JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(persona, stage, date)
);

-- RLS: authenticated users can read all tips (public content)
ALTER TABLE daily_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read tips"
  ON daily_tips FOR SELECT TO authenticated USING (true);

-- Index for client queries (persona + stage + date DESC for fallback lookup)
CREATE INDEX idx_daily_tips_lookup ON daily_tips(persona, stage, date DESC);
