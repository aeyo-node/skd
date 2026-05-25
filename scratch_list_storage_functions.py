import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def list_functions():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    
    print("Listing functions in storage schema...")
    try:
        cur.execute("""
            SELECT routine_name, data_type 
            FROM information_schema.routines 
            WHERE routine_schema = 'storage';
        """)
        funcs = cur.fetchall()
        for f in funcs:
            print(f"  {f[0]}: {f[1]}")
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == '__main__':
    list_functions()
