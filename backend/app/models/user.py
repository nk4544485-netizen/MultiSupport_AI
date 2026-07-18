from pydantic import BaseModel
from typing import Optional


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "customer"


class UserLogin(BaseModel):
    email: str
    password: str