import psycopg2

DB_CONN = "postgresql://postgres:qIYsiyPHqcfir7GA@db.jnahyrcjzuewyujdhdix.supabase.co:5432/postgres"

def fix():
    print("Connecting to Supabase PostgreSQL database to create storage policies...")
    try:
        conn = psycopg2.connect(DB_CONN)
        conn.autocommit = True
        cur = conn.cursor()
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        return

    # Let's delete existing conflicting policies on storage.objects for 'official-photos' bucket and create clean ones.
    # Note: Supabase stores policies in storage.policies table, but in newer versions they can be standard PostgreSQL Row Level Security policies on storage.objects.
    # Let's run raw SQL to create policies on storage.objects.
    print("Creating policies on storage.objects for official-photos bucket...")
    try:
        # Enable RLS (it should already be enabled)
        cur.execute("ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;")
        
        # Drop old policies if any
        cur.execute("DROP POLICY IF EXISTS \"Allow public select on official-photos\" ON storage.objects;")
        cur.execute("DROP POLICY IF EXISTS \"Allow anyone to upload\" ON storage.objects;")
        cur.execute("DROP POLICY IF EXISTS \"Allow anyone to update\" ON storage.objects;")
        
        # Create SELECT policy
        cur.execute("""
            CREATE POLICY "Allow public select on official-photos" ON storage.objects
            FOR SELECT TO public
            USING (bucket_id = 'official-photos');
        """)
        print("  [+] Created SELECT policy.")

        # Create INSERT policy
        cur.execute("""
            CREATE POLICY "Allow anyone to upload" ON storage.objects
            FOR INSERT TO public
            WITH CHECK (bucket_id = 'official-photos');
        """)
        print("  [+] Created INSERT policy.")

        # Create UPDATE policy
        cur.execute("""
            CREATE POLICY "Allow anyone to update" ON storage.objects
            FOR UPDATE TO public
            USING (bucket_id = 'official-photos')
            WITH CHECK (bucket_id = 'official-photos');
        """)
        print("  [+] Created UPDATE policy.")
        
        print("Storage policies fixed successfully!")
    except Exception as e:
        print(f"Error executing policy SQL: {e}")
        
    conn.close()

if __name__ == '__main__':
    fix()
