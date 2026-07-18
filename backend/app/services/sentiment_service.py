from app.services.groq_service import ask_groq

def analyze_sentiment(message: str) -> str:
    """
    Uses the LLM to analyze the sentiment of a customer message.
    Returns one of: 'Positive', 'Neutral', 'Negative'.
    """
    prompt = f"""
    Analyze the sentiment of the following customer message. 
    Classify it strictly as exactly one of the following words: Positive, Neutral, or Negative.
    Do not output any other text or explanation.

    Message: "{message}"
    
    Sentiment:
    """
    try:
        reply = ask_groq(prompt).strip()
        
        # Normalize response
        normalized = reply.lower()
        if "positive" in normalized:
            return "Positive"
        elif "negative" in normalized:
            return "Negative"
        else:
            return "Neutral"
    except Exception as e:
        print(f"Sentiment Analysis Error: {e}")
        return "Neutral"  # Fallback
