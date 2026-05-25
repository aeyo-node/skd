import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def list_tables():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    
    print("Listing tables in storage schema...")
    try:
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'storage';")
        tables = cur.fetchall()
        for t in tables:
            print(f"  {t[0]}")
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == '__main__':
    list_tables()
