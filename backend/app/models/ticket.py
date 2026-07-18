from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class TicketStatusUpdate(BaseModel):
    status: str

class TicketPriorityUpdate(BaseModel):
    priority: str

class TicketAssignUpdate(BaseModel):
    agent: str

class TicketRatingUpdate(BaseModel):
    rating: int
    feedback: Optional[str] = None

class TicketModel(BaseModel):
    ticket_id: str
    email: str
    user_message: str
    agent: str
    status: str
    priority: Optional[str] = "Normal"
    sentiment: Optional[str] = "Neutral"
    sla_deadline: Optional[datetime] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    timeline: Optional[List[Dict[str, Any]]] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

