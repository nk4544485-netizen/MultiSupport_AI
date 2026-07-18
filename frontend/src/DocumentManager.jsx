import { useState, useEffect } from "react";
import { documents } from "./services/api";

function DocumentManager() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [department, setDepartment] = useState("General");

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documents.list();
      setDocs(res.data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("department", department);

    try {
      await documents.upload(formData);
      setFile(null);
      alert("Document Uploaded and Indexed successfully!");
      loadDocuments();
    } catch (err) {
      console.error(err);
      alert("Failed to upload document.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document from the knowledge base?")) return;
    try {
      await documents.delete(docId);
      alert("Document deleted successfully.");
      loadDocuments();
    } catch (err) {
      console.error(err);
      alert("Failed to delete document.");
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem 0" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1>Knowledge Base</h1>
        <p>Upload company documents (PDF, DOCX, TXT, FAQ JSON) to enhance AI agent responses with semantic search citations.</p>
      </header>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
        
        {/* Upload Form */}
        <div className="card">
          <h3>Upload Document</h3>
          <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Select Department</label>
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="General">General</option>
                <option value="Billing">Billing</option>
                <option value="Technical">Technical</option>
                <option value="Sales">Sales</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>File (PDF, DOCX, TXT, JSON)</label>
              <input 
                type="file" 
                accept=".pdf,.docx,.txt,.json"
                onChange={(e) => setFile(e.target.files[0])}
                style={{ background: 'transparent', border: '1px dashed var(--border-color)' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={uploading || !file}>
              {uploading ? "Indexing Document..." : "Upload & Index"}
            </button>
          </form>
          
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)' }}>💡 FAQ JSON Format Example:</span>
            <pre style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem', background: '#090d16', padding: '0.5rem', borderRadius: '4px', overflowX: 'auto' }}>
{`[
  {
    "question": "What is your refund policy?",
    "answer": "We offer a 30-day money-back guarantee."
  }
]`}
            </pre>
          </div>
        </div>

        {/* Documents List */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Indexed Documents</h3>
            <button className="btn btn-secondary" onClick={loadDocuments} disabled={loading}>
              Refresh
            </button>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Date Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {docs.map((doc, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 500 }}>{doc.filename}</td>
                    <td>
                      <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>
                        {doc.department}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${doc.status === 'Indexed' ? 'resolved' : doc.status === 'Failed' ? 'closed' : 'open'}`}>
                        {doc.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(doc.uploaded_at).toLocaleString()}
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary" 
                        onClick={() => handleDelete(doc.id)} 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--danger)', color: 'white' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {docs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "2rem" }}>
                      No documents found in the Knowledge Base.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DocumentManager;
