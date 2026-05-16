const express = require("express");
const router = express.Router();

const supabase = require("../services/supabase");
const { generateSMSDigest } = require("../services/gemini");

// GET /api/sms — list all SMS digests
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("sms_digests")
      .select("*, counties(name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, digests: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sms/generate — generate SMS digest for a document
router.post("/generate", async (req, res) => {
  try {
    const { document_id } = req.body;

    if (!document_id) {
      return res.status(400).json({ success: false, error: "document_id is required" });
    }

    // Fetch document + county info
    const { data: doc, error: docErr } = await supabase
      .from("budget_documents")
      .select("*, counties(name, id)")
      .eq("id", document_id)
      .single();

    if (docErr) throw docErr;

    // Fetch budget text
    const { data: chunks, error: chunkErr } = await supabase
      .from("budget_chunks")
      .select("chunk_text")
      .eq("document_id", document_id)
      .limit(15);

    if (chunkErr) throw chunkErr;

    const budgetText = chunks.map((c) => c.chunk_text).join("\n");
    const countyName = doc.counties?.name || "County";

    const message = await generateSMSDigest(budgetText, countyName);

    // Store in sms_digests table
    const { data: digest, error: digestErr } = await supabase
      .from("sms_digests")
      .insert({
        county_id: doc.counties?.id,
        message: message.trim(),
      })
      .select()
      .single();

    if (digestErr) throw digestErr;

    res.json({
      success: true,
      digest,
      characterCount: message.trim().length,
    });
  } catch (err) {
    console.error("SMS generate error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
