import os
import re
import requests
import io
import hashlib
from PIL import Image

def load_env():
    env = {}
    env_path = r"c:\Users\chris\Documents\public acc platform\.env.local"
    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    parts = line.split('=', 1)
                    if len(parts) == 2:
                        env[parts[0].strip()] = parts[1].strip()
    return env

def process_and_upload_photo(env, name_for_filename, image_url):
    print(f"Testing photo download/crop/upload for: {name_for_filename}")
    print(f"Source URL: {image_url}")
    
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        print("  --> Downloading...")
        r = requests.get(image_url, headers=headers, timeout=10)
        print(f"  --> Status Code: {r.status_code}")
        if r.status_code != 200:
            print("  [!] Failed to download")
            return None
            
        print("  --> Cropping and resizing...")
        img = Image.open(io.BytesIO(r.content))
        print(f"  --> Original Size: {img.size}, Mode: {img.mode}")
        if img.mode in ('RGBA', 'LA', 'P'):
            img = img.convert('RGB')
            
        width, height = img.size
        min_dim = min(width, height)
        left = (width - min_dim) / 2
        top = (height - min_dim) / 2
        right = (width + min_dim) / 2
        bottom = (height + min_dim) / 2
        
        cropped = img.crop((left, top, right, bottom))
        resized = cropped.resize((300, 300), Image.Resampling.LANCZOS)
        print(f"  --> Resized to: {resized.size}")
        
        img_bytes = io.BytesIO()
        resized.save(img_bytes, format='JPEG', quality=90)
        img_data = img_bytes.getvalue()
        
        safe_name = re.sub(r'[^a-zA-Z0-9]', '_', name_for_filename).lower()
        url_hash = hashlib.md5(image_url.encode('utf-8')).hexdigest()[:8]
        file_name = f"{safe_name}_{url_hash}.jpg"
        print(f"  --> Local safe filename: {file_name}")
        
        supabase_url = env.get('NEXT_PUBLIC_SUPABASE_URL')
        service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
        print(f"  --> Supabase URL: {supabase_url}")
        print(f"  --> Service Key length: {len(service_key) if service_key else 0}")
        
        upload_url = f"{supabase_url}/storage/v1/object/official-photos/{file_name}"
        upload_headers = {
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "image/jpeg",
            "x-upsert": "true"
        }
        
        print("  --> Uploading to Supabase Storage...")
        up_res = requests.post(upload_url, headers=upload_headers, data=img_data, timeout=15)
        print(f"  --> Upload Status Code: {up_res.status_code}")
        print(f"  --> Upload Response Body: {up_res.text}")
        
        if up_res.status_code in (200, 201):
            public_url = f"{supabase_url}/storage/v1/object/public/official-photos/{file_name}"
            print(f"  [+] Success! URL: {public_url}")
            return public_url
        else:
            return None
    except Exception as e:
        print(f"  [!] Exception: {e}")
        import traceback
        traceback.print_exc()
        return None

env = load_env()
test_url = "https://static.india.gov.in/npiprod/uploads/nara_chandrababu_naidu_7fda13c909.jpg"
process_and_upload_photo(env, "Shri N. Chandrababu Naidu", test_url)
