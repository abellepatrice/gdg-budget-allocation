"use client";
import { useState, useEffect } from "react";

const API = "http://localhost:3001";

export default function SMSPage() {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState("");
  const [digests, setDigests] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [latest, setLatest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/budgets`)
      .then(r => r.json())
      .then(d => setDocuments(d.documents || []));

    fetch(`${API}/api/sms`)
      .then(r => r.json())
      .then(d => setDigests(d.digests || []));
  }, []);

  async function generate() {
    if (!selectedDoc || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/sms/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document_id: selectedDoc }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setLatest(data.digest);
      setDigests(prev => [data.digest, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-tag">Citizen Communication Tool</div>
          <h1>SMS Digest Generator</h1>
          <p>Generate concise 160-character SMS summaries of county budgets to share with citizens who don't have internet access.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>

          {/* Left */}
          <div>
            <div className="card">
              <h3 style={{ marginBottom: 20 }}>Generate New Digest</h3>

              {documents.length === 0 ? (
                <div>
                  <div className="alert alert-info" style={{ marginBottom: 16 }}>
                    Upload a budget document first.
                  </div>
                  <a href="/" className="btn btn-primary">Upload Budget →</a>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="field">
                    <label className="label">Select Budget Document</label>
                    <select className="input select"
                      value={selectedDoc}
                      onChange={e => setSelectedDoc(e.target.value)}>
                      <option value="">Choose a budget…</option>
                      {documents.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.title} — {d.counties?.name} {d.fiscal_year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button className="btn btn-primary"
                    disabled={!selectedDoc || generating}
                    onClick={generate}>
                    {generating ? <><span className="spinner" /> Generating with AI…</> : "Generate SMS Digest →"}
                  </button>
                </div>
              )}
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: 16 }}>⚠ {error}</div>}

            {latest && (
              <div className="card animate-in" style={{ marginTop: 20 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12 }}>
                  Latest Generated Digest
                </div>
                <div className="sms-preview">{latest.message}</div>
                <div className={`char-count ${latest.message?.length > 160 ? "over" : ""}`}>
                  {latest.message?.length} / 160 characters
                  {latest.message?.length > 160 && " — over limit, will be split into 2 SMS"}
                </div>

                <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                  <button className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "8px 16px" }}
                    onClick={() => navigator.clipboard?.writeText(latest.message)}>
                    Copy Text
                  </button>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--gray)", alignSelf: "center" }}>
                    {latest.counties?.name && `County: ${latest.counties.name}`}
                  </span>
                </div>
              </div>
            )}

            {/* Info card */}
            <div className="card" style={{ marginTop: 20, background: "var(--off-white)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 12 }}>
                Why SMS Matters
              </div>
              <div style={{ color: "var(--gray)", fontSize: "0.95rem", lineHeight: 1.7 }}>
                <p>Only <strong style={{ color: "var(--black)" }}>43%</strong> of Kenyans have reliable internet access. SMS reaches the other 57% — rural constituents, older citizens, and communities without smartphones.</p>
                <p style={{ marginTop: 8 }}>A 160-character digest can be broadcast via SMS platforms like Africa's Talking, Safaricom Bulk SMS, or ward notice boards.</p>
              </div>
            </div>
          </div>

          {/* Right: history */}
          <div>
            <h3 style={{ marginBottom: 16 }}>Digest History</h3>
            {digests.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: "var(--gray)", padding: "40px" }}>
                <div style={{ fontSize: "2rem", marginBottom: 12 }}>📱</div>
                No digests generated yet. Create your first one!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {digests.map((d, i) => (
                  <div key={d.id || i} className="card animate-in" style={{ animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--gray)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {d.counties?.name || "Unknown County"} · {new Date(d.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className={`badge ${d.message?.length <= 160 ? "badge-green" : "badge-high"}`}>
                        {d.message?.length}ch
                      </span>
                    </div>
                    <div className="sms-preview" style={{ fontSize: "0.78rem", padding: "14px" }}>
                      {d.message}
                    </div>
                    <button
                      className="btn btn-ghost"
                      style={{ marginTop: 10, fontSize: "0.75rem", padding: "6px 14px" }}
                      onClick={() => navigator.clipboard?.writeText(d.message)}>
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
