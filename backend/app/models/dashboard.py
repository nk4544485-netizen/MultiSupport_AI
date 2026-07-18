from pydantic import BaseModel
from typing import Dict, Any

class AgentStats(BaseModel):
    agent_name: str
    total_tickets: int
    open_tickets: int
    resolved_tickets: int

class DashboardMetrics(BaseModel):
    total_tickets: int
    tickets_by_status: Dict[str, int]
    agent_stats: list[AgentStats]
    sentiment_stats: Dict[str, int] = {}
    sla_breaches: int = 0
    total_users: int = 0
    total_chats: int = 0
    daily_chats: Dict[str, int] = {}
    avg_confidence: float = 0.0
    avg_csat: float = 0.0

