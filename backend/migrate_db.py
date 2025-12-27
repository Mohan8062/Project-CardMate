import mysql.connector

# MySQL Connection Details (Matching your database.py)
db_config = {
    "user": "root",
    "password": "211722244062",
    "host": "localhost",
    "database": "cardmate_db"
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # Add the missing column
    print("Adding 'is_owner' column to 'businesscard' table...")
    cursor.execute("ALTER TABLE businesscard ADD COLUMN is_owner BOOLEAN DEFAULT FALSE;")
    
    conn.commit()
    print("Success! Database schema updated.")
    
except mysql.connector.Error as err:
    if err.errno == 1060:
        print("Column 'is_owner' already exists.")
    else:
        print(f"Error: {err}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
