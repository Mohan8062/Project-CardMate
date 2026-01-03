from sqlmodel import create_engine, text
import os
import sys
from dotenv import load_dotenv

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# Load database settings
load_dotenv()
MYSQL_USER = os.getenv("DB_USER", "root")
MYSQL_PASSWORD = os.getenv("DB_PASSWORD", "")
MYSQL_HOST = os.getenv("DB_HOST", "localhost")
MYSQL_PORT = os.getenv("DB_PORT", "3306")
MYSQL_DB = os.getenv("DB_NAME", "cardmate_db")

DATABASE_URL = f"mysql+mysqlconnector://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
engine = create_engine(DATABASE_URL)

def run_migrations():
    print(f"Connecting to {MYSQL_DB} on {MYSQL_HOST}...")
    with engine.connect() as connection:
        columns_to_add = [
            ("tags", "TEXT", "NULL"),
            ("event_name", "VARCHAR(255)", "NULL"),
            ("location_lat", "DOUBLE", "NULL"),
            ("location_lng", "DOUBLE", "NULL"),
            ("location_name", "VARCHAR(255)", "NULL")
        ]

        for col_name, col_type, col_extra in columns_to_add:
            try:
                print(f"Adding column '{col_name}'...")
                query = text(f"ALTER TABLE businesscard ADD COLUMN {col_name} {col_type} {col_extra}")
                connection.execute(query)
                print(f"Successfully added '{col_name}'.")
            except Exception as e:
                err_msg = str(e).lower()
                if "duplicate column" in err_msg or "already exists" in err_msg or "1060" in err_msg:
                    print(f"Column '{col_name}' already exists.")
                else:
                    print(f"Error adding '{col_name}': {e}")
        
        connection.commit()
    print("Migration complete.")

if __name__ == "__main__":
    run_migrations()
