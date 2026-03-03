import hmac
import hashlib
import json
import urllib.request
import urllib.error

secret = b"gym_mitra_secret_2026"
payload = json.dumps({
    "type": "UPDATE",
    "table": "users",
    "schema": "auth",
    "record": {
        "id": "e903a4b0-a548-4fb6-82ae-9bc6833fe6b9", 
        "email": "test@example.com",
        "email_confirmed_at": "2026-03-03T10:00:00Z",
        "raw_user_meta_data": {
            "name": "Local Test User"
        }
    },
    "old_record": {
        "id": "e903a4b0-a548-4fb6-82ae-9bc6833fe6b9",
        "email": "test@example.com",
        "email_confirmed_at": None,
        "raw_user_meta_data": {
            "name": "Local Test User"
        }
    }
}).encode('utf-8')

# Create signature
signature = hmac.new(secret, payload, hashlib.sha256).hexdigest()

try:
    req = urllib.request.Request(
        "http://localhost:3000/api/webhooks/onboarding", 
        data=payload, 
        headers={
            "Content-Type": "application/json",
            "x-supabase-signature": signature
        },
        method="POST"
    )
    with urllib.request.urlopen(req) as response:
        print(f"Status: {response.status}")
        print(response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print(f"Error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Connection error: {e}")
