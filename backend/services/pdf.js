const pdfParse = require("pdf-parse");

/**
 * Extract text from a PDF buffer
 */
async function extractTextFromPDF(buffer) {
  const data = await pdfParse(buffer);
  return {
    text: data.text,
    numPages: data.numpages,
    info: data.info,
  };
}

/**
 * Chunk text into overlapping segments for RAG
 */
function chunkText(text, chunkSize = 1500, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      text: text.slice(start, end),
      start,
      end,
    });
    start += chunkSize - overlap;
  }
  return chunks;
}

/**
 * Simple keyword-based search over chunks
 */
function searchChunks(chunks, query, topK = 5) {
  const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

  const scored = chunks.map((chunk, index) => {
    const lower = chunk.chunk_text.toLowerCase();
    const score = queryWords.reduce((acc, word) => {
      const count = (lower.match(new RegExp(word, "g")) || []).length;
      return acc + count;
    }, 0);
    return { ...chunk, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((c) => c.chunk_text)
    .join("\n\n---\n\n");
}

module.exports = { extractTextFromPDF, chunkText, searchChunks };
