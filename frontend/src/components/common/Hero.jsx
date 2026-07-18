import { Link } from "react-router-dom";

function Hero() {
  return (
    <section className="section-shell" style={{ paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
      <div className="container">
        <div className="hero-panel" style={{ display: 'grid', gap: '1.2rem', gridTemplateColumns: '1.2fr 0.8fr' }}>
          <div>
            <div className="hero-metric">⚡ AI-powered customer support platform</div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', marginBottom: '1rem' }}>
              Multi-agent support for every customer moment
            </h1>
            <p style={{ fontSize: '1.05rem', maxWidth: '700px', marginBottom: '1.5rem' }}>
              Route tickets intelligently, answer from your knowledge base, and keep every conversation moving with a secure AI support experience.
            </p>
            <div style={{ display: 'flex', gap: '0.9rem', flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary">🚀 Launch Support Workspace</Link>
              <a href="#features" className="btn btn-secondary">Explore Platform</a>
            </div>
          </div>
          <div style={{ background: 'rgba(37, 99, 235, 0.06)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-xl)', padding: '1.2rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>What teams get</h3>
            <ul style={{ paddingLeft: '1rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
              <li>Department-aware AI routing</li>
              <li>Knowledge-base grounded answers</li>
              <li>Automated ticket creation</li>
              <li>Admin-ready analytics and controls</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;