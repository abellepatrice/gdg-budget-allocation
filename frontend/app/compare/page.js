"use client";
import { useState, useEffect } from "react";

const API = "http://localhost:3001";

export default function ComparePage() {
  const [documents, setDocuments] = useState([]);
  const [form, setForm] = useState({ original: "", revised: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/budgets`)
      .then(r => r.json())
      .then(d => setDocuments(d.documents || []));
  }, []);

  async function compare() {
    if (!form.original || !form.revised) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/amendments/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_document_id: form.original,
          revised_document_id: form.revised,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-tag">Budget Comparison Tool</div>
          <h1>Compare Budgets</h1>
          <p>Select two uploaded budget documents to compare them side-by-side. Our AI will identify all changes and flag anomalies.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>
        <div className="card" style={{ maxWidth: 700, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 20 }}>Select Documents to Compare</h3>

          {documents.length < 2 ? (
            <div>
              <div className="alert alert-info" style={{ marginBottom: 16 }}>
                You need at least 2 budget documents uploaded to use this comparison tool.
              </div>
              <a href="/" className="btn btn-primary">Upload Budgets →</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="field">
                <label className="label">Original / Earlier Budget</label>
                <select className="input select"
                  value={form.original}
                  onChange={e => setForm({ ...form, original: e.target.value })}>
                  <option value="">Select original budget…</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.title} — {d.counties?.name} {d.fiscal_year}</option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: "center", fontFamily: "var(--font-mono)", fontSize: "0.8rem", color: "var(--gray)" }}>
                vs.
              </div>

              <div className="field">
                <label className="label">Revised / Amended Budget</label>
                <select className="input select"
                  value={form.revised}
                  onChange={e => setForm({ ...form, revised: e.target.value })}>
                  <option value="">Select revised budget…</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.title} — {d.counties?.name} {d.fiscal_year}</option>
                  ))}
                </select>
              </div>

              <button className="btn btn-primary"
                disabled={!form.original || !form.revised || loading || form.original === form.revised}
                onClick={compare}
                style={{ alignSelf: "flex-start" }}>
                {loading ? <><span className="spinner" /> Analysing with AI…</> : "Run Comparison →"}
              </button>

              {form.original === form.revised && form.original && (
                <div className="alert alert-error">Please select two different documents to compare.</div>
              )}
            </div>
          )}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

        {result && (
          <div className="animate-in">
            <div className="alert alert-success" style={{ marginBottom: 24 }}>
              ✓ {result.summary}
            </div>
            <a href="/amendments" className="btn btn-primary">
              View in Amendment Tracker →
            </a>
          </div>
        )}
      </div>
    </>
  );
}
