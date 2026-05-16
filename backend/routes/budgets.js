const express = require("express");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const router = express.Router();

const supabase = require("../services/supabase");
const { extractTextFromPDF, chunkText } = require("../services/pdf");
const { explainBudget, generateSimpleSummary } = require("../services/gemini");

// Multer config — memory storage (no disk writes needed)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are accepted"), false);
  },
});

// GET /api/budgets — list all budget documents
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("budget_documents")
      .select("*, counties(name, code)")
      .order("uploaded_at", { ascending: false });

    if (error) throw error;
    res.json({ success: true, documents: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/budgets/counties — list all counties
router.get("/counties", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("counties")
      .select("*")
      .order("name");
    if (error) throw error;
    res.json({ success: true, counties: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/budgets/upload — upload and process a budget PDF
router.post("/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No PDF file provided" });
    }

    const { county_name, fiscal_year, document_type, title } = req.body;

    // 1. Ensure county exists (upsert by name)
    let countyId;
    {
      const { data: existing } = await supabase
        .from("counties")
        .select("id")
        .ilike("name", county_name || "Unknown County")
        .single();

      if (existing) {
        countyId = existing.id;
      } else {
        const { data: newCounty, error: countyErr } = await supabase
          .from("counties")
          .insert({
            name: county_name || "Unknown County",
            code: (county_name || "UNK").slice(0, 3).toUpperCase(),
          })
          .select("id")
          .single();
        if (countyErr) throw countyErr;
        countyId = newCounty.id;
      }
    }

    // 2. Extract text from PDF
    const { text, numPages } = await extractTextFromPDF(req.file.buffer);

    // 3. Create budget document record
    const { data: docRecord, error: docErr } = await supabase
      .from("budget_documents")
      .insert({
        county_id: countyId,
        title: title || req.file.originalname.replace(".pdf", ""),
        fiscal_year: fiscal_year || new Date().getFullYear().toString(),
        document_type: document_type || "budget",
        file_url: `uploaded:${req.file.originalname}`,
      })
      .select()
      .single();

    if (docErr) throw docErr;

    // 4. Chunk text and store in budget_chunks
    const chunks = chunkText(text);
    const chunkRecords = chunks.map((chunk, i) => ({
      document_id: docRecord.id,
      chunk_text: chunk.text,
      page_number: Math.floor((i / chunks.length) * numPages) + 1,
    }));

    // Insert in batches of 50
    for (let i = 0; i < chunkRecords.length; i += 50) {
      const batch = chunkRecords.slice(i, i + 50);
      const { error: chunkErr } = await supabase
        .from("budget_chunks")
        .insert(batch);
      if (chunkErr) throw chunkErr;
    }

    // 5. Generate AI explanation
    const explanation = await explainBudget(text, county_name);
    const summary = await generateSimpleSummary(text);

    res.json({
      success: true,
      document: docRecord,
      numPages,
      numChunks: chunks.length,
      explanation,
      summary,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/budgets/:id — get document details
router.get("/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("budget_documents")
      .select("*, counties(name, code), budget_chunks(id, page_number)")
      .eq("id", req.params.id)
      .single();
    if (error) throw error;
    res.json({ success: true, document: data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/budgets/:id — delete a document and all associated data
router.delete("/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("budget_documents")
      .delete()
      .eq("id", req.params.id);
    if (error) throw error;
    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
