require("dotenv").config();
const express = require("express");
const cors = require("cors");

const budgetRoutes = require("./routes/budgets");
const agentRoutes = require("./routes/agent");
const amendmentRoutes = require("./routes/amendments");
const smsRoutes = require("./routes/sms");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "BudgetWatch KE API",
    timestamp: new Date().toISOString(),
    env: {
      gemini: !!process.env.GEMINI_API_KEY,
      supabase: !!process.env.SUPABASE_URL,
    },
  });
});

// Routes
app.use("/api/budgets", budgetRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/amendments", amendmentRoutes);
app.use("/api/sms", smsRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ success: false, error: "File too large (max 20MB)" });
  }
  res.status(500).json({ success: false, error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n🇰🇪 BudgetWatch KE API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
});
