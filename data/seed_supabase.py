import os
import re
import csv
import sys

# Connection string setup
DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def split_sql_statements(sql):
    statements = []
    current = []
    in_dollar = False
    
    # Split tokens by dollar quotes ($$)
    tokens = re.split(r'(\$\$)', sql)
    for token in tokens:
        if token == '$$':
            in_dollar = not in_dollar
            current.append(token)
        else:
            if not in_dollar:
                # Outside dollar quotes: split by semicolon
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

def run_seeder():
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
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)

    # Clean existing tables for a fresh, clean load
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
                    # Skip extension creation if they require superuser
                    if "CREATE EXTENSION" in stmt_clean.upper():
                        try:
                            cur.execute(stmt_clean)
                        except Exception:
                            pass # Ignored if extension already exists or no permission
                        continue
                        
                    try:
                        cur.execute(stmt_clean)
                    except Exception as stmt_err:
                        print(f"Warning during schema execution: {stmt_err}")
                        print(f"Failed Statement: {stmt_clean[:100]}...")
            print("Database schema created successfully!")
        except Exception as e:
            print(f"Error reading schema file: {e}")
    else:
        print("Warning: supabase_schema.sql not found in workspace root. Skipping initialization.")

    # Helper function to split name
    def split_name(full_name):
        # Remove titles
        cleaned = re.sub(r'^(Shri|Smt\.|Dr\.|Ms\.|Mr\.|Sushri|Prof\.)\s+', '', full_name).strip()
        parts = cleaned.split(" ", 1)
        first_name = parts[0]
        last_name = parts[1] if len(parts) > 1 else ""
        return first_name, last_name

    # 2. Insert Core Geographic Regions
    print("Seeding geographic regions...")
    regions = [
        ('Central', None, None, None),
        ('State', 'Arunachal Pradesh', None, None),
        ('State', 'Assam', None, None),
        ('State', 'Karnataka', None, None),
        ('State', 'Kerala', None, None),
        ('State', 'Uttar Pradesh', None, None),
        ('State', 'West Bengal', None, None),
        ('State', 'Telangana', None, None),
        ('State', 'Himachal Pradesh', None, None),
        ('District', 'Kerala', 'Wayanad', None),
        ('District', 'Maharashtra', 'Pune', None),
        ('Municipality', 'Maharashtra', 'Pune', 'Pune Municipal Corporation')
    ]
    
    region_id_map = {}
    for tier, state, dist, local in regions:
        cur.execute(
            """
            INSERT INTO geographic_regions (tier, state_name, district_name, local_body_name)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id;
            """,
            (tier, state, dist, local)
        )
        res = cur.fetchone()
        if res:
            region_id_map[(tier, state, dist)] = res[0]
        else:
            # Retrieve existing ID
            if state is None:
                cur.execute("SELECT id FROM geographic_regions WHERE tier=%s AND state_name IS NULL", (tier,))
            elif dist is None:
                cur.execute("SELECT id FROM geographic_regions WHERE tier=%s AND state_name=%s AND district_name IS NULL", (tier, state))
            else:
                cur.execute("SELECT id FROM geographic_regions WHERE tier=%s AND state_name=%s AND district_name=%s", (tier, state, dist))
            region_id_map[(tier, state, dist)] = cur.fetchone()[0]

    # Helper to retrieve region ID
    def get_region_id(tier, state_name=None, district_name=None):
        return region_id_map.get((tier, state_name, district_name), region_id_map.get(('Central', None, None)))

    # 3. Insert Departments
    print("Seeding departments...")
    departments = [
        ("Cabinet Secretariat", "Central"),
        ("Council of Ministers", "Central"),
        ("Supreme Court of India", "Central"),
        ("Indian Armed Forces", "Central"),
        ("Chief Minister's Office", "State"),
        ("Gubernatorial Office", "State"),
        ("Parliament of India (Lok Sabha)", "Central"),
        ("Parliament of India (Rajya Sabha)", "Central")
    ]
    
    dept_id_map = {}
    for name, tier in departments:
        r_id = get_region_id(tier)
        cur.execute(
            """
            INSERT INTO departments (region_id, name, code)
            VALUES (%s, %s, %s)
            ON CONFLICT DO NOTHING
            RETURNING id;
            """,
            (r_id, name, name[:4].upper())
        )
        res = cur.fetchone()
        if res:
            dept_id_map[name] = res[0]
        else:
            cur.execute("SELECT id FROM departments WHERE name=%s", (name,))
            dept_id_map[name] = cur.fetchone()[0]

    # 4. Parse & Insert from sarkardada_officials_clean.csv
    csv_path = r"c:\Users\chris\Documents\public acc platform\data\sarkardada_officials_clean.csv"
    if os.path.exists(csv_path):
        print("Parsing CSV data...")
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                name = row['name']
                role = row['role']
                category = row['category']
                state = row['state'] if row['state'] != 'India' else None
                party = row['party']

                first, last = split_name(name)
                
                # Determine service cadre
                if category == 'Supreme Court':
                    cadre = 'Judiciary'
                elif category == 'Armed Forces':
                    cadre = 'Military'
                else:
                    cadre = 'Political/Elected'
                
                # Insert official
                cur.execute(
                    """
                    INSERT INTO officials (first_name, last_name, service_cadre, batch_year, biodata)
                    VALUES (%s, %s, %s, NULL, %s)
                    RETURNING id;
                    """,
                    (first, last, cadre, f"Official profile for {name}. Party: {party if party else 'N/A'}")
                )
                off_id = cur.fetchone()[0]

                # Map category to department
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
                
                d_id = dept_id_map.get(dept_name, dept_id_map["Council of Ministers"])
                
                # Region assignment
                r_tier = 'Central'
                if category in ['Governors', 'Chief Ministers', 'Rajya Sabha', 'Lok Sabha']:
                    r_tier = 'State'
                
                r_id = get_region_id(r_tier, state)

                # Insert position
                cur.execute(
                    """
                    INSERT INTO positions (department_id, region_id, title, current_official_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (d_id, r_id, role, off_id)
                )
                pos_id = cur.fetchone()[0]

                # Create 3 initial ratings for each main profile
                for i in range(1, 4):
                    cur.execute(
                        """
                        INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text)
                        VALUES (%s, %s, %s, %s, %s, %s, %s);
                        """,
                        (pos_id, off_id, f"hash_seed_csv_{pos_id}_{i}", 7+i%3, 6+i%3, 7-i%3, f"Standard public review {i} regarding duties.")
                    )

    # 5. Parse & Insert from cabinet_union_ministers.txt
    ministers_txt = r"c:\Users\chris\Documents\public acc platform\data\cabinet_union_ministers.txt"
    if os.path.exists(ministers_txt):
        print("Parsing Union Ministers PDF text...")
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

            # Start of a new numbered entry
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

        d_id = dept_id_map["Council of Ministers"]
        r_id = get_region_id("Central")

        print(f"Found {len(entries)} Council of Ministers entries. Seeding...")
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
            portfolio = re.sub(r'\s+', ' ', portfolio).strip()
            if portfolio.endswith('.'):
                portfolio = portfolio[:-1]

            first, last = split_name(name)
            
            # Avoid inserting duplicate officials
            cur.execute("SELECT id FROM officials WHERE first_name=%s AND last_name=%s", (first, last))
            off_res = cur.fetchone()
            if off_res:
                off_id = off_res[0]
            else:
                cur.execute(
                    """
                    INSERT INTO officials (first_name, last_name, service_cadre, biodata)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id;
                    """,
                    (first, last, 'Political/Elected', f"Member of the Union Council of Ministers of India. Designation: {section}.")
                )
                off_id = cur.fetchone()[0]

            # Insert position
            cur.execute(
                """
                INSERT INTO positions (department_id, region_id, title, current_official_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
                """,
                (d_id, r_id, portfolio, off_id)
            )
            pos_id = cur.fetchone()[0]

            # Write standard review seed
            cur.execute(
                """
                INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text)
                VALUES (%s, %s, %s, 8, 8, 7, 'System initialized rating scorecard based on general performance.');
                """,
                (pos_id, off_id, f"hash_seed_min_{pos_id}")
            )

    # 6. Parse & Insert from cabinet_secretariat.txt
    sec_txt = r"c:\Users\chris\Documents\public acc platform\data\cabinet_secretariat.txt"
    if os.path.exists(sec_txt):
        print("Parsing Cabinet Secretariat text...")
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
                    tel = tel_match.group(0).strip()
                    designation = rest[:tel_match.start()].strip()
                else:
                    tel = ""
                    designation = rest

                designation = re.sub(r'\s+', ' ', designation).strip()
                entries.append((name, designation))
                current_entry = ""

        d_id = dept_id_map["Cabinet Secretariat"]
        r_id = get_region_id("Central")

        print(f"Found {len(entries)} Secretaries/IAS officials. Seeding...")
        for name, designation in entries:
            first, last = split_name(name)
            
            # Insert official
            cur.execute(
                """
                INSERT INTO officials (first_name, last_name, service_cadre, biodata)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
                """,
                (first, last, 'IAS', f"Senior civil servant currently serving at Cabinet Secretariat. Designation: {designation}.")
            )
            off_id = cur.fetchone()[0]

            # Insert position
            cur.execute(
                """
                INSERT INTO positions (department_id, region_id, title, current_official_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id;
                """,
                (d_id, r_id, designation, off_id)
            )
            pos_id = cur.fetchone()[0]

            # Write standard review seed
            cur.execute(
                """
                INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text)
                VALUES (%s, %s, %s, 9, 9, 8, 'Highly professional and responsive officer managing administrative functions.');
                """,
                (pos_id, off_id, f"hash_seed_sec_{pos_id}")
            )

    print("\n==============================================")
    print("Database seeding completed successfully!")
    print("==============================================")
    conn.close()

if __name__ == "__main__":
    run_seeder()
