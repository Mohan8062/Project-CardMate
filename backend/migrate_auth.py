import mysql.connector

# MySQL Connection Details
db_config = {
    "user": "root",
    "password": "211722244062",
    "host": "localhost",
    "database": "cardmate_db"
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    # 1. Create User table
    print("Creating 'user' table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        hashed_password VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. Add user_id column to businesscard table
    print("Adding 'user_id' column to 'businesscard' table...")
    try:
        cursor.execute("ALTER TABLE businesscard ADD COLUMN user_id INT;")
        cursor.execute("ALTER TABLE businesscard ADD CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES user(id);")
    except mysql.connector.Error as err:
        if err.errno == 1060: # Duplicate column name
            print("Column 'user_id' already exists.")
        else:
            print(f"Error adding column: {err}")
            
    conn.commit()
    print("Success! Authentication schema implemented.")
    
except mysql.connector.Error as err:
    print(f"Database Error: {err}")
finally:
    if 'conn' in locals() and conn.is_connected():
        cursor.close()
        conn.close()
