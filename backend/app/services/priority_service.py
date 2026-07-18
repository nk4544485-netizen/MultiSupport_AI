def detect_priority(message: str):

    message = message.lower()

    high = [
        "hack",
        "hacked",
        "fraud",
        "payment failed",
        "refund",
        "urgent",
        "error",
        "crash",
        "not working",
        "security"
    ]

    medium = [
        "payment",
        "invoice",
        "billing",
        "technical",
        "bug",
        "issue",
        "problem",
        "cannot",
        "can't"
    ]

    for word in high:
        if word in message:
            return "HIGH"

    for word in medium:
        if word in message:
            return "MEDIUM"

    return "LOW"