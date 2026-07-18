from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DocumentMetadata(BaseModel):
    id: str
    filename: str
    uploaded_by: str
    department: str
    status: str # e.g. "Processing", "Indexed", "Failed"
    uploaded_at: datetime
    error_message: Optional[str] = None
