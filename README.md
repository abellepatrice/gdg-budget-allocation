# 🇰🇪 BudgetWatch KE — County Budget Watchdog Agent

> **GDG Nairobi Agentathon 2026 · Track 04: The County Budget Watchdog**  
> *Built at Simba Corp, Nairobi · 16 May 2026*

---

## The Problem

Every Kenyan county publishes a budget. Almost nobody reads it.

A typical county budget is a 300–400 page PDF written in bureaucratic language, buried on a government website, and inaccessible to the ward residents it directly affects. Billions of shillings leak between allocation and expenditure with no accountability — not because citizens don't care, but because the information was never made usable.

BudgetWatch KE changes that.

---

## What It Does

BudgetWatch KE is a multi-agent AI system that turns any county budget PDF into plain-language answers for ordinary citizens.

| Capability | Description |
|---|---|
| 📄 **PDF Ingestion** | Upload any county budget PDF. The system extracts, chunks, and indexes the full document automatically. |
| 💬 **Natural Language Q&A** | Ask "How much went to roads?" or "What is the health budget?" in plain English. Gemini searches the document and answers. |
| ⚖️ **Amendment Detection** | Upload an original and a revised budget. The agent compares them, identifies every change, and flags HIGH / MEDIUM / LOW risk shifts. |
| 📱 **SMS Digest** | Generates a 160-character budget summary for SMS broadcast — reaching citizens without smartphones or internet. |
| 🗄️ **Persistent Storage** | All documents, chunks, amendment flags, and digests are stored in Supabase Postgres for audit history. |

---

## Agent Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  Landing / Upload  ·  Chat Q&A  ·  Amendments  ·  SMS Digest   │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTP
┌──────────────────────────────▼──────────────────────────────────┐
│                     EXPRESS API  (:3001)                        │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────┐  ┌────────┐  │
│  │  /budgets   │  │   /agent    │  │/amendments │  │  /sms  │  │
│  │  Upload &   │  │  Ask Q&A   │  │  Compare & │  │ Digest │  │
│  │  PDF Parse  │  │  Explain   │  │  Flag Risk │  │  Gen   │  │
│  └──────┬──────┘  └──────┬─────┘  └─────┬──────┘  └───┬────┘  │
│         │                │              │              │        │
│  ┌──────▼──────────────────────────────────────────────▼────┐   │
│  │                  GEMINI 1.5 FLASH                        │   │
│  │  explainBudget · answerQuestion · compareBudgets · SMS   │   │
│  └──────────────────────────┬───────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼───────────────────────────────┐   │
│  │              SUPABASE (PostgreSQL + pgvector)             │   │
│  │  counties · budget_documents · budget_chunks             │   │
│  │  allocations · amendment_flags · sms_digests             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Agent Behaviours

**Upload Agent** — Receives a PDF, calls `pdf-parse` to extract raw text, chunks it into overlapping 1,500-character segments, stores each chunk in Supabase, then immediately triggers Gemini to produce a plain-English explanation and a 3-bullet citizen summary.

**Q&A Agent** — On each question, performs keyword-based retrieval across all stored chunks for the selected document (top-K scoring), assembles context, and prompts Gemini with a citizen-facing system instruction. Returns grounded answers with source awareness.

**Amendment Agent** — Fetches chunk text for two documents, sends both to Gemini with a structured comparison prompt, receives a JSON array of detected changes with department, old/new amounts, percentage change, and risk classification, then persists all flags to `amendment_flags`.

**SMS Agent** — Prompts Gemini to distill a full budget into ≤160 characters in the format citizens can receive via Africa's Talking or Safaricom Bulk SMS. Stores all digests with county association for broadcast history.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI Model | Google Gemini 1.5 Flash (via `@google/generative-ai`) |
| Backend | Node.js · Express.js |
| Frontend | Next.js 14 · Vanilla CSS |
| Database | Supabase (PostgreSQL + pgvector for future semantic search) |
| PDF Parsing | `pdf-parse` |
| File Upload | Multer (memory storage) |
| Deployment | Google Cloud Run (backend) · Firebase Hosting (frontend) |

---

## Running Locally

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier)
- A [Google Gemini API key](https://aistudio.google.com)

### 1. Set up the database

Go to **Supabase → SQL Editor**, paste the contents of `supabase/schema.sql`, and run it. This creates all tables and pre-seeds all 47 Kenyan counties.

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
PORT=3001
```

### 3. Start the backend

```bash
cd backend
npm install
npm run dev     # development with nodemon
# or
npm start       # production
```

Verify: `curl http://localhost:3001/api/health`

### 4. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**

---

## Interacting with the Deployed Version

**Live URL:** `https://budgetwatch-ke.run.app` *(replace with your Cloud Run URL)*

1. **Upload** — Click "Upload a Budget PDF" on the home page. Enter the county name (e.g. *Nairobi*) and drop a budget PDF. The AI explanation appears within seconds.
2. **Ask** — Go to **Ask Budget**, select your document, type any question (e.g. *"How much went to health?"*).
3. **Amendments** — Go to **Amendment Tracker**. Click **Demo Data** for a simulated comparison, or upload two documents and click **Compare**.
4. **SMS** — Go to **SMS Digest**, select a document, click **Generate** to produce a 160-character citizen digest.

### Sample API calls (curl)

```bash
# Upload a budget
curl -X POST http://localhost:3001/api/budgets/upload \
  -F "pdf=@nairobi_budget_2024.pdf" \
  -F "county_name=Nairobi" \
  -F "fiscal_year=2024" \
  -F "document_type=budget"

# Ask a question
curl -X POST http://localhost:3001/api/agent/ask \
  -H "Content-Type: application/json" \
  -d '{"document_id":"<uuid>","question":"How much went to roads?"}'

# Generate SMS digest
curl -X POST http://localhost:3001/api/sms/generate \
  -H "Content-Type: application/json" \
  -d '{"document_id":"<uuid>"}'

# Get simulated amendments (demo, no upload needed)
curl http://localhost:3001/api/amendments/simulate
```

---

## Project Structure

```
budgetwatch-ke/
├── backend/
│   ├── routes/
│   │   ├── budgets.js        # PDF upload, document management
│   │   ├── agent.js          # Gemini Q&A endpoints
│   │   ├── amendments.js     # Budget comparison & risk flagging
│   │   └── sms.js            # SMS digest generation
│   ├── services/
│   │   ├── gemini.js         # All Gemini prompt functions
│   │   ├── supabase.js       # Supabase client
│   │   └── pdf.js            # PDF parsing, chunking, keyword search
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.js         # Root layout + navbar
│   │   ├── globals.css       # Full design system
│   │   ├── page.js           # Landing + upload
│   │   ├── chat/page.js      # Budget Q&A chat interface
│   │   ├── amendments/page.js# Amendment dashboard + risk table
│   │   ├── compare/page.js   # Two-document comparison tool
│   │   └── sms/page.js       # SMS digest generator + history
│   ├── next.config.js
│   └── package.json
├── supabase/
│   └── schema.sql            # Full schema, all 47 counties pre-seeded
└── README.md
```

---

## Screenshots

> Add screenshots here, or link to a short demo video.

| Screen | Description |
|---|---|
| `/` | Hero + PDF upload with real-time AI explanation |
| `/chat` | Document selector + streaming Q&A chat |
| `/amendments` | Risk-flagged amendment table with HIGH/MEDIUM/LOW badges |
| `/sms` | SMS digest generator with 160-character counter |

---

## Team

| Name | Role |
|---|---|
| *Member 1* | Backend & Gemini agent architecture |
| *Member 2* | Frontend & UI/UX |
| *Member 3* | PDF parsing & RAG pipeline |
| *Member 4* | Supabase schema & data layer |
| *Member 5* | Deployment, demo & documentation |

---

## Roadmap (Post-Hackathon)

- Semantic search using pgvector embeddings for more accurate chunk retrieval
- Africa's Talking SMS broadcast integration for direct citizen delivery
- Gazette notice monitor — auto-ingest published amendments via scheduled Cloud Run jobs
- Swahili and Sheng language responses via Gemini multilingual prompting
- Ward-level allocation breakdown and visualisation

---

*BudgetWatch KE — Transparency is a right, not a privilege.*  
**GDG Nairobi Agentathon 2026**