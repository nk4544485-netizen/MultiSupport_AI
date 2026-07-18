def detect_agent(message: str):

    message = message.lower()

    billing_keywords = [
        "payment",
        "refund",
        "invoice",
        "bill",
        "subscription",
        "money",
        "price",
        "charged"
    ]

    technical_keywords = [
        "error",
        "bug",
        "issue",
        "problem",
        "login",
        "password",
        "crash",
        "failed"
    ]

    sales_keywords = [
        "buy",
        "purchase",
        "premium",
        "upgrade",
        "plan",
        "offer",
        "pricing"
    ]

    for word in billing_keywords:
        if word in message:
            return "Billing"

    for word in technical_keywords:
        if word in message:
            return "Technical"

    for word in sales_keywords:
        if word in message:
            return "Sales"

    return "General"