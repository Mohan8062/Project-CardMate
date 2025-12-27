from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os
import uuid
import sys
from datetime import datetime
from pydantic import BaseModel

# Add the project root to sys.path so we can import ml_ocr
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from .database import init_db, get_session
from .models import BusinessCard, User
from .auth import get_password_hash, verify_password, create_access_token, get_current_user
from ml_ocr.ocr import extract_structured_from_image
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    print("Database initialized successfully.")
    yield

app = FastAPI(title="CardMate API", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication Models ---
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# --- Auth Endpoints ---

@app.post("/register")
def register(user_data: UserRegister, session: Session = Depends(get_session)):
    # Check if user exists
    existing_user = session.exec(select(User).where(User.email == user_data.email)).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password)
    )
    session.add(new_user)
    session.commit()
    session.refresh(new_user)
    
    token = create_access_token(data={"sub": new_user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"username": new_user.username, "email": new_user.email}}

@app.post("/login")
def login(login_data: UserLogin, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.email == login_data.email)).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token(data={"sub": user.email})
    return {"access_token": token, "token_type": "bearer", "user": {"username": user.username, "email": user.email}}

# --- Business Card Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to CardMate Backend API", "status": "running"}

@app.post("/scan")
async def scan_card(
    file: UploadFile = File(...), 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    temp_path = f"temp_{uuid.uuid4().hex}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Call the existing ML logic
        result = extract_structured_from_image(temp_path)
        
        # Create and save BusinessCard associated with current user
        import json
        card = BusinessCard(
            name=result.get("name", "Unknown"),
            designation=result.get("designation"),
            company=result.get("company"),
            phones=json.dumps(result.get("phones", [])),
            emails=json.dumps(result.get("emails", [])),
            addresses=json.dumps(result.get("addresses", [])),
            websites=json.dumps(result.get("websites", [])),
            ocr_avg_confidence=result.get("ocr_avg_confidence", 0.0),
            user_id=current_user.id
        )
        
        session.add(card)
        session.commit()
        session.refresh(card)
        
        return {"data": card}
        
    except Exception as e:
        print(f"Error during scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.get("/cards")
def get_all_cards(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only return cards belonging to the logged-in user
    cards = session.exec(select(BusinessCard).where(BusinessCard.user_id == current_user.id)).all()
    return cards

@app.delete("/cards/{card_id}")
def delete_card(
    card_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    card = session.exec(select(BusinessCard).where(
        BusinessCard.id == card_id, 
        BusinessCard.user_id == current_user.id
    )).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or not authorized")
    
    session.delete(card)
    session.commit()
    return {"message": "Card deleted successfully"}

@app.post("/cards/{card_id}/set-owner")
def set_owner(
    card_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Unset existing owners FOR THIS USER
    existing_owners = session.exec(select(BusinessCard).where(
        BusinessCard.is_owner == True,
        BusinessCard.user_id == current_user.id
    )).all()
    
    for owner in existing_owners:
        owner.is_owner = False
        session.add(owner)
    
    # Set new owner IF it belongs to the user
    card = session.exec(select(BusinessCard).where(
        BusinessCard.id == card_id,
        BusinessCard.user_id == current_user.id
    )).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found or not authorized")
    
    card.is_owner = True
    session.add(card)
    session.commit()
    return {"message": "Card set as owner"}

@app.post("/cards/clear")
def clear_all_cards(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Only delete cards for this user
    cards = session.exec(select(BusinessCard).where(BusinessCard.user_id == current_user.id)).all()
    for card in cards:
        session.delete(card)
    session.commit()
    return {"message": "All your cards cleared successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
