import { useState } from "react";

function MarkdownRenderer({ content }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!content) return null;

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to split text by code blocks
  const parseMarkdown = (text) => {
    const parts = [];
    const regex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let index = 0;

    while ((match = regex.exec(text)) !== null) {
      // Text before code block
      const before = text.substring(lastIndex, match.index);
      if (before) {
        parts.push({ type: "text", content: before });
      }

      // Code block details
      parts.push({
        type: "code",
        language: match[1] || "txt",
        content: match[2].trim(),
        index: index++
      });

      lastIndex = regex.lastIndex;
    }

    // Remaining text after last code block
    const after = text.substring(lastIndex);
    if (after) {
      parts.push({ type: "text", content: after });
    }

    return parts;
  };

  const formatText = (txt) => {
    // Basic markdown replacements
    // Escape HTML first to prevent injection
    let html = txt
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Strong markdown (**bold**)
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italics (*italic*)
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Inline code (`code`)
    html = html.replace(/`(.*?)`/g, "<code class='inline-code'>$1</code>");

    // Line breaks
    const lines = html.split("\n");
    let inList = false;
    const formattedLines = [];

    for (let line of lines) {
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        if (!inList) {
          formattedLines.push("<ul>");
          inList = true;
        }
        formattedLines.push(`<li>${line.trim().substring(2)}</li>`);
      } else {
        if (inList) {
          formattedLines.push("</ul>");
          inList = false;
        }
        formattedLines.push(line);
      }
    }

    if (inList) {
      formattedLines.push("</ul>");
    }

    return formattedLines.join("<br/>");
  };

  const parts = parseMarkdown(content);

  return (
    <div className="markdown-body" style={{ lineHeight: '1.6', fontSize: '0.95rem' }}>
      {parts.map((part, i) => {
        if (part.type === "code") {
          return (
            <div 
              key={i} 
              className="code-container" 
              style={{ 
                position: 'relative', 
                background: 'rgba(15, 23, 42, 0.6)', 
                border: '1px solid var(--border-color)', 
                borderRadius: 'var(--radius-md)', 
                margin: '1rem 0', 
                overflow: 'hidden' 
              }}
            >
              <div 
                className="code-header" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.5rem 1rem', 
                  background: 'rgba(30, 41, 59, 0.8)', 
                  borderBottom: '1px solid var(--border-color)',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)'
                }}
              >
                <span>{part.language.toUpperCase()}</span>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCopy(part.content, part.index)}
                  style={{ 
                    padding: '0.2rem 0.5rem', 
                    fontSize: '0.7rem', 
                    borderRadius: 'var(--radius-sm)' 
                  }}
                >
                  {copiedIndex === part.index ? "Copied! ✓" : "Copy"}
                </button>
              </div>
              <pre style={{ margin: 0, padding: '1rem', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                <code style={{ color: '#E2E8F0' }}>{part.content}</code>
              </pre>
            </div>
          );
        } else {
          return (
            <div 
              key={i} 
              dangerouslySetInnerHTML={{ __html: formatText(part.content) }} 
            />
          );
        }
      })}
    </div>
  );
}

export default MarkdownRenderer;
