from sqlmodel import create_engine, SQLModel, Session
import os

# MySQL Connection Details
# Format: mysql+mysqlconnector://user:password@host:port/database
# Change these to match your local MySQL setup
MYSQL_USER = "root"
MYSQL_PASSWORD = "211722244062" # Add your password here
MYSQL_HOST = "localhost"
MYSQL_PORT = "3306"
MYSQL_DB = "cardmate_db"

DATABASE_URL = f"mysql+mysqlconnector://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"

# Fallback to SQLite if needed for testing (Optional)
# DATABASE_URL = "sqlite:///./database/app.db"

engine = create_engine(DATABASE_URL, echo=True)

def init_db():
    # Make sure your MySQL server is running and the database 'cardmate_db' exists
    # If using local MySQL, run: CREATE DATABASE cardmate_db;
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
