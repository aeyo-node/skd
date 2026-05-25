import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def check():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    
    print("Checking policies on storage.objects in pg_policies...")
    try:
        cur.execute("SELECT policyname, tablename, roles, cmd, qual, with_check FROM pg_policies WHERE schemaname = 'storage';")
        rows = cur.fetchall()
        for r in rows:
            print(f"  Policy Name: {r[0]}")
            print(f"  Table Name: {r[1]}")
            print(f"  Roles: {r[2]}")
            print(f"  Command (CMD): {r[3]}")
            print(f"  Qual: {r[4]}")
            print(f"  With Check: {r[5]}")
            print("-" * 40)
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == '__main__':
    check()
