from fastapi import APIRouter, Query, HTTPException, Header
from app.database.mongodb import tickets, chat_history
from app.models.ticket import TicketStatusUpdate, TicketPriorityUpdate, TicketAssignUpdate, TicketRatingUpdate
from datetime import datetime
from app.api.websocket import manager as ws_manager
from app.auth.jwt_handler import check_role
import asyncio

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

@router.get("/tickets")
def get_tickets(
    email: str = Query(None),
    status: str = Query(None),
    agent: str = Query(None),
    priority: str = Query(None),
    sentiment: str = Query(None),
    search: str = Query(None),
    sla_breached: bool = Query(None),
    authorization: str = Header(None)
):
    # Enforce Role Security
    check_role(authorization, ["admin", "agent"])

    query = {}

    if email:
        query["email"] = {"$regex": email, "$options": "i"}

    if status:
        query["status"] = status

    if agent:
        query["agent"] = agent

    if priority:
        query["priority"] = priority

    if sentiment:
        query["sentiment"] = sentiment

    if search:
        query["$or"] = [
            {"ticket_id": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"user_message": {"$regex": search, "$options": "i"}},
            {"department": {"$regex": search, "$options": "i"}}
        ]

    if sla_breached is not None:
        now = datetime.utcnow()
        if sla_breached:
            query["sla_deadline"] = {"$lt": now}
            query["status"] = {"$nin": ["resolved", "Resolved", "closed", "Closed"]}
        else:
            query["$or"] = [
                {"sla_deadline": {"$gte": now}},
                {"status": {"$in": ["resolved", "Resolved", "closed", "Closed"]}},
                {"sla_deadline": None}
            ]

    all_tickets = list(
        tickets.find(query, {"_id": 0}).sort("created_at", -1)
    )

    return {
        "success": True,
        "count": len(all_tickets),
        "tickets": all_tickets
    }

@router.get("/ticket/{ticket_id}")
def get_ticket_details(ticket_id: str, authorization: str = Header(None)):
    # Enforce Role Security
    check_role(authorization, ["admin", "agent"])

    ticket = tickets.find_one({"ticket_id": ticket_id}, {"_id": 0})
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
        
    # Also fetch the customer's chat logs for context
    customer_email = ticket.get("email")
    logs = []
    if customer_email:
        logs = list(chat_history.find({"email": customer_email}, {"_id": 0}).sort("timestamp", 1).limit(50))

    return {
        "success": True,
        "ticket": ticket,
        "chat_logs": logs
    }

@router.put("/ticket/{ticket_id}/resolve")
def resolve_ticket(ticket_id: str, authorization: str = Header(None)):
    # Enforce Role Security
    check_role(authorization, ["admin", "agent"])

    now_str = str(datetime.utcnow())
    timeline_entry = {
        "status": "Resolved",
        "message": "Ticket resolved by administrator",
        "timestamp": now_str
    }
    
    result = tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {"status": "Resolved", "updated_at": datetime.utcnow()},
            "$push": {"timeline": timeline_entry}
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    asyncio.create_task(ws_manager.broadcast({
        "type": "TICKET_UPDATED",
        "message": f"Ticket {ticket_id} resolved",
        "ticket_id": ticket_id,
        "status": "Resolved"
    }))

    return {
        "success": True, 
        "message": "Ticket resolved successfully",
        "timeline_entry": timeline_entry
    }

@router.put("/ticket/{ticket_id}/status")
def update_ticket_status(ticket_id: str, payload: TicketStatusUpdate, authorization: str = Header(None)):
    # Enforce Role Security
    check_role(authorization, ["admin", "agent", "customer"])

    now_str = str(datetime.utcnow())
    timeline_entry = {
        "status": payload.status,
        "message": f"Status updated to {payload.status}",
        "timestamp": now_str
    }
    
    result = tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {"status": payload.status, "updated_at": datetime.utcnow()},
            "$push": {"timeline": timeline_entry}
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    asyncio.create_task(ws_manager.broadcast({
        "type": "TICKET_UPDATED",
        "message": f"Ticket {ticket_id} status updated to {payload.status}",
        "ticket_id": ticket_id,
        "status": payload.status
    }))

    return {
        "success": True, 
        "message": f"Ticket status updated to {payload.status}",
        "timeline_entry": timeline_entry
    }

@router.put("/ticket/{ticket_id}/priority")
def update_ticket_priority(ticket_id: str, payload: TicketPriorityUpdate, authorization: str = Header(None)):
    # Enforce Role Security
    check_role(authorization, ["admin", "agent"])

    now_str = str(datetime.utcnow())
    timeline_entry = {
        "status": "Priority Changed",
        "message": f"Priority updated to {payload.priority}",
        "timestamp": now_str
    }
    
    result = tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {"priority": payload.priority, "updated_at": datetime.utcnow()},
            "$push": {"timeline": timeline_entry}
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    asyncio.create_task(ws_manager.broadcast({
        "type": "TICKET_UPDATED",
        "message": f"Ticket {ticket_id} priority changed to {payload.priority}",
        "ticket_id": ticket_id
    }))

    return {
        "success": True, 
        "message": f"Ticket priority updated to {payload.priority}",
        "timeline_entry": timeline_entry
    }

@router.put("/ticket/{ticket_id}/assign")
def assign_ticket(ticket_id: str, payload: TicketAssignUpdate, authorization: str = Header(None)):
    # Enforce Role Security
    check_role(authorization, ["admin", "agent"])

    now_str = str(datetime.utcnow())
    timeline_entry = {
        "status": "Assigned",
        "message": f"Ticket assigned to agent {payload.agent}",
        "timestamp": now_str
    }
    
    result = tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {"agent": payload.agent, "updated_at": datetime.utcnow()},
            "$push": {"timeline": timeline_entry}
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    asyncio.create_task(ws_manager.broadcast({
        "type": "TICKET_UPDATED",
        "message": f"Ticket {ticket_id} assigned to {payload.agent}",
        "ticket_id": ticket_id
    }))

    return {
        "success": True, 
        "message": f"Ticket assigned to {payload.agent}",
        "timeline_entry": timeline_entry
    }

@router.put("/ticket/{ticket_id}/rate")
def rate_ticket(ticket_id: str, payload: TicketRatingUpdate, authorization: str = Header(None)):
    # Enforce Role Security
    check_role(authorization, ["customer", "admin", "agent"])

    result = tickets.update_one(
        {"ticket_id": ticket_id},
        {
            "$set": {
                "rating": payload.rating, 
                "feedback": payload.feedback, 
                "updated_at": datetime.utcnow()
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Ticket not found")

    return {"success": True, "message": "Ticket rated successfully"}