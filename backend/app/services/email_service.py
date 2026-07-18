import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "no-reply@multisupport.ai")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "mock_password")

def send_ticket_email(to_email: str, ticket_id: str, department: str):
    """Sends a mock email notification."""
    print(f"[EMAIL SERVICE] 📧 Sending email to {to_email} for Ticket {ticket_id} ({department})")
    
    # In a real environment, you would use smtplib.
    # We will log the simulation to avoid crashing if credentials aren't set.
    msg = MIMEMultipart()
    msg['From'] = SMTP_USERNAME
    msg['To'] = to_email
    msg['Subject'] = f"Support Ticket Created: {ticket_id}"

    body = f"Hello,\n\nWe have received your request for the {department} department. Your ticket ID is {ticket_id}.\n\nWe will get back to you soon.\n\nMultiSupport AI Team"
    msg.attach(MIMEText(body, 'plain'))

    try:
        if SMTP_PASSWORD != "mock_password":
            server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            server.quit()
            print("[EMAIL SERVICE] Email sent successfully via SMTP.")
        else:
            print("[EMAIL SERVICE] Using mock mode. Email content:\n", body)
    except Exception as e:
        print(f"[EMAIL SERVICE] Error sending email: {e}")
