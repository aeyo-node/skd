-- Enable UUID and Trigram fuzzy search extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. GEOGRAPHIC ENTITIES
CREATE TABLE geographic_regions (
    id SERIAL PRIMARY KEY,
    tier VARCHAR(20) NOT NULL CHECK (tier IN ('Central', 'State', 'District', 'Municipality')),
    state_name VARCHAR(100),   -- NULL if Central
    district_name VARCHAR(100),-- NULL if Central/State level
    local_body_name VARCHAR(100), -- E.g., 'BBMP', 'Pune Municipal Corporation'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS / MINISTRIES
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    region_id INT REFERENCES geographic_regions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- E.g., 'Ministry of Finance', 'Department of Home Affairs'
    code VARCHAR(50),           -- E.g., 'DoPT', 'PWD'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. THE INDIVIDUALS (Officials / Ministers / Bureaucrats)
CREATE TABLE officials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    service_cadre VARCHAR(50) NOT NULL, -- E.g., 'IAS', 'IPS', 'IFS', 'Political/Elected'
    batch_year INT,            -- E.g., 2012
    biodata TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. THE POSITIONS (Designations tied to a Department and Location)
CREATE TABLE positions (
    id SERIAL PRIMARY KEY,
    department_id INT REFERENCES departments(id) ON DELETE CASCADE,
    region_id INT REFERENCES geographic_regions(id) ON DELETE CASCADE,
    title TEXT NOT NULL, -- E.g., 'District Collector', 'Cabinet Minister', 'SP'
    current_official_id UUID REFERENCES officials(id) ON DELETE SET NULL,
    
    -- Admin Override Controls
    is_overridden BOOLEAN DEFAULT FALSE,
    override_score NUMERIC(4,2) CHECK (override_score >= 0.00 AND override_score <= 10.00),
    is_frozen BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. USER RATINGS & REVIEWS
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    position_id INT REFERENCES positions(id) ON DELETE CASCADE,
    official_id UUID REFERENCES officials(id) ON DELETE CASCADE,
    user_hash VARCHAR(64) NOT NULL,
    
    score_integrity INT CHECK (score_integrity >= 0 AND score_integrity <= 10),
    score_efficiency INT CHECK (score_efficiency >= 0 AND score_efficiency <= 10),
    score_accessibility INT CHECK (score_accessibility >= 0 AND score_accessibility <= 10),
    overall_score NUMERIC(4,2) CHECK (overall_score >= 0.00 AND overall_score <= 10.00),
    
    review_text TEXT,
    is_approved_by_moderator BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. ADMIN AUDIT TRAIL LOGS
CREATE TABLE admin_audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id UUID NOT NULL,              -- References internal Admin/Moderator user account ID
    position_id INT REFERENCES positions(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,   -- 'SCORE_OVERRIDE', 'FREEZE_RATINGS', 'OFFICIAL_TRANSFER'
    old_value TEXT,
    new_value TEXT,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AUTOMATIC RATING COMPUTATION TRIGGER
CREATE OR REPLACE FUNCTION calculate_overall_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.overall_score := ROUND((NEW.score_integrity + NEW.score_efficiency + NEW.score_accessibility) / 3.0, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_overall_score
BEFORE INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION calculate_overall_score();

-- PERFORMANCE INDEXES
CREATE INDEX idx_officials_search ON officials USING gin ((first_name || ' ' || last_name) gin_trgm_ops);
CREATE INDEX idx_officials_cadre ON officials (service_cadre);
CREATE INDEX idx_regions_tier ON geographic_regions (tier, state_name, district_name);
CREATE INDEX idx_positions_override ON positions (is_overridden, override_score) WHERE is_overridden = TRUE;
CREATE INDEX idx_ratings_calc ON ratings (position_id, official_id, overall_score);

-- VIEW FOR LIVE RATINGS & OVERRIDES
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
    COUNT(r.id) AS total_ratings_count
FROM positions p
LEFT JOIN officials o ON p.current_official_id = o.id
LEFT JOIN departments d ON p.department_id = d.id
LEFT JOIN geographic_regions gr ON p.region_id = gr.id
LEFT JOIN ratings r ON p.id = r.position_id AND r.is_approved_by_moderator = TRUE
GROUP BY p.id, o.id, d.id, gr.id;


-- =========================================================================
-- SEED DATA (Indian Hierarchy & Realistic Mock Info)
-- =========================================================================

-- Insert regions
INSERT INTO geographic_regions (tier, state_name, district_name, local_body_name) VALUES
('Central', NULL, NULL, NULL),
('State', 'Kerala', NULL, NULL),
('District', 'Kerala', 'Wayanad', NULL),
('State', 'Maharashtra', NULL, NULL),
('District', 'Maharashtra', 'Pune', NULL),
('Municipality', 'Maharashtra', 'Pune', 'Pune Municipal Corporation');

-- Insert departments
INSERT INTO departments (region_id, name, code) VALUES
(1, 'Ministry of Railways', 'MoR'),
(2, 'Revenue Department Kerala', 'REV-KL'),
(2, 'Department of Home Affairs Kerala', 'HOME-KL'),
(3, 'Revenue Administration Wayanad', 'REV-WYD'),
(4, 'Department of Home Affairs Maharashtra', 'HOME-MH'),
(5, 'Police Department Pune', 'POL-PNE'),
(6, 'Pune Municipal Administration', 'PMC');

-- Insert officials
INSERT INTO officials (id, first_name, last_name, service_cadre, batch_year, biodata, is_active) VALUES
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Divya', 'S. Iyer', 'IAS', 2015, 'Dr. Divya S. Iyer is a seasoned civil servant who previously served as district collector and is known for efficient governance and crisis management.', true),
('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Rajesh', 'Kumar', 'IPS', 2010, 'A dedicated police officer specialized in cyber crime prevention and public safety coordination in urban areas.', true),
('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Amit', 'Sharma', 'IAS', 2012, 'Experienced administrative officer with a background in rural development and municipal administration.', true),
('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'K.', 'Sudhakaran', 'Political/Elected', NULL, 'Elected Member of Legislative Assembly and current PWD Minister of the state.', true),
('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', 'Vipin', 'Alok', 'IRS', 2008, 'Joint Commissioner of Income Tax overseeing major tax collections and policy implementations.', true);

-- Insert positions
INSERT INTO positions (department_id, region_id, title, current_official_id, is_overridden, override_score, is_frozen) VALUES
(4, 3, 'District Collector Wayanad', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', false, NULL, false),
(6, 5, 'Superintendent of Police Pune', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', false, NULL, false),
(7, 6, 'Municipal Commissioner Pune', 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', false, NULL, false),
(2, 2, 'PWD Minister Kerala', 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', false, NULL, false),
(1, 1, 'Chairman, Railway Board', 'e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b', false, NULL, false);

-- Insert mock ratings to generate scores
-- District Collector Wayanad (position_id = 1)
INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text) VALUES
(1, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hash_user_1', 9, 8, 9, 'Extremely accessible and proactive in solving local grievance reports. High integrity.'),
(1, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hash_user_2', 8, 9, 8, 'Very efficient during flood relief operations. Great leadership skills.'),
(1, 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'hash_user_3', 9, 9, 9, 'An excellent officer who listens to public issues directly via regular open days.');

-- Superintendent of Police Pune (position_id = 2)
INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text) VALUES
(2, 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'hash_user_4', 7, 7, 6, 'Response times are average, but efforts on cyber security are commendable.'),
(2, 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'hash_user_5', 8, 7, 7, 'Professional and direct. Accessibility could be improved.');

-- PWD Minister Kerala (position_id = 4)
INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text) VALUES
(4, 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'hash_user_6', 4, 3, 5, 'Slow road repairs in key state corridors. Corruption concerns remain unaddressed.'),
(4, 'd4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'hash_user_7', 5, 4, 4, 'Poor execution of major highway plans. High public disappointment.');

-- =========================================================================
-- STORED FUNCTIONS FOR ADMIN OPERATIONS
-- =========================================================================

-- Carries rating history with an official during transfer
CREATE OR REPLACE FUNCTION carry_ratings_history(
    transferred_official_id UUID,
    old_pos_id INT,
    new_pos_id INT
)
RETURNS VOID AS $$
BEGIN
    UPDATE ratings
    SET position_id = new_pos_id
    WHERE official_id = transferred_official_id AND position_id = old_pos_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Enable RLS on all base tables
ALTER TABLE geographic_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Helper function to check if requesting user has admin privileges
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Public SELECT access policies (anyone can view directory records)
CREATE POLICY "Allow public select on geographic_regions" ON geographic_regions FOR SELECT USING (true);
CREATE POLICY "Allow public select on departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public select on officials" ON officials FOR SELECT USING (true);
CREATE POLICY "Allow public select on positions" ON positions FOR SELECT USING (true);
CREATE POLICY "Allow public select on approved ratings" ON ratings FOR SELECT USING (is_approved_by_moderator = true);

-- 3. Public INSERT rating policy (only permitted if the target position is not frozen)
CREATE POLICY "Allow public insert on non-frozen ratings" ON ratings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM positions 
        WHERE positions.id = position_id AND positions.is_frozen = false
    )
);

-- 4. Admin full control policies (all operations on all tables permitted for admins)
CREATE POLICY "Admin master controls on geographic_regions" ON geographic_regions FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin master controls on departments" ON departments FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin master controls on officials" ON officials FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin master controls on positions" ON positions FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin master controls on ratings" ON ratings FOR ALL TO authenticated USING (is_admin());
CREATE POLICY "Admin master controls on admin_audit_logs" ON admin_audit_logs FOR ALL TO authenticated USING (is_admin());
