import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def change_owner():
    conn = psycopg2.connect(DB_CONN)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Trying to change owner of storage.objects to postgres...")
    try:
        cur.execute("ALTER TABLE storage.objects OWNER TO postgres;")
        print("  [+] Successfully changed owner of storage.objects to postgres!")
    except Exception as e:
        print(f"  [!] Failed to change owner: {e}")
        
    conn.close()

if __name__ == '__main__':
    change_owner()
