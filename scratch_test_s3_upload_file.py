import boto3
from botocore.config import Config

s3_endpoint = "https://jnahyrcjzuewyujdhdix.supabase.co/storage/v1/s3"
access_key = "c61036e9a8c7ea08534db9a1c6f03b22"
secret_key = "1a8001e67e84d36e526b7bab8d2c7598e5bce387cca16d8493999e4b6f7a2f59"

s3 = boto3.client(
    "s3",
    endpoint_url=s3_endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name="us-east-1",
    config=Config(signature_version="s3v4")
)

try:
    print("Uploading file...")
    s3.put_object(
        Bucket="official-photos",
        Key="test_boto3.txt",
        Body=b"Hello from boto3 on Public Acc Platform!",
        ContentType="text/plain"
    )
    print("Upload successful!")
    
    # Try fetching public url
    import requests
    url = "https://jnahyrcjzuewyujdhdix.supabase.co/storage/v1/object/public/official-photos/test_boto3.txt"
    r = requests.get(url)
    print(f"Fetch status: {r.status_code}")
    print(f"Fetch content: {r.text}")
except Exception as e:
    print(f"Error: {e}")
