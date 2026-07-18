import { useEffect, useState } from "react";
import { admin, dashboard } from "./services/api";
import { wsService } from "./services/websocket";
import "./index.css";

function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [agent, setAgent] = useState("");
  const [priority, setPriority] = useState("");
  const [sentiment, setSentiment] = useState("");
  const [slaBreached, setSlaBreached] = useState(false);

  // Modal / Details State
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicketDetails, setSelectedTicketDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    // Connect WebSocket and listen for events
    wsService.connect();
    const unsubscribe = wsService.subscribe((data) => {
      if (data.type === 'NEW_TICKET' || data.type === 'TICKET_UPDATED') {
        console.log("WebSocket Notification:", data.message);
        loadDashboardData();
        if (selectedTicketId) {
          loadTicketDetails(selectedTicketId, false); // Reload details silently if open
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [selectedTicketId]);

  useEffect(() => {
    loadTickets();
  }, [search, status, agent, priority, sentiment, slaBreached]);

  const loadDashboardData = async () => {
    try {
      const statsRes = await dashboard.getStats();
      setStats(statsRes.data);
      loadTickets();
    } catch (err) {
      console.error(err);
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = {
        search: search.trim() || undefined,
        status: status || undefined,
        agent: agent || undefined,
        priority: priority || undefined,
        sentiment: sentiment || undefined,
        sla_breached: slaBreached ? true : undefined
      };
      const res = await admin.getTickets(params);
      setTickets(res.data.tickets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadTicketDetails = async (ticketId, showSpinner = true) => {
    if (showSpinner) setLoadingDetails(true);
    try {
      const res = await admin.getTicketDetails(ticketId);
      setSelectedTicketDetails(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load ticket details");
    } finally {
      if (showSpinner) setLoadingDetails(false);
    }
  };

  const handleOpenDetails = (ticketId) => {
    setSelectedTicketId(ticketId);
    loadTicketDetails(ticketId);
  };

  const handleCloseDetails = () => {
    setSelectedTicketId(null);
    setSelectedTicketDetails(null);
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await admin.updateTicketStatus(ticketId, newStatus);
      loadTickets();
      if (selectedTicketId === ticketId) {
        loadTicketDetails(ticketId, false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update ticket status");
    }
  };

  const handleUpdatePriority = async (ticketId, newPriority) => {
    try {
      await admin.updateTicketPriority(ticketId, newPriority);
      loadTickets();
      if (selectedTicketId === ticketId) {
        loadTicketDetails(ticketId, false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update ticket priority");
    }
  };

  const handleUpdateAssignee = async (ticketId, newAssignee) => {
    try {
      await admin.assignTicket(ticketId, newAssignee);
      loadTickets();
      if (selectedTicketId === ticketId) {
        loadTicketDetails(ticketId, false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to assign agent");
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await admin.resolveTicket(ticketId);
      loadTickets();
      if (selectedTicketId === ticketId) {
        loadTicketDetails(ticketId, false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to resolve ticket");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("");
    setAgent("");
    setPriority("");
    setSentiment("");
    setSlaBreached(false);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: "2rem 0" }}>
      <header style={{ marginBottom: "2rem", display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Admin Command Center</h1>
          <p>Supercharge support with real-time analytics, filtering, and ticket escalation.</p>
        </div>
        <button className="btn btn-secondary" onClick={loadDashboardData}>
          🔄 Refresh Data
        </button>
      </header>

      {/* Metrics Section */}
      {stats && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
          <div className="card">
            <h3>Total Tickets</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--text-primary)" }}>
              {stats.total_tickets}
            </p>
          </div>
          <div className="card">
            <h3>Open Tickets</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--warning)" }}>
              {stats.tickets_by_status?.Open || 0}
            </p>
          </div>
          <div className="card">
            <h3>Resolved Tickets</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: "var(--success)" }}>
              {stats.tickets_by_status?.Resolved || stats.tickets_by_status?.resolved || 0}
            </p>
          </div>
          <div className="card" style={{ borderColor: stats.sla_breaches > 0 ? 'var(--danger)' : 'var(--border-color)' }}>
            <h3>SLA Breaches</h3>
            <p style={{ fontSize: "2rem", fontWeight: "700", color: stats.sla_breaches > 0 ? 'var(--danger)' : 'var(--success)' }}>
              {stats.sla_breaches}
            </p>
          </div>
          <div className="card">
            <h3>Sentiment Ratios</h3>
            <div style={{ fontSize: "0.85rem", display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--success)' }}>🟢 Positive:</span>
                <span>{stats.sentiment_stats?.Positive || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>⚪ Neutral:</span>
                <span>{stats.sentiment_stats?.Neutral || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--danger)' }}>🔴 Negative:</span>
                <span>{stats.sentiment_stats?.Negative || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filters Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3>🔍 Advanced Search & Filters</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Search query</label>
            <input 
              type="text" 
              placeholder="ID, email, message..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Assignee Agent</label>
            <select value={agent} onChange={(e) => setAgent(e.target.value)}>
              <option value="">All Agents</option>
              <option value="General">General</option>
              <option value="Billing">Billing</option>
              <option value="Technical">Technical</option>
              <option value="Sales">Sales</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sentiment</label>
            <select value={sentiment} onChange={(e) => setSentiment(e.target.value)}>
              <option value="">All Sentiments</option>
              <option value="Positive">Positive</option>
              <option value="Neutral">Neutral</option>
              <option value="Negative">Negative</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={slaBreached} 
              onChange={(e) => setSlaBreached(e.target.checked)} 
              style={{ width: 'auto' }}
            />
            <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem' }}>⚠️ Show SLA Breached Only</span>
          </label>
          <button className="btn btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <h2>Recent Support Tickets ({tickets.length})</h2>
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Customer</th>
              <th>Priority</th>
              <th>Sentiment</th>
              <th>SLA Deadline</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => {
              const isSlaBreached = ticket.sla_deadline && 
                new Date(ticket.sla_deadline) < new Date() && 
                !['resolved', 'closed'].includes((ticket.status || '').toLowerCase());
              
              return (
                <tr key={ticket.ticket_id} style={{ cursor: 'pointer' }} onClick={() => handleOpenDetails(ticket.ticket_id)}>
                  <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{ticket.ticket_id}</td>
                  <td>
                    <span className="badge" style={{ background: 'var(--bg-tertiary)' }}>
                      {ticket.agent || ticket.department}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                      {ticket.status}
                    </span>
                  </td>
                  <td>{ticket.email}</td>
                  <td>
                    <span className="badge" style={{ 
                      backgroundColor: (ticket.priority || 'Normal') === 'High' || (ticket.priority || 'Normal') === 'Urgent' 
                        ? 'rgba(239, 68, 68, 0.2)' 
                        : 'rgba(100, 116, 139, 0.2)',
                      color: (ticket.priority || 'Normal') === 'High' || (ticket.priority || 'Normal') === 'Urgent' 
                        ? 'var(--danger)' 
                        : 'var(--text-secondary)'
                    }}>
                      {ticket.priority || 'Normal'}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{
                      backgroundColor: ticket.sentiment === 'Positive' ? 'rgba(16, 185, 129, 0.2)' : ticket.sentiment === 'Negative' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                      color: ticket.sentiment === 'Positive' ? 'var(--success)' : ticket.sentiment === 'Negative' ? 'var(--danger)' : 'var(--text-secondary)'
                    }}>
                      {ticket.sentiment || 'Neutral'}
                    </span>
                  </td>
                  <td style={{ color: isSlaBreached ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: isSlaBreached ? 'bold' : 'normal' }}>
                    {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
                    {isSlaBreached && " ⚠️"}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleOpenDetails(ticket.ticket_id)}>
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
            {tickets.length === 0 && !loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "3rem" }}>
                  🎉 No tickets match current filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2rem" }}>
                  Loading tickets...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details Drawer / Modal */}
      {selectedTicketId && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '550px',
          background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)',
          boxShadow: '-5px 0 25px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out forwards', padding: '1.5rem', overflowY: 'auto'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Ticket Details</h2>
            <button className="btn btn-secondary" onClick={handleCloseDetails}>✕ Close</button>
          </div>

          {loadingDetails ? (
            <p>Loading ticket info...</p>
          ) : selectedTicketDetails ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Ticket Info Card */}
              <div className="card" style={{ background: 'var(--bg-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedTicketDetails.ticket.ticket_id}</span>
                  <button className="btn btn-primary" onClick={() => handleResolveTicket(selectedTicketDetails.ticket.ticket_id)} disabled={selectedTicketDetails.ticket.status === 'Resolved'}>
                    Resolve Ticket
                  </button>
                </div>
                <p><strong>Department:</strong> {selectedTicketDetails.ticket.department}</p>
                <p><strong>Created At:</strong> {new Date(selectedTicketDetails.ticket.created_at).toLocaleString()}</p>
                <p><strong>Customer Email:</strong> {selectedTicketDetails.ticket.email}</p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                  <p style={{ margin: 0, fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    "{selectedTicketDetails.ticket.user_message}"
                  </p>
                </div>
              </div>

              {/* Operations Control Card */}
              <div className="card">
                <h3>🛠️ Ticket Operations</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Status</label>
                    <select 
                      value={selectedTicketDetails.ticket.status} 
                      onChange={(e) => handleUpdateStatus(selectedTicketDetails.ticket.ticket_id, e.target.value)}
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Priority</label>
                    <select 
                      value={selectedTicketDetails.ticket.priority || "Normal"} 
                      onChange={(e) => handleUpdatePriority(selectedTicketDetails.ticket.ticket_id, e.target.value)}
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--text-secondary)' }}>Assignee Agent</label>
                    <select 
                      value={selectedTicketDetails.ticket.agent || ""} 
                      onChange={(e) => handleUpdateAssignee(selectedTicketDetails.ticket.ticket_id, e.target.value)}
                    >
                      <option value="General">General</option>
                      <option value="Billing">Billing</option>
                      <option value="Technical">Technical</option>
                      <option value="Sales">Sales</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              <div className="card">
                <h3>⏳ Status Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                  {selectedTicketDetails.ticket.timeline && selectedTicketDetails.ticket.timeline.map((event, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '1rem', borderLeft: '2px solid var(--accent-primary)', paddingLeft: '1rem', margin: '0.25rem 0' }}>
                      <div>
                        <span className="badge" style={{ background: 'var(--bg-tertiary)', fontSize: '0.75rem' }}>{event.status}</span>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem' }}>{event.message}</p>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Chat Logs Card */}
              <div className="card">
                <h3>💬 Customer Conversation Context</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  {selectedTicketDetails.chat_logs && selectedTicketDetails.chat_logs.map((log, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>Customer</span>
                        <span>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-primary)' }}>Q: {log.user_message}</p>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-primary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.25rem' }}>
                        A: {log.ai_reply}
                      </p>
                    </div>
                  ))}
                  {(!selectedTicketDetails.chat_logs || selectedTicketDetails.chat_logs.length === 0) && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No conversations found for this user.</p>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <p>Error loading ticket details</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;