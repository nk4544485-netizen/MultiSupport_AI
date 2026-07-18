from fastapi import APIRouter, Header, HTTPException
from app.models.chat import ChatRequest
from app.services.groq_service import ask_groq
from app.database.mongodb import chat_history, tickets
from app.auth.jwt_handler import verify_token
from app.services.agent_router import detect_agent
from app.services.prompt_manager import get_prompt
from app.services.ticket_service import generate_ticket
from app.services.rag_service import search_knowledge_base
from app.services.email_service import send_ticket_email
from app.services.whatsapp_service import send_whatsapp_notification
from app.services.sentiment_service import analyze_sentiment
from app.api.websocket import manager as ws_manager
import asyncio
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


from fastapi import APIRouter, Header, HTTPException, Query
from app.models.chat import ChatRequest, ConversationTitleUpdate
from app.services.groq_service import ask_groq
from app.database.mongodb import chat_history, tickets, conversations
from app.auth.jwt_handler import verify_token
from app.services.agent_router import detect_agent
from app.services.prompt_manager import get_prompt
from app.services.ticket_service import generate_ticket
from app.services.rag_service import search_knowledge_base
from app.services.email_service import send_ticket_email
from app.services.whatsapp_service import send_whatsapp_notification
from app.services.sentiment_service import analyze_sentiment
from app.api.websocket import manager as ws_manager
import asyncio
import uuid
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

def generate_conversation_title(message: str) -> str:
    try:
        prompt = f"Create a short, concise 3 to 5 word title summarizing this customer request: '{message}'. Respond with just the title, no quotes or explanation."
        title = ask_groq(prompt).strip().strip('"').strip("'")
        if not title or len(title) > 60:
            return message[:30] + "..."
        return title
    except Exception:
        return message[:30] + "..."

@router.post("/")
def chat(
    data: ChatRequest,
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    # Handle Conversation ID
    conversation_id = data.conversation_id
    if not conversation_id:
        conversation_id = str(uuid.uuid4())
        title = generate_conversation_title(data.message)
        conversations.insert_one({
            "conversation_id": conversation_id,
            "email": user["email"],
            "title": title,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        })
    else:
        # Check if conversation exists
        conv = conversations.find_one({"conversation_id": conversation_id, "email": user["email"]})
        if not conv:
            # Create if passed but not exists
            title = generate_conversation_title(data.message)
            conversations.insert_one({
                "conversation_id": conversation_id,
                "email": user["email"],
                "title": title,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            })

    # Detect department
    agent = detect_agent(data.message)

    # Fetch context from Vector DB based on the department and query
    try:
        rag_context = search_knowledge_base(data.message, agent)
    except Exception as e:
        print(f"RAG Error: {e}")
        rag_context = ""
        print("\n========== RAG DEBUG ==========")
        print("Department:", agent)
        print("User Question:", data.message)
        print("RAG Context:")
        print(rag_context)
        print("================================\n")

    # Fetch last 5 messages for conversation memory context
    history_messages = []
    if conversation_id:
        prev_logs = list(chat_history.find(
            {"conversation_id": conversation_id, "email": user["email"]},
            {"_id": 0}
        ).sort("timestamp", -1).limit(5))
        # reverse to chronological order
        prev_logs.reverse()
        for log in prev_logs:
            if log.get("user_message"):
                history_messages.append({"role": "user", "content": log["user_message"]})
            if log.get("ai_reply"):
                history_messages.append({"role": "assistant", "content": log["ai_reply"]})

    # Append current message
    history_messages.append({"role": "user", "content": data.message})

    # Load default prompt and department company knowledge
    from app.services.knowledge_service import load_knowledge
    from app.prompts.billing_prompt import billing_prompt
    from app.prompts.technical_prompt import technical_prompt
    from app.prompts.sales_prompt import sales_prompt
    from app.prompts.general_prompt import general_prompt

    prompts = {
        "Billing": billing_prompt,
        "Technical": technical_prompt,
        "Sales": sales_prompt,
        "General": general_prompt,
    }
    dept_base_prompt = prompts.get(agent, general_prompt)
    dept_knowledge = load_knowledge(agent)

    system_prompt = f"""{dept_base_prompt}

Company Knowledge (Static):
{dept_knowledge}

Additional Knowledge Base Context (Dynamic RAG):
{rag_context if rag_context else "No additional context found."}

Strict Grounding Instructions:
1. Base your answer strictly on the Company Knowledge and Additional Knowledge Base Context.
2. Anti-Hallucination: If the answer is not present in the context, politely say "I'm sorry, I don't have that information in my knowledge base." Do not guess.
3. Citation: Quote the source file if mentioned in the context (e.g. "[Source: filename]").
4. Confidence Score: You MUST end your response on a new line with exactly: "Confidence Score: [value]" (e.g. "Confidence Score: 95").
"""

    # AI response
    raw_reply = ask_groq(history_messages, system_prompt=system_prompt)

    # Parse reply and confidence score
    import re
    confidence = 100
    match = re.search(r"Confidence Score:\s*(\d+)", raw_reply, re.IGNORECASE)
    reply = raw_reply
    if match:
        confidence = int(match.group(1))
        reply = re.sub(r"\n*Confidence Score:\s*\d+", "", raw_reply, flags=re.IGNORECASE).strip()

    # Create ticket only if required
    ticket = None
    keywords = [
        "refund", "payment", "failed", "error", "bug", "cancel", "complaint", "problem", "issue"
    ]

    if any(word in data.message.lower() for word in keywords):
        # Analyze sentiment
        sentiment = analyze_sentiment(data.message)
        
        # Calculate Priority & SLA
        if sentiment == "Negative":
            priority = "High"
            sla_hours = 4
        else:
            priority = "Normal"
            sla_hours = 24

        ticket = generate_ticket(agent)
        ticket["email"] = user["email"]
        ticket["user_message"] = data.message
        ticket["sentiment"] = sentiment
        ticket["priority"] = priority
        ticket["sla_deadline"] = datetime.utcnow() + timedelta(hours=sla_hours)

        tickets.insert_one(ticket.copy())

       

        # Send External Notifications (Mocked)
        send_ticket_email(user["email"], ticket["ticket_id"], agent)
        send_whatsapp_notification("+1234567890", f"Your MultiSupport ticket {ticket['ticket_id']} has been created.")

    # Save chat message
    chat_history.insert_one({
        "conversation_id": conversation_id,
        "email": user["email"],
        "agent": agent,
        "ticket": ticket,
        "user_message": data.message,
        "ai_reply": reply,
        "confidence_score": confidence,
        "timestamp": datetime.utcnow()
    })

    # Update conversation's updated_at
    conversations.update_one(
        {"conversation_id": conversation_id},
        {"$set": {"updated_at": datetime.utcnow()}}
    )

    return {
        "success": True,
        "conversation_id": conversation_id,
        "agent": agent,
        "ticket": ticket,
        "reply": reply
    }

@router.get("/conversations")
def get_conversations(authorization: str = Header(None)):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization token missing")
    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid Token")

    convs = list(conversations.find({"email": user["email"]}, {"_id": 0}).sort("updated_at", -1))
    return {"success": True, "conversations": convs}

@router.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: str,
    limit: int = Query(20, ge=1, le=100),
    skip: int = Query(0, ge=0),
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization token missing")
    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid Token")

    # Fetch messages in conversation (chronological order)
    messages = list(chat_history.find(
        {"conversation_id": conversation_id, "email": user["email"]},
        {"_id": 0}
    ).sort("timestamp", 1).skip(skip).limit(limit))

    total = chat_history.count_documents({"conversation_id": conversation_id, "email": user["email"]})

    return {
        "success": True,
        "total": total,
        "limit": limit,
        "skip": skip,
        "messages": messages
    }

@router.put("/conversations/{conversation_id}/title")
def update_conversation_title(
    conversation_id: str,
    payload: ConversationTitleUpdate,
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization token missing")
    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid Token")

    result = conversations.update_one(
        {"conversation_id": conversation_id, "email": user["email"]},
        {"$set": {"title": payload.title, "updated_at": datetime.utcnow()}}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return {"success": True, "message": "Title updated successfully"}

@router.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(status_code=401, detail="Authorization token missing")
    token = authorization.replace("Bearer ", "")
    user = verify_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid Token")

    # Delete conversation record
    result = conversations.delete_one({"conversation_id": conversation_id, "email": user["email"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Delete history
    chat_history.delete_many({"conversation_id": conversation_id, "email": user["email"]})

    return {"success": True, "message": "Conversation deleted successfully"}

@router.get("/history")
def get_chat_history(
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    chats = list(
        chat_history.find(
            {"email": user["email"]},
            {"_id": 0}
        ).sort("timestamp", 1)
    )

    return {
        "success": True,
        "history": chats
    }

@router.get("/search")
def search_chat_history(
    query: str,
    authorization: str = Header(None)
):
    if authorization is None:
        raise HTTPException(
            status_code=401,
            detail="Authorization token missing"
        )

    token = authorization.replace("Bearer ", "")
    user = verify_token(token)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

    search_filter = {
        "email": user["email"],
        "$or": [
            {"user_message": {"$regex": query, "$options": "i"}},
            {"ai_reply": {"$regex": query, "$options": "i"}}
        ]
    }

    chats = list(
        chat_history.find(
            search_filter,
            {"_id": 0}
        )
    )

    return {
        "success": True,
        "count": len(chats),
        "results": chats
    }