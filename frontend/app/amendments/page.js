"use client";
import { useState, useEffect } from "react";

const API = "http://localhost:3001";

function formatKES(amount) {
  if (!amount && amount !== 0) return "—";
  const abs = Math.abs(amount);
  if (abs >= 1e9) return `KES ${(amount / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `KES ${(amount / 1e6).toFixed(1)}M`;
  return `KES ${amount.toLocaleString()}`;
}

function RiskBadge({ level }) {
  const map = {
    HIGH: "badge-high",
    MEDIUM: "badge-medium",
    LOW: "badge-low",
  };
  return <span className={`badge ${map[level] || "badge-gray"}`}>{level}</span>;
}

function RiskDots({ level }) {
  const dots = level === "HIGH" ? 3 : level === "MEDIUM" ? 2 : 1;
  return (
    <div className="risk-bar">
      {[1, 2, 3].map(i => (
        <div key={i} className={`risk-dot ${i <= dots ? `filled-${level?.toLowerCase()}` : ""}`} />
      ))}
    </div>
  );
}

export default function AmendmentsPage() {
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("simulated"); // "simulated" | "real"
  const [filter, setFilter] = useState("ALL");
  const [documents, setDocuments] = useState([]);
  const [compareForm, setCompareForm] = useState({ original: "", revised: "" });
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSimulated();
    fetch(`${API}/api/budgets`)
      .then(r => r.json())
      .then(d => setDocuments(d.documents || []));
  }, []);

  async function loadSimulated() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/amendments/simulate`);
      const data = await res.json();
      setAmendments(data.changes || []);
      setMode("simulated");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadReal() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/amendments`);
      const data = await res.json();
      setAmendments(data.amendments || []);
      setMode("real");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function compareDocuments() {
    if (!compareForm.original || !compareForm.revised) return;
    setComparing(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/amendments/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_document_id: compareForm.original,
          revised_document_id: compareForm.revised,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setAmendments(data.changes);
      setMode("real");
    } catch (e) {
      setError(e.message);
    } finally {
      setComparing(false);
    }
  }

  const filtered = amendments.filter(a => filter === "ALL" || a.risk_level === filter);
  const highCount = amendments.filter(a => a.risk_level === "HIGH").length;
  const medCount = amendments.filter(a => a.risk_level === "MEDIUM").length;
  const lowCount = amendments.filter(a => a.risk_level === "LOW").length;

  return (
    <>
      <div className="page-header">
        <div className="page-header-inner">
          <div className="page-tag">Budget Amendment Intelligence</div>
          <h1>Amendment Tracker</h1>
          <p>Detect and flag changes between original and revised budget documents. High-risk shifts are highlighted for citizen scrutiny.</p>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 60 }}>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom: 32 }}>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--red)" }}>
            <div className="stat-label">High Risk</div>
            <div className="stat-value" style={{ color: "var(--red)" }}>{highCount}</div>
            <div className="stat-sub">Require immediate review</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--amber)" }}>
            <div className="stat-label">Medium Risk</div>
            <div className="stat-value" style={{ color: "var(--amber)" }}>{medCount}</div>
            <div className="stat-sub">Monitor closely</div>
          </div>
          <div className="stat-card" style={{ borderLeft: "4px solid var(--green)" }}>
            <div className="stat-label">Low Risk</div>
            <div className="stat-value" style={{ color: "var(--green)" }}>{lowCount}</div>
            <div className="stat-sub">Within normal range</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["ALL", "HIGH", "MEDIUM", "LOW"].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="btn"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.75rem",
                  background: filter === f ? "var(--black)" : "transparent",
                  color: filter === f ? "white" : "var(--gray)",
                  borderColor: filter === f ? "var(--black)" : "var(--border)",
                }}>
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-ghost" onClick={loadSimulated} style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
              Demo Data
            </button>
            <button className="btn btn-ghost" onClick={loadReal} style={{ fontSize: "0.8rem", padding: "8px 16px" }}>
              Load Real
            </button>
          </div>
        </div>

        {/* Compare form */}
        {documents.length >= 2 && (
          <div className="card" style={{ marginBottom: 24, background: "var(--off-white)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, marginBottom: 16 }}>
              Compare Two Budget Documents
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
              <div className="field">
                <label className="label">Original Budget</label>
                <select className="input select"
                  value={compareForm.original}
                  onChange={e => setCompareForm({ ...compareForm, original: e.target.value })}>
                  <option value="">Select original…</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.fiscal_year})</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label">Revised Budget</label>
                <select className="input select"
                  value={compareForm.revised}
                  onChange={e => setCompareForm({ ...compareForm, revised: e.target.value })}>
                  <option value="">Select revised…</option>
                  {documents.map(d => (
                    <option key={d.id} value={d.id}>{d.title} ({d.fiscal_year})</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-primary"
                disabled={!compareForm.original || !compareForm.revised || comparing}
                onClick={compareDocuments}>
                {comparing ? <><span className="spinner" /> Analysing…</> : "Compare →"}
              </button>
            </div>
          </div>
        )}

        {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

        {/* Mode indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span className={`badge ${mode === "simulated" ? "badge-gray" : "badge-green"}`}>
            {mode === "simulated" ? "Demo Data" : "Live Data"}
          </span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", color: "var(--gray)" }}>
            {filtered.length} amendment{filtered.length !== 1 ? "s" : ""} shown
          </span>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display: "flex", gap: 12, alignItems: "center", color: "var(--gray)", padding: "40px 0" }}>
            <span className="spinner spinner-dark" />
            <span>Loading amendments…</span>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Original (KES)</th>
                  <th>Revised (KES)</th>
                  <th>Change</th>
                  <th>Risk</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", color: "var(--gray)", padding: "32px" }}>
                      No amendments found
                    </td>
                  </tr>
                ) : filtered.map((a, i) => {
                  const up = a.percentage_change > 0;
                  return (
                    <tr key={a.id || i}>
                      <td>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "0.9rem" }}>
                          {a.department}
                        </div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                        {formatKES(a.old_amount)}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem" }}>
                        {formatKES(a.new_amount)}
                      </td>
                      <td>
                        <span className={`mono ${up ? "amount-up" : "amount-down"}`} style={{ fontSize: "0.9rem" }}>
                          {up ? "▲" : "▼"} {Math.abs(a.percentage_change).toFixed(1)}%
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <RiskBadge level={a.risk_level} />
                          <RiskDots level={a.risk_level} />
                        </div>
                      </td>
                      <td style={{ fontSize: "0.875rem", color: "var(--gray)", maxWidth: 220 }}>
                        {a.notes || a.risk_level === "HIGH" ? (
                          <span style={{ color: a.risk_level === "HIGH" ? "var(--red)" : "inherit" }}>
                            {a.notes || "Significant change — requires explanation"}
                          </span>
                        ) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 20, display: "flex", gap: 24, flexWrap: "wrap" }}>
          {[
            { color: "var(--red)", label: "HIGH RISK: >30% change or >KES 100M swing" },
            { color: "var(--amber)", label: "MEDIUM RISK: 10–30% change or KES 10–100M" },
            { color: "var(--green)", label: "LOW RISK: <10% change, routine adjustment" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--gray)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
