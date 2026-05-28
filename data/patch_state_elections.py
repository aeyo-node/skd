import os
import re
import csv
import sys
import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def clean_official_name(name):
    if not name: return ""
    name = name.strip()
    if ',' in name:
        parts = [p.strip() for p in name.split(',')]
        if len(parts) == 2: name = f"{parts[1]} {parts[0]}"
    name = re.sub(r'\s+', ' ', name)
    name = re.sub(r'\d+', '', name)
    decorations = r'\b(PVSM|UYSM|YSM|AVSM|VSM|Bar|KC)\b'
    name = re.sub(decorations, '', name, flags=re.IGNORECASE)
    name = re.sub(r'\s*\([^)]*\)', '', name)
    name = re.sub(r'\s*,+\s*', ' ', name)
    name = re.sub(r'\s+', ' ', name).strip()
    return name.strip(',. ')

def run_patch():
    print("Connecting to Supabase PostgreSQL database for PATCHING...")
    try:
        conn = psycopg2.connect(DB_CONN)
        conn.autocommit = False
        cur = conn.cursor()
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect to database: {e}")
        sys.exit(1)

    region_cache = {}
    dept_cache = {}

    def get_or_create_region(tier, state=None, district=None):
        if state: state = re.sub(r'\s*\((?:UT|NCT)\)', '', state).strip()
        key = (tier, state, district)
        if key in region_cache: return region_cache[key]
        cur.execute("SELECT id FROM geographic_regions WHERE tier = %s AND (state_name = %s OR (state_name IS NULL AND %s IS NULL)) AND (district_name = %s OR (district_name IS NULL AND %s IS NULL));", (tier, state, state, district, district))
        res = cur.fetchone()
        if res:
            region_cache[key] = res[0]
            return res[0]
        cur.execute("INSERT INTO geographic_regions (tier, state_name, district_name) VALUES (%s, %s, %s) RETURNING id;", (tier, state, district))
        new_id = cur.fetchone()[0]
        region_cache[key] = new_id
        return new_id

    def get_or_create_department(name, tier='Central'):
        if name in dept_cache: return dept_cache[name]
        cur.execute("SELECT id FROM departments WHERE name = %s;", (name,))
        res = cur.fetchone()
        if res:
            dept_cache[name] = res[0]
            return res[0]
        r_id = get_or_create_region(tier)
        code = re.sub(r'[^A-Z]', '', name.upper())[:4]
        if not code: code = 'DEPT'
        cur.execute("INSERT INTO departments (region_id, name, code) VALUES (%s, %s, %s) RETURNING id;", (r_id, name, code))
        new_id = cur.fetchone()[0]
        dept_cache[name] = new_id
        return new_id

    officials_map = {}

    def insert_or_update_official(full_name, cadre, biodata=""):
        name_cleaned = clean_official_name(full_name)
        if not name_cleaned: return None
        parts = name_cleaned.rsplit(" ", 1)
        first, last = (parts[0].strip(), parts[1].strip()) if len(parts) == 2 else (name_cleaned, "")
        
        # In patch mode, we just insert a fresh official to avoid deleting and messing up other references.
        # But we do check if it exists in DB just in case.
        cur.execute("SELECT id FROM officials WHERE LOWER(first_name) = %s AND LOWER(last_name) = %s;", (first.lower(), last.lower()))
        res = cur.fetchone()
        if res:
            return res[0]

        cur.execute("INSERT INTO officials (first_name, last_name, service_cadre, biodata, image_url) VALUES (%s, %s, %s, %s, %s) RETURNING id;", (first, last, cadre, biodata, None))
        return cur.fetchone()[0]

    def seed_default_rating(pos_id, off_id, user_hash, score_int=8, score_eff=8, score_acc=7):
        cur.execute("""
            INSERT INTO ratings (position_id, official_id, user_hash, score_integrity, score_efficiency, score_accessibility, review_text)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT DO NOTHING;
        """, (pos_id, off_id, user_hash, score_int, score_eff, score_acc, "System initialized rating scorecard."))

    states_to_patch = ["Kerala", "Tamil Nadu", "Assam", "West Bengal", "Puducherry"]
    
    # 1. DELETE OLD MLAS
    print("\n--- Removing outdated MLAs for newly elected states ---")
    d_id_mla = get_or_create_department("Legislative Assembly", 'State')
    for st in states_to_patch:
        r_id = get_or_create_region('State', st)
        cur.execute("DELETE FROM positions WHERE region_id = %s AND department_id = %s;", (r_id, d_id_mla))
    conn.commit()
    print("Old MLAs successfully removed.")

    # 2. DELETE OLD MINISTERS
    print("\n--- Removing outdated State Ministers for Kerala and Tamil Nadu ---")
    d_id_min = get_or_create_department("State Council of Ministers", 'State')
    for st in ["Kerala", "Tamil Nadu"]:
        r_id = get_or_create_region('State', st)
        cur.execute("DELETE FROM positions WHERE region_id = %s AND department_id = %s;", (r_id, d_id_min))
        
        # Check CMs as well
        d_id_cm = get_or_create_department("Chief Minister's Office", 'State')
        cur.execute("DELETE FROM positions WHERE region_id = %s AND department_id = %s;", (r_id, d_id_cm))
    conn.commit()
    print("Old Ministers successfully removed.")

    # 3. SEED NEW MLAS
    def process_new_mla(file_path, state_name, name_key, party_key, title_fmt="MLA, {state}", const_key=None):
        if not os.path.exists(file_path): return
        print(f"\n=== Parsing NEW {state_name} MLAs CSV ===")
        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get(name_key)
                if not name or name.upper() == "NAME": continue
                    
                party = row.get(party_key, "")
                const = row.get(const_key, "") if const_key else ""
                
                biodata = f"Member of Legislative Assembly (MLA) of {state_name}."
                if party: biodata += f" Party: {party}."
                if const: biodata += f" Constituency: {const}."
                    
                off_id = insert_or_update_official(name, 'Political/Elected', biodata)
                d_id = get_or_create_department("Legislative Assembly", 'State')
                r_id = get_or_create_region('State', state_name)
                
                cur.execute("INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;", (d_id, r_id, title_fmt.format(state=state_name), off_id))
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_new_mla_{pos_id}", 7, 6, 7)
                count += 1
                if count % 25 == 0:
                    conn.commit()
                    print(f"  --> Seeded {count} {state_name} MLAs...")
            print(f"Ingested {count} {state_name} MLAs successfully.")
            conn.commit()

    base_dir = r"c:\Users\chris\Documents\public acc platform\data"
    process_new_mla(os.path.join(base_dir, "skd data - Kerala MLAs.csv"), "Kerala", "NAME", "PARTY", "MLA, {state}", "CONSTITUENCY")
    process_new_mla(os.path.join(base_dir, "skd data - Tamil nadu MLAs.csv"), "Tamil Nadu", "name", "party", "MLA, {state}", "seat")
    process_new_mla(os.path.join(base_dir, "skd data - Assam MLAs.csv"), "Assam", "NAME", "PARTY", "MLA, {state}", "CONSTITUENCY")
    process_new_mla(os.path.join(base_dir, "skd data - West bengal MLAs.csv"), "West Bengal", "NAME", "PARTY", "MLA, {state}", "CONSTITUENCY")
    process_new_mla(os.path.join(base_dir, "skd data - Puducherry MLAs.csv"), "Puducherry", "NAME", "PARTY", "MLA, {state}")

    # 4. SEED NEW MINISTERS
    kerala_min_path = os.path.join(base_dir, "skd data - Kerala Ministers.csv")
    if os.path.exists(kerala_min_path):
        print("\n=== Parsing NEW Kerala Ministers CSV ===")
        with open(kerala_min_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            count = 0
            for row in reader:
                if len(row) < 2 or not row[1] or "Ministry" in row[1]: continue
                name = row[0].strip()
                if not name: name = row[1].strip()
                if not name or "V D Satheeshan" in name and "Chief Minister" not in row[1]: pass
                ministry = row[1].strip()
                
                title = f"Chief Minister of Kerala" if "Chief Minister" in ministry else f"Minister, Kerala"
                d_name = "Chief Minister's Office" if "Chief Minister" in ministry else "State Council of Ministers"
                
                off_id = insert_or_update_official(name, 'Political/Elected', f"Minister of Kerala. Portfolio: {ministry}")
                d_id = get_or_create_department(d_name, 'State')
                r_id = get_or_create_region('State', "Kerala")
                
                cur.execute("INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;", (d_id, r_id, title, off_id))
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_new_min_{pos_id}", 8, 7, 7)
                count += 1
                if count % 25 == 0: conn.commit()
        print(f"Ingested {count} Kerala Ministers successfully.")
        conn.commit()

    tn_min_path = os.path.join(base_dir, "skd data - Tamil nadu ministers.csv")
    if os.path.exists(tn_min_path):
        print("\n=== Parsing NEW Tamil Nadu Ministers CSV ===")
        with open(tn_min_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            count = 0
            for row in reader:
                row = {k.strip(): v.strip() for k, v in row.items() if k is not None}
                name = row.get("Minister Name")
                ministry = row.get("Dedicated Ministry")
                party = row.get("Party")
                
                if not name or name == "Minister Name": continue
                    
                title = f"Chief Minister of Tamil Nadu" if ministry and "Chief Minister" in ministry else f"Minister, Tamil Nadu"
                d_name = "Chief Minister's Office" if ministry and "Chief Minister" in ministry else "State Council of Ministers"
                
                off_id = insert_or_update_official(name, 'Political/Elected', f"Minister of Tamil Nadu. Portfolio: {ministry}. Party: {party if party else 'N/A'}.")
                d_id = get_or_create_department(d_name, 'State')
                r_id = get_or_create_region('State', "Tamil Nadu")
                
                cur.execute("INSERT INTO positions (department_id, region_id, title, current_official_id) VALUES (%s, %s, %s, %s) RETURNING id;", (d_id, r_id, title, off_id))
                pos_id = cur.fetchone()[0]
                seed_default_rating(pos_id, off_id, f"hash_seed_new_min_{pos_id}", 8, 7, 7)
                count += 1
                if count % 25 == 0: conn.commit()
        print(f"Ingested {count} Tamil Nadu Ministers successfully.")
        conn.commit()

    print("\n==============================================================")
    print("PATCH COMPLETED: ONLY THE SPECIFIED MLAS AND MINISTERS WERE UPDATED!")
    print("==============================================================")
    conn.close()

if __name__ == "__main__":
    run_patch()
