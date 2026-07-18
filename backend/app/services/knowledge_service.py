from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_DIR = BASE_DIR / "knowledge_base"


def load_knowledge(agent: str):
    file_path = KNOWLEDGE_DIR / f"{agent.lower()}.txt"

    if not file_path.exists():
        return "No knowledge base found."

    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()