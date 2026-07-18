import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="footer-shell" style={{ position: 'sticky', top: 0, zIndex: 20 }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.15rem' }}>
          🤖 MultiSupport AI
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Home</Link>
          <Link to="/login" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Login</Link>
          <Link to="/register" style={{ textDecoration: 'none', color: 'var(--text-secondary)' }}>Register</Link>
          <Link to="/login" className="btn btn-primary" style={{ textDecoration: 'none', padding: '0.6rem 1rem' }}>
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;