import os

from dotenv import load_dotenv
from supabase import Client, create_client

load_dotenv()

# Initialization of Supabase client goes here
url = os.getenv("SUPABASE_URL")
if not url:
    raise ValueError("SUPABASE_URL environment variable is required")

key = os.getenv("SUPABASE_KEY")
if not key:
    raise ValueError("SUPABASE_KEY environment variable is required")
supabase: Client = create_client(url, key)

# Debugging output to confirm connection type
if "127.0.0.1" in url:
    print("Connected to local Supabase instance.")

elif "supabase.co" in url:
    print("Connected to remote Supabase instance.")
