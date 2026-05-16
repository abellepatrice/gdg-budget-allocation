const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");
const { searchChunks } = require("../services/pdf");
const { answerQuestion } = require("../services/gemini");

// POST /api/agent/ask — ask a question about a budget document
router.post("/ask", async (req, res) => {
  try {
    const { document_id, question } = req.body;

    if (!document_id || !question) {
      return res.status(400).json({
        success: false,
        error: "document_id and question are required",
      });
    }

    // Fetch chunks for this document
    const { data: chunks, error } = await supabase
      .from("budget_chunks")
      .select("chunk_text, page_number")
      .eq("document_id", document_id)
      .order("page_number");

    if (error) throw error;
    if (!chunks || chunks.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No budget content found for this document",
      });
    }

    // Keyword search to find relevant chunks
    const context = searchChunks(chunks, question, 6);

    // Ask Gemini
    const answer = await answerQuestion(question, context);

    res.json({ success: true, answer, chunksSearched: chunks.length });
  } catch (err) {
    console.error("Agent ask error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agent/explain — get full plain-English explanation
router.post("/explain", async (req, res) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ success: false, error: "document_id is required" });
    }

    // Get all chunks and join them
    const { data: chunks, error } = await supabase
      .from("budget_chunks")
      .select("chunk_text")
      .eq("document_id", document_id)
      .order("page_number")
      .limit(20);

    if (error) throw error;

    const fullText = chunks.map((c) => c.chunk_text).join("\n");
    const { explainBudget } = require("../services/gemini");
    const explanation = await explainBudget(fullText);

    res.json({ success: true, explanation });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
