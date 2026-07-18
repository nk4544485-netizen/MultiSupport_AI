function Footer() {
  return (
    <footer className="footer-shell">
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem' }}>🤖 MultiSupport AI</h2>
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>© 2026 MultiSupport AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;