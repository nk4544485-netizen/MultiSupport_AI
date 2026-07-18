from fastapi import APIRouter, Header
from app.database.mongodb import tickets, users, chat_history
from app.models.dashboard import DashboardMetrics, AgentStats
from app.auth.jwt_handler import check_role

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)

@router.get("/stats", response_model=DashboardMetrics)
def dashboard_stats(authorization: str = Header(None)):
    check_role(authorization, ["admin", "agent"])


    total = tickets.count_documents({})
    total_users = users.count_documents({})
    total_chats = chat_history.count_documents({})
    
    # Aggregate tickets by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_results = list(tickets.aggregate(status_pipeline))
    tickets_by_status = {item["_id"]: item["count"] for item in status_results if item["_id"]}

    # Aggregate agent stats
    agent_pipeline = [
        {
            "$group": {
                "_id": "$agent",
                "total_tickets": {"$sum": 1},
                "open_tickets": {
                    "$sum": {"$cond": [{"$eq": [{"$toLower": "$status"}, "open"]}, 1, 0]}
                },
                "resolved_tickets": {
                    "$sum": {"$cond": [{"$eq": [{"$toLower": "$status"}, "resolved"]}, 1, 0]}
                }
            }
        }
    ]
    
    agent_results = list(tickets.aggregate(agent_pipeline))
    agent_stats = []
    
    for item in agent_results:
        if item["_id"]:
            agent_stats.append(AgentStats(
                agent_name=item["_id"],
                total_tickets=item["total_tickets"],
                open_tickets=item["open_tickets"],
                resolved_tickets=item["resolved_tickets"]
            ))

    # Aggregate sentiment stats
    sentiment_pipeline = [
        {"$group": {"_id": "$sentiment", "count": {"$sum": 1}}}
    ]
    sentiment_results = list(tickets.aggregate(sentiment_pipeline))
    sentiment_stats = {item["_id"]: item["count"] for item in sentiment_results if item["_id"]}

    # Calculate SLA breaches
    from datetime import datetime
    now = datetime.utcnow()
    sla_breaches = tickets.count_documents({
        "status": {"$nin": ["resolved", "Resolved", "closed", "Closed"]},
        "sla_deadline": {"$lt": now}
    })

    # Daily chat volume aggregation (last 30 days)
    daily_pipeline = [
        {"$match": {"timestamp": {"$exists": True}}},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"_id": 1}},
        {"$limit": 30}
    ]
    daily_results = list(chat_history.aggregate(daily_pipeline))
    daily_chats = {item["_id"]: item["count"] for item in daily_results if item["_id"]}

    # Average confidence score (AI Accuracy)
    confidence_pipeline = [
        {"$match": {"confidence_score": {"$exists": True}}},
        {"$group": {"_id": None, "avg_confidence": {"$avg": "$confidence_score"}}}
    ]
    confidence_res = list(chat_history.aggregate(confidence_pipeline))
    avg_confidence = confidence_res[0]["avg_confidence"] if confidence_res else 95.0

    # CSAT score (average ticket rating)
    csat_pipeline = [
        {"$match": {"rating": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
    ]
    csat_res = list(tickets.aggregate(csat_pipeline))
    avg_csat = csat_res[0]["avg_rating"] if csat_res else 4.5

    return DashboardMetrics(
        total_tickets=total,
        tickets_by_status=tickets_by_status,
        agent_stats=agent_stats,
        sentiment_stats=sentiment_stats,
        sla_breaches=sla_breaches,
        total_users=total_users,
        total_chats=total_chats,
        daily_chats=daily_chats,
        avg_confidence=round(avg_confidence, 2),
        avg_csat=round(avg_csat, 2)
    )