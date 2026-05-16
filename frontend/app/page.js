"use client";
import { useState, useRef } from "react";

const API = "http://localhost:3001";

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [form, setForm] = useState({
    county_name: "",
    fiscal_year: new Date().getFullYear().toString(),
    document_type: "budget",
    title: "",
  });
  const fileRef = useRef();

  async function handleUpload(file) {
    if (!file || file.type !== "application/pdf") {
      setError("Please select a valid PDF file.");
      return;
    }
    if (!form.county_name.trim()) {
      setError("Please enter the county name.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const fd = new FormData();
    fd.append("pdf", file);
    fd.append("county_name", form.county_name);
    fd.append("fiscal_year", form.fiscal_year);
    fd.append("document_type", form.document_type);
    fd.append("title", form.title || file.name.replace(".pdf", ""));

    try {
      const res = await fetch(`${API}/api/budgets/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {/* ── Hero ── */}
      <section style={{
        background: "var(--black)",
        padding: "80px 0 0",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "linear-gradient(rgba(13,127,63,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(13,127,63,0.05) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          pointerEvents: "none",
        }} />

        <div className="container" style={{ position: "relative" }}>
          <div style={{ maxWidth: 700 }}>
            <div className="page-tag animate-in">
              🇰🇪 County Budget Intelligence Platform
            </div>
            <h1 style={{
              color: "white",
              fontSize: "clamp(2.8rem, 7vw, 5rem)",
              marginBottom: 24,
              marginTop: 16,
            }} className="animate-in animate-delay-1">
              Your County's<br />
              <span style={{ color: "var(--green-light)" }}>Money, Explained.</span>
            </h1>
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "1.25rem", lineHeight: 1.6, marginBottom: 40 }} className="animate-in animate-delay-2">
              Upload any Kenyan county budget PDF and instantly get plain-English explanations, AI-powered Q&A, amendment tracking, and SMS digests for citizens.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }} className="animate-in animate-delay-3">
              <a href="/chat" className="btn btn-primary">Ask a Budget Question</a>
              <a href="/amendments" className="btn" style={{ background: "transparent", color: "white", border: "2px solid rgba(255,255,255,0.3)" }}>
                View Amendments
              </a>
            </div>
          </div>

          {/* Stats strip */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 1,
            marginTop: 64,
            background: "rgba(255,255,255,0.06)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}>
            {[
              { n: "47", label: "Counties" },
              { n: "AI", label: "Powered Analysis" },
              { n: "100%", label: "Open Source" },
            ].map((s) => (
              <div key={s.label} style={{ padding: "28px 32px", textAlign: "center" }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: "2.2rem", fontWeight: 800, color: "var(--green-light)" }}>{s.n}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upload section ── */}
      <section style={{ padding: "60px 0" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

            {/* Left: Upload form */}
            <div>
              <h2 style={{ marginBottom: 8 }}>Upload a Budget PDF</h2>
              <p style={{ color: "var(--gray)", marginBottom: 28 }}>
                Start by uploading a county budget document. Our AI will extract, analyse, and make it accessible.
              </p>

              <div className="card" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div className="field">
                  <label className="label">County Name *</label>
                  <input className="input" placeholder="e.g. Nairobi, Kisumu, Mombasa…"
                    value={form.county_name}
                    onChange={e => setForm({ ...form, county_name: e.target.value })}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div className="field">
                    <label className="label">Fiscal Year</label>
                    <input className="input" placeholder="2024" value={form.fiscal_year}
                      onChange={e => setForm({ ...form, fiscal_year: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label className="label">Document Type</label>
                    <select className="input select" value={form.document_type}
                      onChange={e => setForm({ ...form, document_type: e.target.value })}>
                      <option value="budget">Approved Budget</option>
                      <option value="supplementary">Supplementary</option>
                      <option value="estimates">Estimates</option>
                      <option value="report">Budget Report</option>
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label className="label">Document Title (optional)</label>
                  <input className="input" placeholder="e.g. Nairobi FY2024 Annual Budget"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                  />
                </div>

                {/* Drop zone */}
                <div
                  className={`upload-zone ${dragging ? "drag-over" : ""}`}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files[0];
                    if (f) handleUpload(f);
                  }}
                >
                  <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📄</div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>
                    Drop PDF here or click to browse
                  </div>
                  <div style={{ color: "var(--gray)", fontSize: "0.875rem" }}>
                    Accepts PDF files up to 20MB
                  </div>
                  <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
                    onChange={e => e.target.files[0] && handleUpload(e.target.files[0])}
                  />
                </div>

                {uploading && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, color: "var(--gray)" }}>
                    <span className="spinner spinner-dark" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.8rem" }}>
                      Extracting text & running AI analysis…
                    </span>
                  </div>
                )}

                {error && <div className="alert alert-error">⚠ {error}</div>}
              </div>
            </div>

            {/* Right: Result / how it works */}
            {result ? (
              <div className="animate-in">
                <div className="alert alert-success" style={{ marginBottom: 20 }}>
                  ✓ Successfully processed {result.numPages} pages into {result.numChunks} chunks
                </div>

                <div className="card" style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    AI Explanation
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "0.97rem" }}>
                    {result.explanation}
                  </div>
                </div>

                <div className="card" style={{ background: "var(--off-white)" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>
                    Quick Summary
                  </div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>{result.summary}</div>
                </div>

                <div style={{ marginTop: 20, display: "flex", gap: 12 }}>
                  <a href="/chat" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }}>
                    Ask Questions →
                  </a>
                  <a href="/sms" className="btn btn-ghost" style={{ flex: 1, justifyContent: "center" }}>
                    SMS Digest
                  </a>
                </div>

                <div style={{ marginTop: 12, fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--gray)" }}>
                  Document ID: {result.document?.id}
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ marginBottom: 8 }}>How it works</h2>
                <p style={{ color: "var(--gray)", marginBottom: 28 }}>
                  Three steps to full budget transparency.
                </p>
                {[
                  { n: "01", title: "Upload Budget PDF", desc: "We extract and index every page of your county budget using advanced PDF parsing." },
                  { n: "02", title: "AI Analyses It", desc: "Google Gemini reads the budget and creates plain-English summaries, answers, and risk flags." },
                  { n: "03", title: "Citizens Get Answers", desc: "Ask any question about the budget, compare amendments, or receive an SMS digest." },
                ].map((step) => (
                  <div key={step.n} style={{ display: "flex", gap: 20, marginBottom: 28 }}>
                    <div style={{
                      minWidth: 48, height: 48,
                      background: "var(--green-pale)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontWeight: 800, color: "var(--green)",
                      fontSize: "0.9rem", borderRadius: "var(--radius)",
                    }}>{step.n}</div>
                    <div>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 4 }}>{step.title}</div>
                      <div style={{ color: "var(--gray)", fontSize: "0.95rem" }}>{step.desc}</div>
                    </div>
                  </div>
                ))}

                <div className="card" style={{ background: "var(--black)", border: "none" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--green-light)", letterSpacing: "0.1em", marginBottom: 10 }}>
                    QUICK DEMO QUESTIONS
                  </div>
                  {[
                    "How much went to roads?",
                    "What is the health budget?",
                    "Which department got the most money?",
                    "Are there any suspicious amendments?",
                  ].map((q) => (
                    <div key={q} style={{
                      padding: "8px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.6)",
                    }}>
                      › {q}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section style={{ background: "var(--off-white)", padding: "60px 0", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <h2 style={{ textAlign: "center", marginBottom: 8 }}>Platform Features</h2>
          <p style={{ textAlign: "center", color: "var(--gray)", marginBottom: 40, maxWidth: 500, margin: "0 auto 40px" }}>
            Built for civic transparency in the Kenyan context
          </p>
          <div className="grid-3">
            {[
              { icon: "💬", title: "AI Budget Q&A", desc: "Ask questions in plain English. Get answers about any allocation, project, or department.", href: "/chat" },
              { icon: "⚖️", title: "Amendment Tracker", desc: "Detect budget changes between original and revised documents. Flag high-risk shifts.", href: "/amendments" },
              { icon: "📱", title: "SMS Digest", desc: "Generate 160-character budget summaries to share with citizens via text message.", href: "/sms" },
            ].map(f => (
              <a key={f.title} href={f.href} className="card" style={{ textDecoration: "none", color: "inherit", display: "block", transition: "var(--transition)" }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                onMouseLeave={e => e.currentTarget.style.transform = ""}>
                <div style={{ fontSize: "2rem", marginBottom: 16 }}>{f.icon}</div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "1.1rem", marginBottom: 8 }}>{f.title}</div>
                <div style={{ color: "var(--gray)", fontSize: "0.95rem" }}>{f.desc}</div>
                <div style={{ marginTop: 16, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.75rem", color: "var(--green)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Open →
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
