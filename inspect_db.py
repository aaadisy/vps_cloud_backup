import sqlite3

db_path = r'c:\Users\supri\Documents\traumhosting\vps_cloud_backup\vps_cloud_backup.sqlite'
try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    print("Tables:", cursor.fetchall())
    conn.close()
except Exception as e:
    print(f"Error: {e}")
