import os
import json
import tempfile

import chromadb
import PyPDF2
import docx

# ==========================
# ChromaDB Initialization
# ==========================

# Use a temporary database on Render to avoid corrupted persistent metadata
CHROMA_DATA_PATH = tempfile.mkdtemp()

chroma_client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)

collection = chroma_client.get_or_create_collection(
    name="knowledge_base"
)


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"PDF extraction error: {e}")

    return text


def extract_text_from_docx(file_path: str) -> str:
    try:
        doc = docx.Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs)
    except Exception as e:
        print(f"DOCX extraction error: {e}")
        return ""


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50):
    words = text.split()

    chunks = []

    step = chunk_size - overlap

    for i in range(0, len(words), step):
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

                    question = item.get("question", "")
                    answer = item.get("answer", "")

                    if question and answer:
                        chunks.append(
                            f"Question: {question}\nAnswer: {answer}"
                        )

            else:

                chunks = chunk_text(
                    json.dumps(data, indent=2)
                )

        except Exception as e:
            raise ValueError(f"JSON parsing failed: {e}")

    else:

        if ext == ".pdf":
            text = extract_text_from_pdf(file_path)

        elif ext == ".docx":
            text = extract_text_from_docx(file_path)

        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        if not text.strip():
            raise ValueError("No readable text found.")

        chunks = chunk_text(text)

    if not chunks:
        raise ValueError("Nothing to index.")

    ids = [
        f"{document_id}_chunk_{i}"
        for i in range(len(chunks))
    ]

    metadatas = [
        {
            "document_id": document_id,
            "department": department,
            "filename": filename
        }
        for _ in chunks
    ]

    collection.add(
        ids=ids,
        documents=chunks,
        metadatas=metadatas
    )


def delete_document_from_rag(document_id: str):

    try:

        collection.delete(
            where={
                "document_id": document_id
            }
        )

    except Exception as e:

        print(f"Delete error: {e}")


def search_knowledge_base(query: str,
                          department: str,
                          top_k: int = 3):

    try:

        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"department": department} if department else None
        )

        context = []

        docs = results.get("documents", [])

        metas = results.get("metadatas", [])

        if docs and docs[0]:

            for i, text in enumerate(docs[0]):

                meta = metas[0][i] if metas else {}

                filename = meta.get("filename", "Document")

                context.append(
                    f"[Source: {filename}]\n{text}"
                )

        return "\n---\n".join(context)

    except Exception as e:

        print(f"RAG search error: {e}")

        return ""