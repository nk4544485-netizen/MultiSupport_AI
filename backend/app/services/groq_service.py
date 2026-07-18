from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

def ask_groq(prompt_or_messages, system_prompt=None):
    if isinstance(prompt_or_messages, list):
        messages = prompt_or_messages.copy()
        if system_prompt:
            messages.insert(0, {"role": "system", "content": system_prompt})
    else:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt_or_messages})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )

    return response.choices[0].message.content