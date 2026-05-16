"use client";
import { useState, useRef, useEffect } from "react";

const API = "http://localhost:3001";

export default function ChatPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "agent",
      text: "Habari! I'm your BudgetWatch KE assistant. Select a budget document on the left, then ask me anything about it — allocations, departments, spending, or anything else.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const bottomRef = useRef();

  useEffect(() => {
    fetch(`${API}/api/budgets`)
      .then(r => r.json())
      .then(d => {
        setDocuments(d.documents || []);
        setLoadingDocs(false);
      })
      .catch(() => setLoadingDocs(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function ask() {
    const q = input.trim();
    if (!q || !selectedDoc || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: q }]);
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/agent/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc, question: q }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessages(m => [...m, { role: "agent", text: data.answer }]);
    } catch (e) {
      setMessages(m => [...m, { role: "agent", text: `⚠ Error: ${e.message}`, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "How much went to roads?",
    "What is the health services budget?",
    "Which department received the highest allocation?",
    "Explain this budget simply.",
    "Are there any unusual allocations?",
    "What was budgeted for education?",
  ];

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-tag">AI-Powered Budget Q&A</div>
          <h1>Ask the Budget</h1>
          <p>Ask any question about a county budget in plain English. Our AI searches the document and gives you a clear answer.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="layout-split">

          {/* ── Sidebar ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="card">
              <div className="label" style={{ marginBottom: 12 }}>Select Budget Document</div>
              {loadingDocs ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--gray)" }}>
                  <span className="spinner spinner-dark" />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>Loading documents…</span>
                </div>
              ) : documents.length === 0 ? (
                <div>
                  <div className="alert alert-info" style={{ marginBottom: 12 }}>
                    No documents uploaded yet.
                  </div>
                  <a href="/" className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>
                    Upload a Budget →
                  </a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {documents.map(doc => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoc(doc.id);
                        setMessages([{
                          role: "agent",
                          text: `I'm ready to answer questions about the **${doc.title}** (${doc.fiscal_year}). What would you like to know?`,
                        }]);
                      }}
                      style={{
                        textAlign: "left",
                        padding: "12px 14px",
                        border: `2px solid ${selectedDoc === doc.id ? "var(--green)" : "var(--border)"}`,
                        background: selectedDoc === doc.id ? "var(--green-pale)" : "white",
                        cursor: "pointer",
                        borderRadius: "var(--radius)",
                        transition: "var(--transition)",
                      }}
                    >
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem", color: selectedDoc === doc.id ? "var(--green)" : "var(--black)" }}>
                        {doc.title}
                      </div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--gray)", marginTop: 3 }}>
                        {doc.counties?.name} · {doc.fiscal_year} · {doc.document_type}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Suggested questions */}
            <div className="card" style={{ background: "var(--off-white)" }}>
              <div className="label" style={{ marginBottom: 12 }}>Suggested Questions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {suggestions.map(s => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    style={{
                      textAlign: "left",
                      background: "none",
                      border: "none",
                      padding: "6px 0",
                      cursor: "pointer",
                      fontSize: "0.88rem",
                      color: "var(--green)",
                      fontFamily: "var(--font-body)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    › {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Chat panel ── */}
          <div>
            <div className="card" style={{ height: 520, display: "flex", flexDirection: "column" }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }} className="chat-container">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`} style={msg.isError ? { borderColor: "var(--red)" } : {}}>
                    {msg.role === "agent" && (
                      <div className="bubble-label">BudgetWatch AI</div>
                    )}
                    <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="chat-bubble agent">
                    <div className="bubble-label">BudgetWatch AI</div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--gray)" }}>
                      <span className="spinner spinner-dark" />
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>Searching budget…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 12 }}>
                {!selectedDoc && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--amber)", marginBottom: 10 }}>
                    ⚠ Select a budget document to start asking questions
                  </div>
                )}
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    className="input"
                    placeholder={selectedDoc ? "Ask anything about the budget…" : "Select a document first…"}
                    value={input}
                    disabled={!selectedDoc || loading}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && ask()}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={ask}
                    disabled={!selectedDoc || !input.trim() || loading}
                    style={{ whiteSpace: "nowrap" }}
                  >
                    {loading ? <span className="spinner" /> : "Ask →"}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--gray)" }}>
              Answers are AI-generated and should be verified against the original document.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
