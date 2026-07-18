import { useState, useEffect, useRef } from "react";
import { chat, auth } from "./services/api";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import AdminDashboard from "./admindashboard"; // File name in directory is lowercase admindashboard.jsx
import DocumentManager from "./DocumentManager";
import MarkdownRenderer from "./components/MarkdownRenderer";
import "./index.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [adminMode, setAdminMode] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [message, setMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chat"); // 'chat', 'dashboard', 'admin', 'knowledge'
  const [isListening, setIsListening] = useState(false);
  const [editingConvId, setEditingConvId] = useState(null);
  const [editTitleText, setEditTitleText] = useState("");

  const messagesEndRef = useRef(null);

  // Initialize Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token && !adminMode) {
      handleSilentGuestLogin();
    }
  }, [adminMode]);

  const handleSilentGuestLogin = async () => {
    setConnectionError(false);
    try {
      let guestEmail = localStorage.getItem("guest_email");
      let guestName = localStorage.getItem("guest_name");
      if (!guestEmail) {
        const randId = Math.random().toString(36).substring(2, 10);
        guestEmail = `guest_${randId}@multisupport.ai`;
        guestName = `Guest Customer`;
        localStorage.setItem("guest_email", guestEmail);
        localStorage.setItem("guest_name", guestName);
      }

      try {
        await auth.register({
          name: guestName,
          email: guestEmail,
          password: "guestpassword",
        });
      } catch (regErr) {
        console.log("Silent registration info:", regErr);
      }

      const res = await auth.login({
        email: guestEmail,
        password: "guestpassword",
      });

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("name", res.data.name);
      localStorage.setItem("role", res.data.role || "customer");
      localStorage.setItem("email", res.data.email || guestEmail);

      setIsLoggedIn(true);
    } catch (err) {
      console.error("Silent guest login failed", err);
      setConnectionError(true);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      loadConversations();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const res = await chat.getConversations();
      setConversations(res.data.conversations || []);
      if (res.data.conversations && res.data.conversations.length > 0 && !activeConvId) {
        setActiveConvId(res.data.conversations[0].conversation_id);
      }
    } catch (err) {
      console.error("Failed to load conversations", err);
    }
  };

  const loadMessages = async (convId) => {
    setLoading(true);
    try {
      const res = await chat.getMessages(convId, 100, 0);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    setActiveConvId(null);
    setMessages([]);
    setMessage("");
  };

  const handleDeleteConversation = async (convId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this conversation?")) return;
    try {
      await chat.deleteConversation(convId);
      if (activeConvId === convId) {
        setActiveConvId(null);
      }
      loadConversations();
    } catch (err) {
      console.error("Failed to delete conversation", err);
      alert("Failed to delete conversation");
    }
  };

  const handleStartRename = (conv, e) => {
    e.stopPropagation();
    setEditingConvId(conv.conversation_id);
    setEditTitleText(conv.title);
  };

  const handleSaveRename = async (convId) => {
    if (!editTitleText.trim()) return;
    try {
      await chat.updateConversationTitle(convId, editTitleText.trim());
      setEditingConvId(null);
      loadConversations();
    } catch (err) {
      console.error("Rename error", err);
    }
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      if (activeConvId) loadMessages(activeConvId);
      return;
    }

    try {
      const res = await chat.search(query);
      // Map results to display matching messages
      const results = res.data.results.map(item => ({
        user_message: item.user_message,
        ai_reply: item.ai_reply,
        agent: item.agent,
        ticket: item.ticket
      }));
      setMessages(results);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMsg = message;
    setMessage("");
    setIsTyping(true);

    // Optimistically update UI if there is an active conversation
    if (activeConvId) {
      setMessages((prev) => [...prev, { user_message: userMsg, ai_reply: "" }]);
    }

    try {
      const response = await chat.send(userMsg, activeConvId);

      const newConvId = response.data.conversation_id;
      if (!activeConvId) {
        // First message in a new conversation
        setActiveConvId(newConvId);
        await loadConversations();
      } else {
        // Load latest messages
        await loadMessages(activeConvId);
      }

      // Text-to-Speech for the AI response
      if (response.data && response.data.reply) {
        speakText(response.data.reply);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.detail || "Something went wrong. Please try again.";
      setMessages(prev => [...prev, {
        role: "error",
        content: errMsg,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognition) {
      alert("Speech Recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setMessage((prev) => prev + " " + transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    setIsLoggedIn(false);
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);
  };

  if (!isLoggedIn) {
    if (!adminMode) {
      return (
        <div className="auth-shell">
          <div className="auth-card card animate-fade-in" style={{ width: '100%', maxWidth: '460px' }}>
            {connectionError ? (
              <>
                <div style={{ fontSize: '3rem', textAlign: 'center' }}>⚠️</div>
                <h3 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Connection Failed</h3>
                <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  We couldn't connect to the support server. Please make sure the backend is running.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <button className="btn btn-primary" onClick={handleSilentGuestLogin}>
                    Retry Connection
                  </button>
                  <button className="btn btn-secondary" onClick={() => setAdminMode(true)}>
                    Go to Staff Portal
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '3rem', textAlign: 'center' }} className="animate-bounce">🤖</div>
                <h3 style={{ textAlign: 'center', marginBottom: '0.75rem' }}>Connecting to MultiSupport AI...</h3>
                <p style={{ textAlign: 'center' }}>Initializing your secure support channel</p>
              </>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="auth-shell">
        <div className="auth-card card animate-fade-in">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>🤖</div>
            <h2 style={{ marginBottom: '0.5rem' }}>MultiSupport AI</h2>
            <p style={{ marginBottom: 0 }}>Secure staff access for your support team</p>
          </div>
          {showRegister ? (
            <>
              <Register onRegisterSuccess={() => setShowRegister(false)} />
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowRegister(false)} style={{ width: '100%' }}>
                  Already have an account? Login
                </button>
              </div>
            </>
          ) : (
            <>
              <Login onLogin={() => setIsLoggedIn(true)} />
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setShowRegister(true)} style={{ width: '100%' }}>
                  Create Account
                </button>
              </div>
            </>
          )}
          <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button className="btn btn-secondary" onClick={() => { setAdminMode(false); }} style={{ width: '100%' }}>
              ← Back to Customer Support
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="saas-layout animate-fade-in">

      {/* SaaS Left Sidebar Navigation */}
      <aside className="saas-sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">🤖</span>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>MultiSupport AI</h3>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>AI support command center</p>
          </div>
        </div>

        <div className="nav-stack">
          <button
            className={`btn nav-pill ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            💬 Support Agent Chat
          </button>
          {["admin", "agent"].includes(localStorage.getItem("role")) && (
            <>
              <button
                className={`btn nav-pill ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                📊 Analytics Dashboard
              </button>
              <button
                className={`btn nav-pill ${activeTab === 'admin' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin')}
              >
                🛠️ Admin Panel
              </button>
              <button
                className={`btn nav-pill ${activeTab === 'knowledge' ? 'active' : ''}`}
                onClick={() => setActiveTab('knowledge')}
              >
                📚 Knowledge Base
              </button>
            </>
          )}
        </div>

        {/* Conversation management area if in Chat view */}
        {activeTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '1rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 700 }}>History</span>
              <button
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                onClick={handleStartNewChat}
              >
                + New Chat
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
              {conversations.map((conv) => (
                <div
                  key={conv.conversation_id}
                  className={`conv-item ${activeConvId === conv.conversation_id ? 'active' : ''}`}
                  onClick={() => setActiveConvId(conv.conversation_id)}
                >
                  {editingConvId === conv.conversation_id ? (
                    <input
                      value={editTitleText}
                      onChange={(e) => setEditTitleText(e.target.value)}
                      onBlur={() => handleSaveRename(conv.conversation_id)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveRename(conv.conversation_id); }}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      style={{ fontSize: '0.85rem', padding: '0.1rem 0.3rem', width: '80%' }}
                    />
                  ) : (
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                      {conv.title || "Untitled Conversation"}
                    </span>
                  )}

                  <div className="actions">
                    <span onClick={(e) => handleStartRename(conv, e)} title="Rename">✏️</span>
                    <span onClick={(e) => handleDeleteConversation(conv.conversation_id, e)} title="Delete">🗑️</span>
                  </div>
                </div>
              ))}
              {conversations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  No previous chats.
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Card */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(37, 99, 235, 0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
              👤 {localStorage.getItem("role") === "customer" ? "Guest Customer" : (localStorage.getItem("name") || 'User')}
            </span>
            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem' }} onClick={logout}>
              Logout
            </button>
          </div>
          {localStorage.getItem("role") === "customer" && (
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.25rem', marginTop: '0.25rem', width: '100%', border: '1px dashed var(--border-color)' }}
              onClick={() => {
                logout();
                setAdminMode(true);
              }}
            >
              🔐 Staff Portal Login
            </button>
          )}
        </div>
      </aside>

      {/* SaaS Main Content Area */}
      <main className="saas-main">
        {activeTab !== 'chat' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'admin' && <AdminDashboard />}
            {activeTab === 'knowledge' && <DocumentManager />}
          </div>
        )}

        {activeTab === 'chat' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Header / Active conversation details */}
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)' }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {activeConvId
                    ? (conversations.find(c => c.conversation_id === activeConvId)?.title || "Active Chat")
                    : "New Support Session"}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {activeConvId ? "Chat history with AI routing" : "AI routing enabled"}
                </span>
              </div>

              <div style={{ width: '260px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search history..."
                  value={searchQuery}
                  onChange={handleSearch}
                  style={{ background: 'var(--bg-secondary)', padding: '0.6rem 0.8rem', fontSize: '0.85rem' }}
                />
              </div>
            </header>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.length === 0 && !isTyping ? (
                <div className="empty-state">
                  <span style={{ fontSize: '3rem' }}>🤖</span>
                  <h3 style={{ marginTop: '1rem', color: 'var(--text-primary)' }}>Welcome to MultiSupport AI</h3>
                  <p style={{ fontSize: '0.95rem', marginTop: '0.5rem' }}>
                    Type your issue below. Our AI router will route your request to the correct department and create a ticket if needed.
                  </p>
                </div>
              ) : (
                messages.map((c, index) => (
                  <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {c.user_message && (
                      <div className="message-bubble-user">
                        <div style={{ fontSize: '0.7rem', opacity: 0.8, marginBottom: '0.25rem' }}>You</div>
                        <div style={{ fontSize: '0.95rem' }}>{c.user_message}</div>
                      </div>
                    )}

                    {c.ai_reply ? (
                      <div className="message-bubble-ai">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', gap: '1rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            🤖 {c.agent} Agent
                          </span>
                          {c.ticket && (
                            <span className="badge pending" style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}>
                              Ticket: {c.ticket.ticket_id}
                            </span>
                          )}
                        </div>
                        <MarkdownRenderer content={c.ai_reply} />
                      </div>
                    ) : (
                      c.user_message && isTyping && index === messages.length - 1 && null
                    )}
                  </div>
                ))
              )}

              {isTyping && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Agent is thinking</span>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem', background: 'rgba(255,255,255,0.8)', alignItems: 'center' }}>
              <button
                className={`btn ${isListening ? 'btn-primary' : 'btn-secondary'}`}
                onClick={toggleListening}
                style={{ padding: '0.75rem', borderRadius: '50%', width: '45px', height: '45px' }}
                title="Voice Input"
              >
                🎤
              </button>
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Describe your request..."
                disabled={isTyping}
                style={{ height: '45px' }}
              />
              <button
                className="btn btn-primary"
                onClick={sendMessage}
                disabled={isTyping || !message.trim()}
                style={{ minWidth: '100px', height: '45px' }}
              >
                Send
              </button>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;