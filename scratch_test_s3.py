import os
import boto3
from botocore.config import Config

# S3 Settings
s3_endpoint = "https://jnahyrcjzuewyujdhdix.supabase.co/storage/v1/s3"
access_key = "c61036e9a8c7ea08534db9a1c6f03b22"
secret_key = "1a8001e67e84d36e526b7bab8d2c7598e5bce387cca16d8493999e4b6f7a2f59"

s3 = boto3.client(
    "s3",
    endpoint_url=s3_endpoint,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key,
    region_name="us-east-1", # Supabase storage is compatible with any region, us-east-1 is standard
    config=Config(signature_version="s3v4")
)

try:
    print("Listing buckets...")
    res = s3.list_buckets()
    print("Buckets found:")
    for b in res.get("Buckets", []):
        print(f" - {b['Name']}")
except Exception as e:
    print(f"Error: {e}")
