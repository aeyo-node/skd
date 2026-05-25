import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def run_updates():
    print("Connecting to Supabase PostgreSQL database to run schema updates...")
    try:
        conn = psycopg2.connect(DB_CONN)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        return False

    try:
        # 1. Add image_url to officials
        print("Adding image_url column to officials table...")
        cur.execute("ALTER TABLE officials ADD COLUMN IF NOT EXISTS image_url TEXT;")
        print("image_url column added successfully.")

        # 2. Create the Storage Bucket in Supabase if not exists
        print("Provisioning 'official-photos' Storage Bucket...")
        cur.execute("""
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('official-photos', 'official-photos', true)
            ON CONFLICT (id) DO NOTHING;
        """)
        print("Storage bucket 'official-photos' provisioned successfully.")

        # 3. Create RLS policies for storage bucket if needed (usually handled by Supabase, but we can verify)
        print("Enabling public select policy for storage...")
        cur.execute("""
            INSERT INTO storage.policies (id, name, bucket_id, method, definition)
            VALUES (
                'public_select_official_photos',
                'Allow public select on official-photos',
                'official-photos',
                'GET',
                '{"role": "authenticated", "role": "anon"}'
            )
            ON CONFLICT DO NOTHING;
        """)
        print("Storage policy ensured.")
    except Exception as e:
        print(f"Warning/Error during storage bucket setup: {e}")

    try:
        # 4. Recreate the view view_positions_live_scores to include o.image_url
        print("Recreating view view_positions_live_scores...")
        cur.execute("DROP VIEW IF EXISTS view_positions_live_scores;")
        
        cur.execute("""
            CREATE OR REPLACE VIEW view_positions_live_scores AS
            SELECT 
                p.id AS position_id,
                p.title AS position_title,
                o.id AS current_official_id,
                o.first_name || ' ' || o.last_name AS current_official_name,
                o.service_cadre AS service_cadre,
                o.image_url AS image_url, -- Newly exposed!
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
        """)
        print("View view_positions_live_scores recreated successfully!")
        
    except Exception as e:
        print(f"Failed to recreate view: {e}")
        conn.close()
        return False

    conn.close()
    print("All schema updates finished successfully!")
    return True

if __name__ == "__main__":
    run_updates()
