from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ConversationTitleUpdate(BaseModel):
    title: str