import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def check():
    conn = psycopg2.connect(DB_CONN)
    cur = conn.cursor()
    
    print("Checking columns of storage.policies...")
    try:
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'storage' AND table_name = 'policies';")
        cols = cur.fetchall()
        for col in cols:
            print(f"  {col[0]}: {col[1]}")
    except Exception as e:
        print(f"Error: {e}")
        
    print("\nChecking existing records in storage.policies...")
    try:
        cur.execute("SELECT id, name, bucket_id, method, definition FROM storage.policies;")
        rows = cur.fetchall()
        for row in rows:
            print(f"  ID: {row[0]}")
            print(f"  Name: {row[1]}")
            print(f"  Bucket ID: {row[2]}")
            print(f"  Method: {row[3]}")
            print(f"  Definition: {row[4]}")
            print("-" * 40)
    except Exception as e:
        print(f"Error: {e}")
        
    conn.close()

if __name__ == '__main__':
    check()
