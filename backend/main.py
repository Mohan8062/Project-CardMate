from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select
import os
import uuid
import sys
from datetime import datetime
from pydantic import BaseModel
from typing import Optional, List

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

@app.delete("/users/me")
def delete_account(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    # Delete all associated cards first
    cards = session.exec(select(BusinessCard).where(BusinessCard.user_id == current_user.id)).all()
    for card in cards:
        session.delete(card)
    
    # Delete the user
    session.delete(current_user)
    session.commit()
    return {"message": "Account and all associated data deleted successfully"}

# --- Business Card Endpoints ---

@app.get("/")
def read_root():
    return {"message": "Welcome to CardMate Backend API", "status": "running"}

@app.post("/scan")
async def scan_card(
    file: UploadFile = File(...), 
    event_name: Optional[str] = Form(None),
    location_lat: Optional[float] = Form(None),
    location_lng: Optional[float] = Form(None),
    location_name: Optional[str] = Form(None),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    temp_path = f"temp_{uuid.uuid4().hex}_{file.filename}"
    try:
        with open(temp_path, "wb") as buffer:
            buffer.write(await file.read())
        
        # Call the existing ML logic
        result = extract_structured_from_image(temp_path)
        
        # Auto-Tagging Logic
        tags = []
        designation = (result.get("designation") or "").lower()
        company = (result.get("company") or "").lower()
        
        if any(x in designation for x in ["engineer", "developer", "architect", "cto", "tech"]):
            tags.append("Tech")
        if any(x in designation for x in ["ceo", "founder", "director", "president", "vp", "chief"]):
            tags.append("Executive")
        if any(x in designation for x in ["sales", "account", "business development", "rep"]):
            tags.append("Sales")
        if any(x in designation for x in ["marketing", "brand", "cmo"]):
            tags.append("Marketing")
        if any(x in designation for x in ["product", "manager"]):
            tags.append("Product")
        if any(x in designation for x in ["designer", "creative", "art", "ui", "ux"]):
            tags.append("Design")
        if "investor" in designation or "capital" in company:
            tags.append("Investor")
            
        if event_name:
            tags.append(event_name)
            
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
            user_id=current_user.id,
            # New Features
            tags=json.dumps(tags),
            event_name=event_name,
            location_lat=location_lat,
            location_lng=location_lng,
            location_name=location_name
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
    # Return cards sorted by newest first
    cards = session.exec(select(BusinessCard).where(BusinessCard.user_id == current_user.id).order_by(BusinessCard.created_at.desc())).all()
    return cards

class CardUpdate(BaseModel):
    name: Optional[str] = None
    designation: Optional[str] = None
    company: Optional[str] = None
    phones: Optional[str] = None
    emails: Optional[str] = None
    addresses: Optional[str] = None
    websites: Optional[str] = None
    notes: Optional[str] = None
    tags: Optional[str] = None
    event_name: Optional[str] = None

@app.post("/cards")
def create_card_manual(
    card_data: CardUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    import json
    new_card = BusinessCard(
        name=card_data.name or "Unnamed",
        designation=card_data.designation,
        company=card_data.company,
        phones=card_data.phones or "[]",
        emails=card_data.emails or "[]",
        websites=card_data.websites or "[]",
        addresses=card_data.addresses or "[]",
        notes=card_data.notes or "",
        tags=card_data.tags or "[]",
        event_name=card_data.event_name,
        user_id=current_user.id,
        is_owner=False # Will be set separately if needed, or by logic
    )
    session.add(new_card)
    session.commit()
    session.refresh(new_card)
    return {"message": "Card created", "data": new_card}

# --- New Feature Endpoints ---

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

# --- New Feature Endpoints ---

@app.put("/cards/{card_id}")
def update_card(
    card_id: int,
    card_data: CardUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    card = session.exec(select(BusinessCard).where(
        BusinessCard.id == card_id,
        BusinessCard.user_id == current_user.id
    )).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Update only provided fields
    if card_data.name is not None: card.name = card_data.name
    if card_data.designation is not None: card.designation = card_data.designation
    if card_data.company is not None: card.company = card_data.company
    if card_data.phones is not None: card.phones = card_data.phones
    if card_data.emails is not None: card.emails = card_data.emails
    if card_data.addresses is not None: card.addresses = card_data.addresses
    if card_data.websites is not None: card.websites = card_data.websites
    if card_data.notes is not None: card.notes = card_data.notes
    if card_data.tags is not None: card.tags = card_data.tags
    if card_data.event_name is not None: card.event_name = card_data.event_name
    
    session.add(card)
    session.commit()
    session.refresh(card)
    return {"message": "Card updated", "data": card}

@app.post("/cards/{card_id}/favorite")
def toggle_favorite(
    card_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    card = session.exec(select(BusinessCard).where(
        BusinessCard.id == card_id,
        BusinessCard.user_id == current_user.id
    )).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    card.is_favorite = not card.is_favorite
    session.add(card)
    session.commit()
    return {"message": "Favorite toggled", "is_favorite": card.is_favorite}

@app.get("/cards/{card_id}/vcard")
def export_vcard(
    card_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    card = session.exec(select(BusinessCard).where(
        BusinessCard.id == card_id,
        BusinessCard.user_id == current_user.id
    )).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    print(f"DEBUG: Exporting vCard for {card.name}")
    
    import json
    phones = json.loads(card.phones) if card.phones else []
    emails = json.loads(card.emails) if card.emails else []
    
    vcard = f"""BEGIN:VCARD
VERSION:3.0
FN:{card.name}
ORG:{card.company or ''}
TITLE:{card.designation or ''}
"""
    for phone in phones:
        vcard += f"TEL:{phone}\n"
    for email in emails:
        vcard += f"EMAIL:{email}\n"
    if card.notes:
        vcard += f"NOTE:{card.notes}\n"
    vcard += "END:VCARD"
    
    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(content=vcard, media_type="text/vcard", 
                            headers={"Content-Disposition": f"attachment; filename={card.name}.vcf"})

class UserSettings(BaseModel):
    dark_mode: Optional[bool] = None

@app.put("/users/me/settings")
def update_settings(
    settings: UserSettings,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if settings.dark_mode is not None:
        current_user.dark_mode = settings.dark_mode
    session.add(current_user)
    session.commit()
    return {"message": "Settings updated", "dark_mode": current_user.dark_mode}

@app.get("/users/me")
def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "dark_mode": current_user.dark_mode
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
