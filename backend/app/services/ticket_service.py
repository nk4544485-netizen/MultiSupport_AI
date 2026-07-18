import random
from datetime import datetime

def generate_ticket(agent):
    now_str = str(datetime.utcnow())
    ticket = {
        "ticket_id": f"MS-{random.randint(10000,99999)}",
        "department": agent,
        "agent": agent,
        "status": "Open",
        "priority": "Normal",
        "sentiment": "Neutral",
        "timeline": [
            {
                "status": "Open",
                "message": "Ticket created automatically by AI Support routing.",
                "timestamp": now_str
            }
        ],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    return ticket