import os
import json
import chromadb
import PyPDF2
import docx

# Initialize ChromaDB locally with default (fast) embedding
CHROMA_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chroma_data")
os.makedirs(CHROMA_DATA_PATH, exist_ok=True)

# Use default ChromaDB embedding — no heavy ML model download needed
chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
collection = chroma_client.get_or_create_collection(name="knowledge_base")


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                if page.extract_text():
                    text += page.extract_text() + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")
    return text


def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list:
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        if chunk.strip():
            chunks.append(chunk)
    return chunks


def process_and_index_document(file_path: str, document_id: str, department: str):
    ext = os.path.splitext(file_path)[1].lower()
    filename = os.path.basename(file_path)
    if "_" in filename:
        filename = filename.split("_", 1)[1]

    chunks = []

    if ext == ".json":
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, list):
                    for item in data:
                        q = item.get("question", "")
                        a = item.get("answer", "")
                        if q and a:
                            chunks.append(f"Question: {q}\nAnswer: {a}")
                else:
                    chunks = chunk_text(json.dumps(data, indent=2))
        except Exception as e:
            raise ValueError(f"Failed to parse FAQ JSON: {e}")
    else:
        if ext == ".pdf":
            text = extract_text_from_pdf(file_path)
        elif ext == ".docx":
            text = extract_text_from_docx(file_path)
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        if not text.strip():
            raise ValueError("Extracted text is empty.")
        chunks = chunk_text(text)

    if not chunks:
        raise ValueError("No text content could be processed from this document.")

    ids = [f"{document_id}_chunk_{i}" for i in range(len(chunks))]
    metadatas = [{"document_id": document_id, "department": department, "filename": filename} for _ in chunks]

    collection.add(documents=chunks, metadatas=metadatas, ids=ids)


def delete_document_from_rag(document_id: str):
    try:
        collection.delete(where={"document_id": document_id})
    except Exception as e:
        print(f"Error deleting from ChromaDB: {e}")


def search_knowledge_base(query: str, department: str, top_k: int = 3) -> str:
    try:
        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"department": department} if department else None
        )
        context_parts = []
        if results and results["documents"] and results["documents"][0]:
            for i in range(len(results["documents"][0])):
                text = results["documents"][0][i]
                meta = results["metadatas"][0][i] if results["metadatas"] else {}
                source = meta.get("filename", "Document")
                context_parts.append(f"[Source: {source}]\n{text}")
        return "\n---\n".join(context_parts)
    except Exception as e:
        print(f"RAG search error: {e}")
        return ""
