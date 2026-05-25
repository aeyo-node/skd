import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def disable_rls():
    conn = psycopg2.connect(DB_CONN)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Trying to disable RLS on storage.objects...")
    try:
        cur.execute("ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;")
        print("  [+] Successfully disabled RLS on storage.objects!")
    except Exception as e:
        print(f"  [!] Failed to disable RLS: {e}")
        
    conn.close()

if __name__ == '__main__':
    disable_rls()
