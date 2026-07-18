import { useEffect, useState } from "react";
import { dashboard, admin } from "./services/api";
import "./index.css";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Rating form state
  const [ratingTargetId, setRatingTargetId] = useState(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [feedbackVal, setFeedbackVal] = useState("");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        dashboard.getStats(),
        admin.getTickets() // Loads tickets
      ]);
      setStats(statsRes.data);
      
      // Filter tickets to only display those matching the current user's email
      const userEmail = localStorage.getItem("email") || "";
      const filtered = ticketsRes.data.tickets.filter(
        (t) => t.email.toLowerCase() === userEmail.toLowerCase()
      );
      setMyTickets(filtered);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRateTicket = async (e) => {
    e.preventDefault();
    if (!ratingTargetId) return;

    try {
      // We can use a direct axios call if not in admin helper, or call the endpoint
      await admin.updateTicketStatus(ratingTargetId, "Closed"); // Close when rated
      // Call rate API
      const API = (await import("./services/api")).default;
      await API.put(`/admin/ticket/${ratingTargetId}/rate`, {
        rating: ratingVal,
        feedback: feedbackVal
      });

      alert("Thank you for your feedback!");
      setRatingTargetId(null);
      setRatingVal(5);
      setFeedbackVal("");
      loadAllData();
    } catch (err) {
      console.error(err);
      alert("Failed to submit rating.");
    }
  };

  // Helper to generate SVG Chart path for Daily Chats
  const renderChatVolumeChart = () => {
    if (!stats || !stats.daily_chats || Object.keys(stats.daily_chats).length === 0) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '150px', color: 'var(--text-muted)' }}>
          No chat history data available.
        </div>
      );
    }

    const data = Object.entries(stats.daily_chats)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const maxCount = Math.max(...data.map(d => d.count), 5);
    const width = 450;
    const height = 150;
    const padding = 20;

    const points = data.map((d, index) => {
      const x = padding + (index * (width - padding * 2)) / (data.length - 1 || 1);
      const y = height - padding - (d.count * (height - padding * 2)) / maxCount;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-md)', padding: '10px' }}>
        {/* Grid lines */}
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="var(--border-color)" />
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.05)" />
        
        {/* Trend Area */}
        {data.length > 1 && (
          <polygon
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            fill="rgba(99, 102, 241, 0.15)"
          />
        )}

        {/* Trend Line */}
        {data.length > 1 ? (
          <polyline
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            points={points}
          />
        ) : (
          <circle cx={width/2} cy={height/2} r="5" fill="var(--accent-primary)" />
        )}

        {/* Points circles */}
        {data.map((d, index) => {
          const x = padding + (index * (width - padding * 2)) / (data.length - 1 || 1);
          const y = height - padding - (d.count * (height - padding * 2)) / maxCount;
          return (
            <g key={index}>
              <circle cx={x} cy={y} r="4" fill="var(--text-primary)" stroke="var(--accent-primary)" strokeWidth="2" />
              <text x={x} y={y - 10} fontSize="8" fill="var(--text-secondary)" textAnchor="middle">{d.count}</text>
              <text x={x} y={height - 5} fontSize="7" fill="var(--text-muted)" textAnchor="middle">{d.date.substring(5)}</text>
            </g>
          );
        })}
      </svg>
    );
  };

  if (loading) {
    return <div className="container" style={{ marginTop: '2rem' }}><h2>Loading Dashboard & Tickets...</h2></div>;
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1>📊 Portal Dashboard</h1>
        <p>Monitor support history, view system-wide stats, and rate your experience.</p>
      </header>

      {/* Stats Cards Row */}
      {stats && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '2.5rem' }}>
          <div className="card">
            <h3>My System CSAT</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--success)' }}>
              ⭐ {stats.avg_csat} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 5</span>
            </p>
          </div>
          <div className="card">
            <h3>AI Accuracy</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
              🎯 {stats.avg_confidence}%
            </p>
          </div>
          <div className="card">
            <h3>Total Users</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              👥 {stats.total_users}
            </p>
          </div>
          <div className="card">
            <h3>Total Chats</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--info)' }}>
              💬 {stats.total_chats}
            </p>
          </div>
          <div className="card">
            <h3>Active Tickets</h3>
            <p style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--warning)' }}>
              🎫 {stats.total_tickets}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Chat Chart & User Tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left: Chat Volume Trend */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3>📈 Customer Conversation Trend</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Daily message frequency logged over the last 30 days.</p>
          <div style={{ marginTop: 'auto' }}>
            {renderChatVolumeChart()}
          </div>
        </div>

        {/* Right: My Support Tickets */}
        <div className="card">
          <h3>🎫 My Support Tickets</h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            List of tickets matching your registration email.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto' }}>
            {myTickets.map((ticket) => (
              <div key={ticket.ticket_id} style={{ padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{ticket.ticket_id}</span>
                  <span className={`badge ${(ticket.status || '').toLowerCase().replace(' ', '-')}`}>
                    {ticket.status}
                  </span>
                </div>
                <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  "{ticket.user_message}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>Department: {ticket.department}</span>
                  <span>Priority: {ticket.priority}</span>
                </div>

                {/* Rating Button if Resolved */}
                {ticket.status === 'Resolved' && !ticket.rating && (
                  <button 
                    className="btn btn-primary" 
                    style={{ width: '100%', padding: '0.4rem', fontSize: '0.8rem', marginTop: '0.75rem' }}
                    onClick={() => setRatingTargetId(ticket.ticket_id)}
                  >
                    ⭐ Leave Feedback & Close
                  </button>
                )}

                {/* Show rating if already rated */}
                {ticket.rating && (
                  <div style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', fontSize: '0.8rem', color: 'var(--success)' }}>
                    Rated: {"⭐".repeat(ticket.rating)}
                    {ticket.feedback && <p style={{ margin: '0.25rem 0 0 0', fontStyle: 'italic' }}>"{ticket.feedback}"</p>}
                  </div>
                )}
              </div>
            ))}
            {myTickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                You have no active support tickets. Any critical queries in chat will automatically spawn tickets.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Feedback & Rating Modal */}
      {ratingTargetId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '400px', background: 'var(--bg-secondary)', padding: '2rem' }}>
            <h3>Rate Support Experience</h3>
            <p>Please rate your experience with ticket <strong>{ratingTargetId}</strong> to help us improve.</p>
            
            <form onSubmit={handleRateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem' }}>
                  {[1, 2, 3, 4, 5].map((val) => (
                    <span 
                      key={val} 
                      style={{ cursor: 'pointer', color: val <= ratingVal ? 'var(--warning)' : 'var(--text-muted)' }}
                      onClick={() => setRatingVal(val)}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Comments (Optional)</label>
                <textarea 
                  value={feedbackVal} 
                  onChange={(e) => setFeedbackVal(e.target.value)} 
                  placeholder="Tell us what went well or what we can improve..."
                  style={{ height: '80px', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRatingTargetId(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;