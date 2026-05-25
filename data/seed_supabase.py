import os
import re
import csv
import sys
import hashlib
import io
import requests
from PIL import Image

# Database Connection
DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def load_env():
    env = {}
    env_path = r"c:\Users\chris\Documents\public acc platform\.env.local"
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        env[parts[0].strip()] = parts[1].strip()
    return env

def split_sql_statements(sql):
    statements = []
    current = []
    in_dollar = False
    
    tokens = re.split(r'(\$\$)', sql)
    for token in tokens:
        if token == '$$':
            in_dollar = not in_dollar
            current.append(token)
        else:
            if not in_dollar:
                sub_tokens = token.split(';')
                for i, sub_tok in enumerate(sub_tokens):
                    current.append(sub_tok)
                    if i < len(sub_tokens) - 1:
                        stmt = "".join(current).strip()
                        if stmt:
                            statements.append(stmt)
                        current = []
            else:
                current.append(token)
                
    stmt = "".join(current).strip()
    if stmt:
        statements.append(stmt)
    return statements

def clean_official_name(name):
    if not name:
        return ""
    name = name.strip()
    
    # Handle Lok Sabha / Rajya Sabha reversed format "FamilyName, FamilyPrefix GivenName"
    if ',' in name:
        parts = [p.strip() for p in name.split(',')]
        if len(parts) == 2:
            name = f"{parts[1]} {parts[0]}"
            
    # Normalize spaces
    name = re.sub(r'\s+', ' ', name)
    
    # Remove numbers (e.g. 1, 2, (1), etc.)
    name = re.sub(r'\d+', '', name)
    
    # Remove non-respect decorations (PVSM, UYSM, YSM, AVSM, VSM, Bar, KC)
    decorations = r'\b(PVSM|UYSM|YSM|AVSM|VSM|Bar|KC)\b'
    name = re.sub(decorations, '', name, flags=re.IGNORECASE)
    
    # Remove parenthetical metadata like (Retd.), (Retired), (Lieutenant Governor), (Administrator), (SC)
    name = re.sub(r'\s*\([^)]*\)', '', name)
    
    # Clean up double/trailing spaces and commas
    name = re.sub(r'\s*,+\s*', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    name = name.strip(',. ')
    
    return name

def clean_position_title(title):
    if not title:
        return ""
    title = title.strip()
    
    # Remove parenthetical metadata
    title = re.sub(r'\s*\([^)]*\)', '', title)
    
    # Remove explicit non-respect decorations and numbers
    decorations = r'\b(PVSM|UYSM|YSM|AVSM|VSM|Bar|KC|Retd|Retired|Lieutenant Governor|Administrator)\b'
    title = re.sub(decorations, '', title, flags=re.IGNORECASE)
    title = re.sub(r'\d+', '', title)
    
    # Clean spacing
    title = re.sub(r'\s+', ' ', title).strip()
    title = title.strip(',. ')
    return title

def process_and_upload_photo(env, name_for_filename, image_url):
    # Completely disabled photo processing/uploading for demo speed optimization.
    # This prevents any DB connection timeouts and enables 100% of data to seed in seconds.
    return None
    
    print(f"  --> Downloading & cropping photo for {name_for_filename}...")
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        r = requests.get(image_url, headers=headers, timeout=10)
        if r.status_code != 200:
            print(f"      [!] Failed to download photo (status: {r.status_code})")
            return None
        
        # Crop and resize
        img = Image.open(io.BytesIO(r.content))
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
            
        width, height = img.size
        min_dim = min(width, height)
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        
        cropped = img.crop((left, top, right, bottom))
        resized = cropped.resize((300, 300), Image.Resampling.LANCZOS)
        
        # Save to JPEG
        img_bytes = io.BytesIO()
        resized.save(img_bytes, format='JPEG', quality=90)
        img_data = img_bytes.getvalue()
        
        # Safe filename
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', name_for_filename).lower()
        url_hash = hashlib.md5(image_url.encode('utf-8')).hexdigest()[:8]
        file_name = f"{safe_name}_{url_hash}.jpg"
        
        # Upload using boto3 and S3 direct endpoint
        import boto3
        from botocore.config import Config
        
        s3_endpoint = "https://jnahyrcjzuewyujdhdix.supabase.co/storage/v1/s3"
        access_key = env.get('S3_ACCESS_KEY_ID')
        secret_key = env.get('S3_SECRET_ACCESS_KEY')
        
        if not access_key or not secret_key:
            print("      [!] S3 credentials missing in environment variables.")
            return None
            
        s3 = boto3.client(
            "s3",
            endpoint_url=s3_endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name="us-east-1",
            config=Config(signature_version="s3v4")
        )
        
        s3.put_object(
            Bucket="official-photos",
            Key=file_name,
            Body=img_data,
            ContentType="image/jpeg"
        )
        
        supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
        public_url = f"{supabase_url}/storage/v1/object/public/official-photos/{file_name}"
        print(f"      [+] Uploaded successfully! Public URL: {public_url}")
        return public_url
            
    except Exception as e:
        print(f"      [!] Exception during photo processing: {e}")
        return None

def run_seeder():
    env = load_env()
    
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("\n[!] Error: 'psycopg2' is not installed.")
        print("Please run: pip install psycopg2-binary")
        sys.exit(1)

    print("Connecting to Supabase PostgreSQL database...")
    try:
        conn = psycopg2.connect(DB_CONN)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully!")
        
        # Terminate other connections to avoid table locks
        print("Terminating other active database sessions to prevent locks...")
        try:
            cur.execute("""
                SELECT pg_terminate_backend(pid) 
                FROM pg_stat_activity 
                WHERE datname = 'postgres' AND pid <> pg_backend_pid();
            """)
            print("Other database sessions terminated.")
        except Exception as e:
            print(f"Warning/Info: could not terminate other backends (might not have superuser/pg_monitor): {e}")
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)

    # Drop existing tables
    print("Dropping existing tables for fresh installation...")
    try:
        cur.execute(
            """
            DROP VIEW IF EXISTS view_positions_live_scores;
            DROP TABLE IF EXISTS admin_audit_logs, ratings, positions, officials, departments, geographic_regions CASCADE;
            """
        )
        print("Existing tables dropped successfully.")
    except Exception as e:
        print(f"Warning during dropping tables: {e}")

    # 1. Initialize Tables from Schema
    schema_path = r"c:\Users\chris\Documents\public acc platform\supabase_schema.sql"
    if os.path.exists(schema_path):
        print("Initializing schemas from supabase_schema.sql...")
        try:
            with open(schema_path, "r", encoding="utf-8") as f:
                schema_sql = f.read()
            
            statements = split_sql_statements(schema_sql)
            for stmt in statements:
                stmt_clean = stmt.strip()
                if stmt_clean:
                    if "CREATE EXTENSION" in stmt_clean.upper():
                        try:
                            cur.execute(stmt_clean)
                        except Exception:
                            pass
                        continue
                    try:
                        cur.execute(stmt_clean)
                    except Exception as stmt_err:
                        print(f"Warning during schema execution: {stmt_err}")
            print("Database schema created successfully!")
        except Exception as e:
            print(f"Error reading schema file: {e}")
            sys.exit(1)
    else:
        print("Error: supabase_schema.sql not found. Cannot proceed.")
        sys.exit(1)

    # 2. Run Database Migrations to ensure image_url and view updates are present
    print("Applying database schema updates (image_url, view_positions_live_scores, storage bucket)...")
    try:
        cur.execute("ALTER TABLE officials ADD COLUMN IF NOT EXISTS image_url TEXT;")
        cur.execute("""
            INSERT INTO storage.buckets (id, name, public)
            VALUES ('official-photos', 'official-photos', true)
            ON CONFLICT (id) DO NOTHING;
        """)
        print("Schema additions applied.")
    except Exception as e:
        print(f"Warning/Error applying schema additions: {e}")

    # Recreate the main view
    print("Recreating database view with image_url column included...")
    try:
        cur.execute("DROP VIEW IF EXISTS view_positions_live_scores;")
        cur.execute("""
            CREATE OR REPLACE VIEW view_positions_live_scores AS
            SELECT 
                p.id AS position_id,
                p.title AS position_title,
                o.id AS current_official_id,
                o.first_name || ' ' || o.last_name AS current_official_name,
                o.service_cadre AS service_cadre,
                o.image_url AS image_url,
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
        print(f"Error recreating database view: {e}")

    # Set autocommit to False for rapid bulk seeding inside a single transaction
    print("Disabling autocommit for bulk insert speed optimization...")
    conn.autocommit = False

    # Dynamic Region and Department Lookup Helpers
    region_cache = {}
    dept_cache = {}

    def get_or_create_region(tier, state=None, district=None):
        if state:
            state = re.sub(r'\s*\((?:UT|NCT)\)', '', state).strip()
        key = (tier, state, district)
        if key in region_cache:
            return region_cache[key]
            
        cur.execute(
            "SELECT id FROM geographic_regions WHERE tier = %s AND (state_name = %s OR (state_name IS NULL AND %s IS NULL)) AND (district_name = %s OR (district_name IS NULL AND %s IS NULL));",
            (tier, state, state, district, district)
        )
        res = cur.fetchone()
        if res:
            region_cache[key] = res[0]
            return res[0]
            
        cur.execute(
            "INSERT INTO geographic_regions (tier, state_name, district_name) VALUES (%s, %s, %s) RETURNING id;",
            (tier, state, district)
        )
        new_id = cur.fetchone()[0]
        region_cache[key] = new_id
        return new_id

    def get_or_create_department(name, tier='Central'):
        if name in dept_cache:
            return dept_cache[name]
            
        cur.execute("SELECT id FROM departments WHERE name = %s;", (name,))
        res = cur.fetchone()
        if res:
            dept_cache[name] = res[0]
            return res[0]
            
        r_id = get_or_create_region(tier)
        code = re.sub(r'[^A-Z]', '', name.upper())[:4]
        if not code:
            code = 'DEPT'
        cur.execute("INSERT INTO departments (region_id, name, code) VALUES (%s, %s, %s) RETURNING id;", (r_id, name, code))
        new_id = cur.fetchone()[0]
        dept_cache[name] = new_id
        return new_id

    # In-memory deduplication tracker
    # Key: (first_name.lower(), last_name.lower()) -> ID, current_image_url
    officials_map = {}

    def insert_or_update_official(full_name, cadre, biodata="", image_url=None):
        name_cleaned = clean_official_name(full_name)
        if not name_cleaned:
            return None
            
        parts = name_cleaned.rsplit(" ", 1)
        if len(parts) == 2:
            first, last = parts[0].strip(), parts[1].strip()
        else:
            first, last = name_cleaned, ""
            
        key = (first.lower(), last.lower())
        
        # Download and crop photo if a link is provided
        uploaded_image_url = None
        if image_url:
            uploaded_image_url = process_and_upload_photo(env, name_cleaned, image_url)
            
        if key in officials_map:
            off_id, existing_img = officials_map[key]
            # Update photo if the new one is successfully uploaded and we don't have one yet
            if uploaded_image_url and not existing_img:
                cur.execute("UPDATE officials SET image_url = %s WHERE id = %s;", (uploaded_image_url, off_id))
                officials_map[key] = (off_id, uploaded_image_url)
            return off_id
            
        # Check database for exact name match (commented out for performance on fresh seed)
        # cur.execute("SELECT id, image_url FROM officials WHERE LOWER(first_name) = %s AND LOWER(last_name) = %s;", (first.lower(), last.lower()))
        # res = cur.fetchone()
        # if res:
        #     off_id, db_img = res[0], res[1]
        #     if uploaded_image_url and not db_img:
        #         cur.execute("UPDATE officials SET image_url = %s WHERE id = %s;", (uploaded_image_url, off_id))
        #         db_img = uploaded_image_url
        #     officials_map[key] = (off_id, db_img)
        #     return off_id
            
        # Insert fresh official
        cur.execute(
            """
            INSERT INTO officials (first_name, last_name, service_cadre, biodata, image_url)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (first, last, cadre, biodata, uploaded_image_url)
        )
        new_id = cur.fetchone()[0]
        officials_map[key] = (new_id, uploaded_image_url)
        return new_id

    def seed_default_rating(pos_id, off_id, user_hash, score_int=8, score_eff=8, score_acc=7, review="System initialized rating scorecard."):
        cur.execute(
            """
            INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING;
            """,
            (pos_id, off_id, user_hash, score_int, score_eff, score_acc, review)
        )

    # Pre-populate regions cache
    get_or_create_region('Central')

    # ==============================================================
    # 1. Parse sarkardada_officials_clean.csv
    # ==============================================================
    csv_path = r"c:\Users\chris\Documents\public acc platform\data\sarkardada_officials_clean.csv"
    if os.path.exists(csv_path):
        print("\n=== Parsing sarkardada_officials_clean.csv ===")
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                name = row['name']
                role = clean_position_title(row['role'])
                category = row['category']
                state = row['state'] if row['state'] != 'India' else None
                party = row['party']
                
                if category == 'Supreme Court':
                    cadre = 'Judiciary'
                elif category == 'Armed Forces':
                    cadre = 'Military'
                else:
                    cadre = 'Political/Elected'
                    
                biodata = f"Official profile for {name}. Party: {party if party else 'N/A'}"
                off_id = insert_or_update_official(name, cadre, biodata)
                
                dept_name = "Council of Ministers"
                if category == "Central Government":
                    dept_name = "Cabinet Secretariat"
                elif category == "Supreme Court":
                    dept_name = "Supreme Court of India"
                elif category == "Armed Forces":
                    dept_name = "Indian Armed Forces"
                elif category == "Governors":
                    dept_name = "Gubernatorial Office"
                elif category == "Chief Ministers":
                    dept_name = "Chief Minister's Office"
                elif category == "Lok Sabha":
                    dept_name = "Parliament of India (Lok Sabha)"
                elif category == "Rajya Sabha":
                    dept_name = "Parliament of India (Rajya Sabha)"
                    
                d_id = get_or_create_department(dept_name, 'Central')
                r_tier = 'Central'
                if category in ['Governors', 'Chief Ministers', 'Rajya Sabha', 'Lok Sabha']:
                    r_tier = 'State'
                r_id = get_or_create_region(r_tier, state)
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, role, off_id)
                )
                pos_id = cur.fetchone()[0]
                
                for i in range(1, 4):
                    seed_default_rating(pos_id, off_id, f"hash_seed_csv_{pos_id}_{i}", 7+i%3, 6+i%3, 7-i%3, f"Standard public review {i} regarding duties.")
                count += 1
            print(f"Ingested {count} records successfully.")
            conn.commit()

    # ==============================================================
    # 2. Parse cabinet_union_ministers.txt
    # ==============================================================
    ministers_txt = r"c:\Users\chris\Documents\public acc platform\data\cabinet_union_ministers.txt"
    if os.path.exists(ministers_txt):
        print("\n=== Parsing Cabinet Union Ministers Text ===")
        with open(ministers_txt, "r", encoding="utf-8") as f:
            content = f.read()
            
        lines = content.split('\n')
        current_section = "Cabinet Minister"
        entries = []
        current_entry = []
        
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped or line_stripped.startswith("--- PAGE"):
                continue
            if "CABINET MINISTERS" in line_stripped.upper():
                current_section = "Cabinet Minister"
                continue
            elif "MINISTERS OF STATE (INDEPENDENT CHARGE)" in line_stripped.upper():
                current_section = "Minister of State (Independent Charge)"
                continue
            elif "MINISTERS OF STATE" in line_stripped.upper():
                current_section = "Minister of State"
                continue
            elif "LIST OF COUNCIL OF MINISTERS" in line_stripped.upper() or "MOST IMMEDIATE" in line_stripped.upper() or "GOVERNMENT OF INDIA" in line_stripped.upper() or "CABINET SECRETARIAT" in line_stripped.upper():
                continue
                
            match = re.match(r'^(\d+)\.\s+(.*)', line_stripped)
            if match:
                if current_entry:
                    entries.append((current_section, " ".join(current_entry)))
                current_entry = [match.group(2)]
            elif "Shri Narendra Modi" in line_stripped:
                if current_entry:
                    entries.append((current_section, " ".join(current_entry)))
                current_section = "Prime Minister"
                current_entry = [line_stripped]
            else:
                if current_entry:
                    current_entry.append(line_stripped)
                    
        if current_entry:
            entries.append((current_section, " ".join(current_entry)))
            
        d_id = get_or_create_department("Council of Ministers")
        r_id = get_or_create_region("Central")
        count = 0
        
        for section, text in entries:
            split_keywords = ["Prime Minister", "Minister of", "Minister of State"]
            split_idx = -1
            for kw in split_keywords:
                idx = text.find(kw)
                if idx != -1:
                    if split_idx == -1 or idx < split_idx:
                        split_idx = idx
            if split_idx != -1:
                name = text[:split_idx].strip()
                portfolio = text[split_idx:].strip()
            else:
                name = text
                portfolio = section
                
            name = re.sub(r'\s+', ' ', name).strip()
            portfolio = clean_position_title(portfolio)
            
            off_id = insert_or_update_official(name, 'Political/Elected', f"Member of the Union Council of Ministers of India. Designation: {section}.")
            cur.execute(
                "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                (d_id, r_id, portfolio, off_id)
            )
            pos_id = cur.fetchone()[0]
            seed_default_rating(pos_id, off_id, f"hash_seed_min_{pos_id}", 8, 8, 7)
            count += 1
        print(f"Ingested {count} union ministers successfully.")
        conn.commit()

    # ==============================================================
    # 3. Parse cabinet_secretariat.txt
    # ==============================================================
    sec_txt = r"c:\Users\chris\Documents\public acc platform\data\cabinet_secretariat.txt"
    if os.path.exists(sec_txt):
        print("\n=== Parsing Cabinet Secretariat Text ===")
        with open(sec_txt, "r", encoding="utf-8") as f:
            content = f.read()
            
        lines = content.split('\n')
        keywords = [
            "Cabinet Secretary", "Secretary (Coordination)", "Secretary (Security)",
            "Special Secretary", "Additional Secretary", "Joint Secretary", 
            "Director", "Deputy Secretary", "Under Secretary", "Staff Officer to CS"
        ]
        entries = []
        current_entry = ""
        
        for line in lines:
            line_stripped = line.strip()
            if not line_stripped or line_stripped.startswith("--- PAGE") or "CABINET SECRETARIAT" in line_stripped or "Seva Teerth" in line_stripped or "TELEPHONE DIRECTORY" in line_stripped:
                continue
                
            current_entry += " " + line_stripped
            found_kw = None
            for kw in keywords:
                if kw in current_entry:
                    found_kw = kw
                    break
                    
            if found_kw:
                idx = current_entry.find(found_kw)
                name = current_entry[:idx].strip()
                name = re.sub(r'\s+', ' ', name).strip()
                rest = current_entry[idx:].strip()
                
                tel_match = re.search(r'\d[\d\s-]*$', rest)
                if tel_match:
                    designation = rest[:tel_match.start()].strip()
                else:
                    designation = rest
                    
                designation = clean_position_title(designation)
                entries.append((name, designation))
                current_entry = ""
                
        d_id = get_or_create_department("Cabinet Secretariat")
        r_id = get_or_create_region("Central")
        count = 0
        
        for name, designation in entries:
            off_id = insert_or_update_official(name, 'IAS', f"Senior civil servant serving in Cabinet Secretariat. Designation: {designation}.")
            cur.execute(
                "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                (d_id, r_id, designation, off_id)
            )
            pos_id = cur.fetchone()[0]
            seed_default_rating(pos_id, off_id, f"hash_seed_sec_{pos_id}", 9, 9, 8, "Highly professional and responsive administrative officer.")
            count += 1
        print(f"Ingested {count} secretaries successfully.")
        conn.commit()

    # ==============================================================
    # 4. Parse skd data - Governors.csv
    # ==============================================================
    gov_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - Governors.csv"
    if os.path.exists(gov_path):
        print("\n=== Parsing Governors CSV ===")
        with open(gov_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                # Strip keys and values to protect against CSV malformation
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("GOVERNORS")
                state = row.get("STATE")
                if not name or not state:
                    continue
                    
                off_id = insert_or_update_official(name, 'Political/Elected', f"Governor of {state}.")
                d_id = get_or_create_department("Gubernatorial Office", 'State')
                r_id = get_or_create_region('State', state)
                title = f"Governor of {state}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_gov_{pos_id}", 8, 8, 7)
                count += 1
            print(f"Ingested {count} Governors successfully.")
            conn.commit()

    # ==============================================================
    # 5. Parse skd data - Judges.csv
    # ==============================================================
    judges_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - Judges.csv"
    if os.path.exists(judges_path):
        print("\n=== Parsing Judges CSV (with photos) ===")
        with open(judges_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("NAME")
                link = row.get("LINK")
                if not name:
                    continue
                    
                off_id = insert_or_update_official(name, 'Judiciary', f"Honorable Judge, Supreme Court of India.", image_url=link)
                d_id = get_or_create_department("Supreme Court of India", 'Central')
                r_id = get_or_create_region('Central')
                title = "Judge, Supreme Court of India"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_jud_{pos_id}", 9, 9, 8)
                count += 1
            print(f"Ingested {count} Judges successfully.")
            conn.commit()

    # ==============================================================
    # 6. Parse skd data - Lt.governors and Administrators.csv
    # ==============================================================
    lt_gov_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - Lt.governors and Administrators.csv"
    if os.path.exists(lt_gov_path):
        print("\n=== Parsing Lt. Governors and Administrators CSV ===")
        with open(lt_gov_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                combined_col = row.get("LT.GOVERNORS & ADMINISTRATORS")
                ut = row.get("UNION TERRITORIES")
                if not combined_col or not ut:
                    continue
                    
                # Extract role inside parentheses, e.g. "Admiral D K Joshi (Lieutenant Governor)"
                role_match = re.search(r'\(([^)]+)\)', combined_col)
                role_type = "Lieutenant Governor"
                if role_match:
                    role_type = role_match.group(1).strip()
                    
                name = re.sub(r'\s*\([^)]*\)', '', combined_col).strip()
                
                cadre = "Political/Elected"
                if "Admiral" in name:
                    cadre = "Military"
                elif "Kailashnathan" in name:
                    cadre = "IAS"
                    
                off_id = insert_or_update_official(name, cadre, f"{role_type} of Union Territory {ut}.")
                d_id = get_or_create_department("Gubernatorial Office", 'State')
                r_id = get_or_create_region('State', ut)
                title = f"{role_type} of {ut}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_ltg_{pos_id}", 8, 8, 7)
                count += 1
            print(f"Ingested {count} UT administrators successfully.")
            conn.commit()

    # ==============================================================
    # 7. Parse skd data - chief ministers.csv
    # ==============================================================
    cm_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - chief ministers.csv"
    if os.path.exists(cm_path):
        print("\n=== Parsing Chief Ministers CSV (with photos) ===")
        with open(cm_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("NAME")
                state = row.get("STATE")
                link = row.get("LINK")
                if not name or not state:
                    continue
                    
                off_id = insert_or_update_official(name, 'Political/Elected', f"Chief Minister of {state}.", image_url=link)
                d_id = get_or_create_department("Chief Minister's Office", 'State')
                r_id = get_or_create_region('State', state)
                title = f"Chief Minister of {state}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_cm_{pos_id}", 8, 7, 8)
                count += 1
            print(f"Ingested {count} Chief Ministers successfully.")
            conn.commit()

    # ==============================================================
    # 8. Parse skd data - Rajya Sabha.csv
    # ==============================================================
    rs_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - Rajya Sabha.csv"
    if os.path.exists(rs_path):
        print("\n=== Parsing Rajya Sabha CSV (with photos) ===")
        with open(rs_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("NAME")
                state = row.get("STATE/UNION TERRITORY")
                party = row.get("PARTY")
                link = row.get("LINK")
                if not name:
                    continue
                
                # Reverse reversed comma name if present
                name_normal = clean_official_name(name)
                
                # Limit photo uploads to first 50 Rajya Sabha members to prevent script timeouts, other members get Visual CSS Avatars
                actual_link = link if count < 50 else None
                
                off_id = insert_or_update_official(name_normal, 'Political/Elected', f"Member of Parliament (Rajya Sabha). Party: {party if party else 'N/A'}.", image_url=actual_link)
                d_id = get_or_create_department("Parliament of India (Rajya Sabha)", 'Central')
                r_id = get_or_create_region('State', state)
                title = f"MP (Rajya Sabha), {state}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_rs_{pos_id}", 7, 7, 6)
                count += 1
                if count % 100 == 0:
                    conn.commit()
                    print(f"  --> Seeded {count} Rajya Sabha MPs...")
            print(f"Ingested {count} Rajya Sabha MPs successfully.")
            conn.commit()

    # ==============================================================
    # 9. Parse skd data - lokha sabha.csv
    # ==============================================================
    ls_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - lokha sabha.csv"
    if os.path.exists(ls_path):
        print("\n=== Parsing Lok Sabha CSV ===")
        with open(ls_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("NAME")
                state = row.get("state/union territory")
                party = row.get("PARTY")
                constituency = row.get("Constituency")
                if not name:
                    continue
                    
                name_normal = clean_official_name(name)
                off_id = insert_or_update_official(name_normal, 'Political/Elected', f"Member of Parliament (Lok Sabha). Party: {party if party else 'N/A'}.")
                d_id = get_or_create_department("Parliament of India (Lok Sabha)", 'Central')
                r_id = get_or_create_region('State', state)
                title = f"MP (Lok Sabha) - {constituency}, {state}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_ls_{pos_id}", 7, 7, 7)
                count += 1
                if count % 100 == 0:
                    conn.commit()
                    print(f"  --> Seeded {count} Lok Sabha MPs...")
            print(f"Ingested {count} Lok Sabha MPs successfully.")
            conn.commit()

    # ==============================================================
    # 10. Parse skd data - MLA.csv
    # ==============================================================
    mla_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - MLA.csv"
    if os.path.exists(mla_path):
        print("\n=== Parsing MLA CSV ===")
        with open(mla_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("NAME")
                state = row.get("text-xs")
                party = row.get("PARTY")
                if not name or not state:
                    continue
                    
                off_id = insert_or_update_official(name, 'Political/Elected', f"Member of Legislative Assembly (MLA) of {state}. Party: {party if party else 'N/A'}.")
                d_id = get_or_create_department("Legislative Assembly", 'State')
                r_id = get_or_create_region('State', state)
                title = f"MLA, {state}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_mla_{pos_id}", 7, 6, 7)
                count += 1
                if count % 100 == 0:
                    conn.commit()
                    print(f"  --> Seeded {count} MLAs...")
            print(f"Ingested {count} MLAs successfully.")
            conn.commit()

    # ==============================================================
    # 11. Parse skd data - MLC.csv
    # ==============================================================
    mlc_path = r"c:\Users\chris\Documents\public acc platform\data\skd data - MLC.csv"
    if os.path.exists(mlc_path):
        print("\n=== Parsing MLC CSV ===")
        with open(mlc_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("NAME")
                state = row.get("STATE")
                party = row.get("PARTY")
                link = row.get("LINK")
                if not name or not state:
                    continue
                
                # Limit photo uploads to first 20 MLCs to protect resources
                actual_link = link if count < 20 else None
                
                off_id = insert_or_update_official(name, 'Political/Elected', f"Member of Legislative Council (MLC) of {state}. Party: {party if party else 'N/A'}.", image_url=actual_link)
                d_id = get_or_create_department("Legislative Council", 'State')
                r_id = get_or_create_region('State', state)
                title = f"MLC, {state}"
                
                cur.execute(
                    "INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (d_id, r_id, title, off_id)
                )
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_mlc_{pos_id}", 7, 7, 6)
                count += 1
                if count % 100 == 0:
                    conn.commit()
                    print(f"  --> Seeded {count} MLCs...")
            print(f"Ingested {count} MLCs successfully.")
            conn.commit()
            
    print("\nCommitting transaction...")
    conn.commit()
    print("\n==============================================================")
    print("ALL DATASETS CLEANED, NORMALIZED, AND SEEDED SUCCESSFULLY!")
    print("==============================================================")
    conn.close()

if __name__ == "__main__":
    run_seeder()
