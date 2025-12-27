from sqlmodel import SQLModel, Field, Relationship
from typing import List, Optional
from datetime import datetime
import json

class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str
    email: str = Field(unique=True, index=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Relationship to cards
    cards: List["BusinessCard"] = Relationship(back_populates="user")

class BusinessCard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    designation: Optional[str] = None
    company: Optional[str] = None
    
    # JSON strings for lists
    phones: str = Field(default="[]")
    emails: str = Field(default="[]")
    addresses: str = Field(default="[]")
    websites: str = Field(default="[]")
    
    ocr_avg_confidence: float = 0.0
    is_owner: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Foreign key to User
    user_id: Optional[int] = Field(default=None, foreign_key="user.id")
    user: Optional[User] = Relationship(back_populates="cards")

    def get_phones(self) -> List[str]:
        return json.loads(self.phones)

    def get_emails(self) -> List[str]:
        return json.loads(self.emails)

    def get_addresses(self) -> List[str]:
        return json.loads(self.addresses)

    def get_websites(self) -> List[str]:
        return json.loads(self.websites)
