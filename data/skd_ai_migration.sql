-- =========================================================================
-- SKD AI RATINGS TABLE — Stores Gemini-generated intelligence ratings
-- Run this migration on your Supabase SQL editor
-- =========================================================================

-- 1. Create the AI ratings table
CREATE TABLE IF NOT EXISTS skd_ai_ratings (
    id BIGSERIAL PRIMARY KEY,
    position_id INT REFERENCES positions(id) ON DELETE CASCADE,
    official_id UUID REFERENCES officials(id) ON DELETE CASCADE,
    
    -- AI-generated sub-scores (same 3-axis as citizen ratings)
    score_integrity NUMERIC(4,2) CHECK (score_integrity >= 0.00 AND score_integrity <= 10.00),
    score_efficiency NUMERIC(4,2) CHECK (score_efficiency >= 0.00 AND score_efficiency <= 10.00),
    score_accessibility NUMERIC(4,2) CHECK (score_accessibility >= 0.00 AND score_accessibility <= 10.00),
    skd_overall_score NUMERIC(4,2) CHECK (skd_overall_score >= 0.00 AND skd_overall_score <= 10.00),
    
    -- AI analysis output
    analysis_summary TEXT,
    search_sources TEXT[],
    search_query TEXT,
    
    -- Execution metadata
    model_used VARCHAR(50) DEFAULT 'gemini-2.5-flash',
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending','running','completed','failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(position_id)
);

CREATE INDEX IF NOT EXISTS idx_skd_ratings_position ON skd_ai_ratings (position_id);
CREATE INDEX IF NOT EXISTS idx_skd_ratings_status ON skd_ai_ratings (status);

-- 2. Enable RLS and allow public reads
ALTER TABLE skd_ai_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select on skd_ai_ratings" ON skd_ai_ratings FOR SELECT USING (true);
CREATE POLICY "Admin master controls on skd_ai_ratings" ON skd_ai_ratings FOR ALL TO authenticated USING (is_admin());

-- 3. Allow the service role (API route) to upsert via anon key bypass
-- Since our API route uses the anon key, we need an INSERT/UPDATE policy for it
CREATE POLICY "Allow service insert on skd_ai_ratings" ON skd_ai_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update on skd_ai_ratings" ON skd_ai_ratings FOR UPDATE USING (true);

-- 4. Update the live scores view to include SKD ratings
DROP VIEW IF EXISTS view_positions_live_scores;

CREATE OR REPLACE VIEW view_positions_live_scores AS
SELECT 
    p.id AS position_id,
    p.title AS position_title,
    o.id AS current_official_id,
    o.first_name || ' ' || o.last_name AS current_official_name,
    o.service_cadre AS service_cadre,
    d.name AS department_name,
    gr.tier AS tier,
    gr.state_name,
    gr.district_name,
    p.is_frozen,
    p.is_overridden,
    p.override_score,
    CASE 
        WHEN p.is_overridden = TRUE THEN p.override_score
        WHEN COUNT(r.id) = 0 THEN NULL
        ELSE ROUND(AVG(r.overall_score), 2)
    END AS display_rating,
    COUNT(r.id) AS total_ratings_count,
    -- SKD AI Rating fields
    skd.skd_overall_score AS skd_rating,
    skd.score_integrity AS skd_integrity,
    skd.score_efficiency AS skd_efficiency,
    skd.score_accessibility AS skd_accessibility,
    skd.analysis_summary AS skd_summary,
    skd.search_sources AS skd_sources,
    skd.status AS skd_status,
    skd.updated_at AS skd_updated_at
FROM positions p
LEFT JOIN officials o ON p.current_official_id = o.id
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN geographic_regions gr ON p.region_id = gr.id
LEFT JOIN ratings r ON p.id = r.position_id AND r.is_approved_by_moderator = TRUE
LEFT JOIN skd_ai_ratings skd ON p.id = skd.position_id
GROUP BY p.id, o.id, d.id, gr.id, skd.skd_overall_score, skd.score_integrity, 
         skd.score_efficiency, skd.score_accessibility, skd.analysis_summary, 
         skd.search_sources, skd.status, skd.updated_at;
