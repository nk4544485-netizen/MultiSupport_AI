import os
import json
import tempfile

import chromadb
import PyPDF2
import docx

# ======================================
# Lazy Chroma Initialization
# ======================================

_client = None
_collection = None


def get_collection():
    global _client, _collection

    if _collection is not None:
        return _collection

    try:
        db_path = os.path.join(tempfile.gettempdir(), "multisupport_chroma")
        os.makedirs(db_path, exist_ok=True)

        _client = chromadb.PersistentClient(path=db_path)

        _collection = _client.get_or_create_collection(
            name="knowledge_base"
        )

        print("[OK] ChromaDB initialized")

    except Exception as e:
        print(f"[ERROR] ChromaDB Init Failed: {e}")
        _collection = None

    return _collection


def extract_text_from_pdf(file_path: str):
    text = ""

    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)

            for page in reader.pages:
                page_text = page.extract_text()

                if page_text:
                    text += page_text + "\n"

    except Exception as e:
        print(e)

    return text


def extract_text_from_docx(file_path: str):
    try:
        doc = docx.Document(file_path)
        return "\n".join([p.text for p in doc.paragraphs])

    except Exception as e:
        print(e)
        return ""


def chunk_text(text, chunk_size=500, overlap=50):

    words = text.split()

    chunks = []

    step = chunk_size - overlap

    for i in range(0, len(words), step):

        chunk = " ".join(words[i:i + chunk_size])

        if chunk.strip():
            chunks.append(chunk)

    return chunks


def process_and_index_document(file_path, document_id, department):

    collection = get_collection()

    if collection is None:
        return

    ext = os.path.splitext(file_path)[1].lower()

    filename = os.path.basename(file_path)

    if "_" in filename:
        filename = filename.split("_", 1)[1]

    chunks = []

    if ext == ".json":

        with open(file_path, "r", encoding="utf-8") as f:

            data = json.load(f)

        if isinstance(data, list):

            for item in data:

                q = item.get("question", "")

                a = item.get("answer", "")

                if q and a:
                    chunks.append(
                        f"Question: {q}\nAnswer: {a}"
                    )

        else:

            chunks = chunk_text(
                json.dumps(data, indent=2)
            )

    else:

        if ext == ".pdf":

            text = extract_text_from_pdf(file_path)

        elif ext == ".docx":

            text = extract_text_from_docx(file_path)

        else:

            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text = f.read()

        chunks = chunk_text(text)

    if not chunks:
        return

    ids = [
        f"{document_id}_{i}"
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

    try:

        collection.add(
            ids=ids,
            documents=chunks,
            metadatas=metadatas
        )

    except Exception as e:

        print(f"Index Error : {e}")


def delete_document_from_rag(document_id):

    collection = get_collection()

    if collection is None:
        return

    try:

        collection.delete(
            where={
                "document_id": document_id
            }
        )

    except Exception as e:

        print(e)


def search_knowledge_base(query, department, top_k=3):

    collection = get_collection()

    if collection is None:
        return ""

    try:

        results = collection.query(
            query_texts=[query],
            n_results=top_k,
            where={"department": department} if department else None
        )

        docs = results.get("documents", [])

        metas = results.get("metadatas", [])

        context = []

        if docs and docs[0]:

            for i, doc in enumerate(docs[0]):

                meta = metas[0][i] if metas else {}

                source = meta.get(
                    "filename",
                    "Document"
                )

                context.append(
                    f"[Source: {source}]\n{doc}"
                )

        return "\n---\n".join(context)

    except Exception as e:

        print(f"Search Error : {e}")

        return ""