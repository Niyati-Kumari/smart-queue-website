import firebase_admin
from firebase_admin import credentials, db
import pandas as pd
from datetime import datetime
import os

# Load Firebase credentials
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred, {
    "databaseURL": "https://smartqueue-a01c6-default-rtdb.firebaseio.com"  # 🔁 Replace with your URL
})

# Path to CSV
CSV_PATH = "wait_times.csv"

# Fetch served tokens from Firebase
ref = db.reference("served_tokens")
data = ref.get()

if not data:
    print("No served token data found.")
    exit()

# Process data
rows = []
for item in data.values():
    try:
        ts = datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00"))
        rows.append({
            "hour": ts.hour,
            "day_of_week": ts.strftime("%A"),
            "is_weekend": int(ts.weekday() >= 5),
            "queue_length": int(item["queue_length"]),
            "wait_time": float(item["wait_time"])
        })
    except Exception as e:
        print("Skipping invalid item:", item, e)

# Append to CSV
df_new = pd.DataFrame(rows)

if os.path.exists(CSV_PATH):
    df_old = pd.read_csv(CSV_PATH)
    df_all = pd.concat([df_old, df_new], ignore_index=True)
else:
    df_all = df_new

df_all.to_csv(CSV_PATH, index=False)
print(f"✅ Appended {len(rows)} entries to wait_times.csv")
