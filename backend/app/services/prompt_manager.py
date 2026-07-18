from app.prompts.billing_prompt import billing_prompt
from app.prompts.technical_prompt import technical_prompt
from app.prompts.sales_prompt import sales_prompt
from app.prompts.general_prompt import general_prompt

from app.services.knowledge_service import load_knowledge


def get_prompt(agent, user_message):

    prompts = {
        "Billing": billing_prompt,
        "Technical": technical_prompt,
        "Sales": sales_prompt,
        "General": general_prompt,
    }

    system_prompt = prompts.get(agent, general_prompt)

    knowledge = load_knowledge(agent)

    return f"""
{system_prompt}

Company Knowledge:
{knowledge}


Strict Grounding Rules

1. Answer ONLY from the Company Knowledge and the Additional Knowledge Base Context.

2. If relevant information exists, answer naturally and confidently.

3. Never start your answer with
"I'm sorry, I don't have that information"
if the context contains the answer.

4. If the information does not exist anywhere in the context, then reply exactly:

"I'm sorry, I don't have that information in my knowledge base."

5. Quote the source file at the end whenever possible.

6. Never invent emails, phone numbers, prices or policies.
Customer Message:

{user_message}
"""