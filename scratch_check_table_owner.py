import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def check_owner():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    
    print("Checking owner of storage.objects...")
    try:
        cur.execute("""
            SELECT tableowner 
            FROM pg_tables 
            WHERE schemaname = 'storage' AND tablename = 'objects';
        """)
        row = cur.fetchone()
        if row:
            print(f"  Owner of storage.objects: {row[0]}")
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == '__main__':
    check_owner()
