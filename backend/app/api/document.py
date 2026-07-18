from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from typing import List
import os
import shutil
import uuid
from datetime import datetime
from app.database.mongodb import db  
from app.services.rag_service import process_and_index_document, delete_document_from_rag
from app.auth.jwt_handler import check_role

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)

# Collection for tracking indexed documents
documents_collection = db["documents"]

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    department: str = Form(...),
    authorization: str = Header(None)
):
    check_role(authorization, ["admin", "agent"])

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".docx", ".txt", ".json"]:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT, and FAQ JSON files are supported.")

    document_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_FOLDER, f"{document_id}_{file.filename}")

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Initial metadata
    doc_metadata = {
        "id": document_id,
        "filename": file.filename,
        "department": department,
        "status": "Processing",
        "file_path": file_path,
        "uploaded_at": datetime.utcnow()
    }
    
    documents_collection.insert_one(doc_metadata.copy())

    # Process and Index for RAG
    try:
        process_and_index_document(file_path, document_id, department)
        documents_collection.update_one(
            {"id": document_id},
            {"$set": {"status": "Indexed"}}
        )
    except Exception as e:
        documents_collection.update_one(
            {"id": document_id},
            {"$set": {"status": "Failed", "error_message": str(e)}}
        )
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    return {
        "success": True,
        "document_id": document_id,
        "filename": file.filename,
        "message": "Uploaded and Indexed Successfully"
    }

@router.delete("/{document_id}")
def delete_document(document_id: str, authorization: str = Header(None)):
    check_role(authorization, ["admin", "agent"])

    doc = documents_collection.find_one({"id": document_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Remove file from disk
    file_path = doc.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error removing local file: {e}")
            
    # Delete from ChromaDB
    delete_document_from_rag(document_id)
    
    # Delete from MongoDB tracking collection
    documents_collection.delete_one({"id": document_id})
    
    return {"success": True, "message": "Document deleted successfully from knowledge base."}

@router.get("/")
def list_documents(authorization: str = Header(None)):
    check_role(authorization, ["admin", "agent"])
    docs = list(documents_collection.find({}, {"_id": 0}).sort("uploaded_at", -1))
    return {"success": True, "documents": docs}