import os
from supabase import create_client, Client
# Initialization of Supabase client goes here
url: str = os.environ.get("SUPABASE_URL")
if not url:
    raise ValueError("SUPABASE_URL environment variable is required")

key: str = os.environ.get("SUPABASE_KEY")
if not key:
    raise ValueError("SUPABASE_KEY environment variable is required")
supabase: Client = create_client(url, key)