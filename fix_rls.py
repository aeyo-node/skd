import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def fix_rls():
    conn = psycopg2.connect(DB_CONN)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Fixing RLS policies to allow CRUD from anon role...")
    
    queries = [
        "DROP POLICY IF EXISTS \"Allow public all on officials\" ON officials;",
        "CREATE POLICY \"Allow public all on officials\" ON officials FOR ALL USING (true) WITH CHECK (true);",
        
        "DROP POLICY IF EXISTS \"Allow public all on positions\" ON positions;",
        "CREATE POLICY \"Allow public all on positions\" ON positions FOR ALL USING (true) WITH CHECK (true);"
    ]
    
    for q in queries:
        try:
            cur.execute(q)
            print(f"Executed: {q}")
        except Exception as e:
            print(f"Error: {e}")
            
    conn.close()
    print("Done.")

if __name__ == "__main__":
    fix_rls()
