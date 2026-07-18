import os
import requests

TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "mock_sid")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "mock_token")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER", "whatsapp:+14155238886")

def send_whatsapp_notification(to_phone: str, message: str):
    """Sends a mock WhatsApp notification."""
    print(f"[WHATSAPP SERVICE] 🟢 Sending WhatsApp to {to_phone}: {message}")

    if TWILIO_ACCOUNT_SID != "mock_sid":
        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
        payload = {
            "From": TWILIO_PHONE_NUMBER,
            "To": f"whatsapp:{to_phone}",
            "Body": message
        }
        try:
            response = requests.post(
                url,
                data=payload,
                auth=(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
            )
            if response.status_code == 201:
                print("[WHATSAPP SERVICE] WhatsApp message sent successfully.")
            else:
                print(f"[WHATSAPP SERVICE] Failed to send: {response.text}")
        except Exception as e:
            print(f"[WHATSAPP SERVICE] Error connecting to Twilio: {e}")
    else:
        print("[WHATSAPP SERVICE] Using mock mode. No actual message sent.")
