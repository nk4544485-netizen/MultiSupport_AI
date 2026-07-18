function Features() {
  const features = [
    { icon: "🤖", title: "Multi-Agent AI", description: "Automatically routes customer queries to the right specialist agent." },
    { icon: "📚", title: "RAG Knowledge Base", description: "Retrieves grounded answers from your business documents and policies." },
    { icon: "⚡", title: "FastAPI Backend", description: "High-performance interactions for chat, tickets, and admin workflows." },
    { icon: "🔒", title: "Secure Authentication", description: "JWT-backed access for customers, agents, and admins alike." }
  ];

  return (
    <section id="features" className="section-shell" style={{ paddingTop: '1rem', paddingBottom: '4rem' }}>
      <div className="container">
        <div className="section-title">
          <h2>Why teams choose MultiSupport AI</h2>
          <p>Built to feel modern, trustworthy, and operationally useful from day one.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div style={{ fontSize: '1.75rem', marginBottom: '0.6rem' }}>{feature.icon}</div>
              <h3 style={{ marginBottom: '0.45rem' }}>{feature.title}</h3>
              <p style={{ marginBottom: 0 }}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;