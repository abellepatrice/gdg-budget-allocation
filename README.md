# 🇰🇪 BudgetWatch KE

> **County Budget Intelligence for Every Kenyan Citizen**

BudgetWatch KE makes Kenyan county budgets understandable to ordinary citizens through AI-powered explanations, natural language Q&A, amendment tracking, and SMS digests.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Supabase Database](#1-supabase-database)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Demo Flow](#demo-flow)
- [Environment Variables](#environment-variables)

---

## Features

| Feature | Description |
|---|---|
| 📄 **PDF Upload** | Upload any county budget PDF — text is extracted and indexed automatically |
| 💬 **AI Q&A** | Ask questions in plain English; Gemini searches the budget and answers |
| ⚖️ **Amendment Tracker** | Compare two budget versions; AI flags HIGH/MEDIUM/LOW risk changes |
| 📱 **SMS Digest** | Generate 160-character budget summaries for SMS broadcast to citizens |
| 🗄️ **Supabase Backend** | All data stored in Postgres with full history |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, Vanilla CSS |
| Backend | Express.js, Node.js |
| AI | Google Gemini 1.5 Flash |
| Database | Supabase (PostgreSQL + pgvector) |
| PDF Parsing | pdf-parse |
| File Upload | Multer |

---

## Prerequisites

- Node.js 18+ and npm
- A [Supabase](https://supabase.com) account (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (Gemini)

---

## Setup

### 1. Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your project dashboard
3. Copy the contents of `supabase/schema.sql` and run it
4. Go to **Project Settings → API** and note:
   - **Project URL** (`SUPABASE_URL`)
   - **service_role** key (`SUPABASE_SERVICE_KEY`) — use this, NOT anon key

### 2. Backend

```bash
cd backend

# Copy env template
cp .env.example .env

# Edit .env with your keys
nano .env

# Install dependencies
npm install

# Start the server
npm run dev   # development (nodemon)
npm start     # production
```

The API will start at **http://localhost:3001**

Verify: `curl http://localhost:3001/api/health`

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js
npm run dev
```

Open **http://localhost:3000**

---

## Environment Variables

### `backend/.env`

```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3001
```

---

## API Reference

### Budgets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budgets` | List all uploaded budget documents |
| `GET` | `/api/budgets/counties` | List all counties |
| `POST` | `/api/budgets/upload` | Upload & process a PDF (multipart/form-data) |
| `GET` | `/api/budgets/:id` | Get document details |
| `DELETE` | `/api/budgets/:id` | Delete a document |

**Upload fields:** `pdf` (file), `county_name`, `fiscal_year`, `document_type`, `title`

### Agent

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent/ask` | Ask a question about a document |
| `POST` | `/api/agent/explain` | Get full AI explanation |

**Body:** `{ "document_id": "uuid", "question": "How much went to roads?" }`

### Amendments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/amendments` | List all amendment flags |
| `POST` | `/api/amendments/compare` | Compare two documents |
| `GET` | `/api/amendments/simulate` | Get demo amendment data |

### SMS

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/sms` | List all generated digests |
| `POST` | `/api/sms/generate` | Generate SMS digest for a document |

---

## Project Structure

```
budgetwatch-ke/
├── backend/
│   ├── routes/
│   │   ├── budgets.js       # PDF upload, document management
│   │   ├── agent.js         # AI Q&A endpoints
│   │   ├── amendments.js    # Budget comparison & flagging
│   │   └── sms.js           # SMS digest generation
│   ├── services/
│   │   ├── gemini.js        # Google Gemini AI integration
│   │   ├── supabase.js      # Supabase client
│   │   └── pdf.js           # PDF parsing & chunking
│   ├── server.js            # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── layout.js        # Root layout + navbar
│   │   ├── globals.css      # Design system
│   │   ├── page.js          # Landing + upload
│   │   ├── chat/page.js     # Budget Q&A chat
│   │   ├── amendments/page.js  # Amendment dashboard
│   │   ├── compare/page.js  # Document comparison
│   │   └── sms/page.js      # SMS digest tool
│   ├── next.config.js
│   └── package.json
├── supabase/
│   └── schema.sql           # Full database schema
├── package.json             # Root scripts
└── README.md
```

---

## Demo Flow

1. **Start both servers** (backend on :3001, frontend on :3000)
2. **Upload a budget PDF** on the home page — enter "Nairobi" as county name
3. **Read the AI explanation** generated immediately after upload
4. **Go to Ask Budget** → select the document → ask "How much went to education?"
5. **Go to Amendments** → click "Demo Data" to see simulated amendment flags
6. **Go to SMS Digest** → select document → click Generate → copy the 160-char digest
7. **(Optional)** Upload a second PDF → go to Compare → run AI comparison

---

## Contributing

This project was built for the Kenya civic tech community. PRs welcome!

---

*BudgetWatch KE — Transparency is a right, not a privilege.*
# gdg-budget-allocation
