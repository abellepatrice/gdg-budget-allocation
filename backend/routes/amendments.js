const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");
const { compareBudgets } = require("../services/gemini");

// GET /api/amendments — list all amendment flags
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("amendment_flags")
      .select(
        `*,
        original:budget_documents!amendment_flags_original_document_fkey(title, fiscal_year, counties(name)),
        revised:budget_documents!amendment_flags_revised_document_fkey(title, fiscal_year, counties(name))`
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, amendments: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/amendments/compare — compare two budget documents
router.post("/compare", async (req, res) => {
  try {
    const { original_document_id, revised_document_id } = req.body;

    if (!original_document_id || !revised_document_id) {
      return res.status(400).json({
        success: false,
        error: "original_document_id and revised_document_id are required",
      });
    }

    // Fetch text chunks for both documents
    const [origChunks, revChunks] = await Promise.all([
      supabase
        .from("budget_chunks")
        .select("chunk_text")
        .eq("document_id", original_document_id)
        .limit(30),
      supabase
        .from("budget_chunks")
        .select("chunk_text")
        .eq("document_id", revised_document_id)
        .limit(30),
    ]);

    if (origChunks.error) throw origChunks.error;
    if (revChunks.error) throw revChunks.error;

    const originalText = origChunks.data.map((c) => c.chunk_text).join("\n");
    const revisedText = revChunks.data.map((c) => c.chunk_text).join("\n");

    // Compare using Gemini
    const changes = await compareBudgets(originalText, revisedText);

    // Store flags in Supabase
    const flagRecords = changes.map((change) => ({
      original_document: original_document_id,
      revised_document: revised_document_id,
      department: change.department,
      old_amount: change.old_amount,
      new_amount: change.new_amount,
      percentage_change: change.percentage_change,
      risk_level: change.risk_level,
    }));

    const { data: inserted, error: insertErr } = await supabase
      .from("amendment_flags")
      .insert(flagRecords)
      .select();

    if (insertErr) throw insertErr;

    res.json({
      success: true,
      changes: inserted,
      summary: `Found ${changes.length} budget changes between the two documents`,
    });
  } catch (err) {
    console.error("Compare error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/amendments/simulate — return simulated amendment data for demo
router.get("/simulate", async (req, res) => {
  const simulated = [
    {
      id: "sim-1",
      department: "Health Services",
      old_amount: 850000000,
      new_amount: 1020000000,
      percentage_change: 20.0,
      risk_level: "MEDIUM",
      notes: "Increased allocation for primary healthcare facilities",
    },
    {
      id: "sim-2",
      department: "Roads & Infrastructure",
      old_amount: 620000000,
      new_amount: 480000000,
      percentage_change: -22.6,
      risk_level: "MEDIUM",
      notes: "Reduced allocation — verify ongoing project timelines",
    },
    {
      id: "sim-3",
      department: "Education",
      old_amount: 340000000,
      new_amount: 510000000,
      percentage_change: 50.0,
      risk_level: "HIGH",
      notes: "Significant increase — confirm detailed spending plan",
    },
    {
      id: "sim-4",
      department: "Water & Sanitation",
      old_amount: 290000000,
      new_amount: 310000000,
      percentage_change: 6.9,
      risk_level: "LOW",
      notes: "Marginal increase aligned with inflation",
    },
    {
      id: "sim-5",
      department: "Agriculture",
      old_amount: 180000000,
      new_amount: 95000000,
      percentage_change: -47.2,
      risk_level: "HIGH",
      notes: "Major cut — citizens should demand explanation",
    },
    {
      id: "sim-6",
      department: "ICT & Innovation",
      old_amount: 45000000,
      new_amount: 120000000,
      percentage_change: 166.7,
      risk_level: "HIGH",
      notes: "Dramatic increase — verify procurement plan",
    },
  ];
  res.json({ success: true, changes: simulated });
});

module.exports = router;
