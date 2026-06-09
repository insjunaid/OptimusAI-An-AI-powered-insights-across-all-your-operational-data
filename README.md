# 🧠 OptimusAI — AI-Powered Operations Intelligence Platform

<div align="center">

**Intelligent operational data analysis powered by Google Gemini AI**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/Gemini-2.5_Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)

</div>

---

## 📋 Overview

OptimusAI is a full-stack operations intelligence platform that enables teams to:

- **📁 Organize** operational data into workspaces (engineering, incident, support, research)
- **📤 Upload** documents (PDF, TXT, CSV, JSON, LOG) and images (PNG, JPG)
- **💬 Chat with AI** using RAG (Retrieval-Augmented Generation) for context-aware answers
- **📊 Summarize** data with multiple AI summary types (operational, incident, full analysis)
- **📈 Dashboard** with real-time stats, activity feed, and AI-generated insights

## 📸 Screenshots



<div align="center">
 <img width="1355" height="630" alt="Screenshot 2026-06-09 212222" src="https://github.com/user-attachments/assets/01934625-58e5-4b64-8282-9dba9928cc93" />

  <br/><br/>
  <img width="1366" height="632" alt="Screenshot 2026-06-09 212258" src="https://github.com/user-attachments/assets/7699706a-2df2-497f-ab84-9f3dd113c2d8" />

  <br/><br/>
  <img width="1348" height="630" alt="Screenshot 2026-06-09 212317" src="https://github.com/user-attachments/assets/468cb718-c8ba-4e45-bf57-a48cced3557b" />

  <br/><br/>
  <img width="1366" height="632" alt="Screenshot 2026-06-09 212351" src="https://github.com/user-attachments/assets/4a629b51-191b-4865-ab00-5808d84d21d4" />

</div>

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)                    │
│         TypeScript • Tailwind CSS • shadcn/ui               │
│    Dashboard │ Workspaces │ Chat │ Upload │ Summarize       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST
┌──────────────────────────┴──────────────────────────────────┐
│                    Backend (FastAPI)                        │
│              Python 3.12 • SQLAlchemy ORM                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │
│  │Workspace │  │ Document │  │   RAG    │  │     AI     │   │
│  │ Service  │  │ Service  │  │ Service  │  │  Service   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘   │
│       │             │            │                          │
│  ┌────┴──────────────┴─────┐ ┌────┴───────────────┴─────┐   │
│  │  SQLite / PostgreSQL    │ │  ChromaDB  │  Gemini AI  │   │
│  └─────────────────────────┘ └────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## ⚡ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 15 + TypeScript | App Router, Server Components |
| **UI** | Tailwind CSS + shadcn/ui | Premium dark-mode UI components |
| **Backend** | FastAPI + Python 3.12 | High-performance async API |
| **AI Model** | Gemini 2.5 Flash | Chat, summarization, vision |
| **Embeddings** | text-embedding-004 | Vector embeddings for RAG |
| **RAG** | LangChain + ChromaDB | Document retrieval pipeline |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Persistent data storage |
| **Vector DB** | ChromaDB | Embedding storage & similarity search |

## 🚀 Quick Start

### Prerequisites

- **Python 3.12+** and **pip**
- **Node.js 20+** and **npm**
- **Google Gemini API Key** — [Get one free](https://aistudio.google.com/app/apikey)

### 1. Clone & Setup Backend

```bash
# Clone the repository
git clone <repo-url>
cd "AI Powered OP Pltf"

# Setup backend
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Mac/Linux

pip install -r requirements.txt

# Configure environment
cp ../.env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Start Backend

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

The API will be live at **http://localhost:8000** with Swagger docs at **http://localhost:8000/docs**

### 3. Setup & Start Frontend

```bash
# In a new terminal
cd frontend
npm install
npm run dev
```

The UI will be live at **http://localhost:3000**

### 4. (Optional) Docker Deployment

```bash
# From project root
cp .env.example .env
# Edit .env with your GEMINI_API_KEY

docker compose up --build
```

This starts PostgreSQL, Backend, and Frontend with proper health checks and ordering.

## 📖 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/workspaces` | Create workspace |
| `GET` | `/api/workspaces` | List workspaces |
| `GET` | `/api/workspaces/{id}` | Get workspace details |
| `DELETE` | `/api/workspaces/{id}` | Delete workspace |
| `POST` | `/api/workspaces/{id}/upload` | Upload file |
| `GET` | `/api/workspaces/{id}/files` | List workspace files |
| `DELETE` | `/api/files/{id}` | Delete file |
| `POST` | `/api/workspaces/{id}/chat` | Send AI chat query |
| `GET` | `/api/workspaces/{id}/chat/history` | Get chat history |
| `POST` | `/api/workspaces/{id}/summarize` | Summarize workspace |
| `POST` | `/api/documents/{id}/summarize` | Summarize document |
| `GET` | `/api/dashboard` | Dashboard aggregated stats |

## 🔄 RAG Pipeline

The platform uses a full RAG (Retrieval-Augmented Generation) pipeline:

1. **Upload** — Files are parsed and text is extracted (PDF → PyPDF2, Images → Gemini Vision)
2. **Chunk** — Text is split into overlapping chunks (1000 chars, 200 overlap)
3. **Embed** — Each chunk is embedded using `text-embedding-004`
4. **Store** — Embeddings are stored in ChromaDB with workspace-scoped collections
5. **Query** — User questions trigger similarity search to find relevant chunks
6. **Generate** — Gemini 2.5 Flash generates answers grounded in retrieved context

## 📁 Project Structure

```
AI Powered OP Pltf/
├── backend/
│   ├── app/
│   │   ├── api/                  # FastAPI route handlers
│   │   │   ├── workspaces.py     # Workspace CRUD
│   │   │   ├── documents.py      # File upload & management
│   │   │   ├── chat.py           # AI chat (RAG)
│   │   │   ├── summarize.py      # AI summarization
│   │   │   └── dashboard.py      # Dashboard stats
│   │   ├── services/             # Business logic
│   │   │   ├── workspace_service.py
│   │   │   ├── document_service.py
│   │   │   ├── rag_service.py    # LangChain + ChromaDB
│   │   │   └── ai_service.py     # Gemini integration
│   │   ├── models/               # Data models
│   │   │   ├── schemas.py        # SQLAlchemy ORM
│   │   │   └── api_models.py     # Pydantic request/response
│   │   ├── database/             # DB connection
│   │   ├── utils/                # File parsing
│   │   ├── config.py             # Settings management
│   │   └── main.py               # FastAPI entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/                  # Next.js App Router pages
│   │   │   ├── page.tsx          # Dashboard
│   │   │   └── workspaces/
│   │   │       ├── page.tsx      # Workspace list
│   │   │       └── [id]/
│   │   │           ├── page.tsx      # Workspace detail
│   │   │           ├── chat/page.tsx # AI Chat
│   │   │           ├── upload/page.tsx # File Upload
│   │   │           └── summarize/page.tsx # AI Summarize
│   │   ├── components/           # React components
│   │   │   ├── layout/sidebar.tsx
│   │   │   └── ui/               # shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts            # API client
│   │       └── utils.ts
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## 🎨 Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Local DB | SQLite | Zero setup for development, same ORM code |
| Production DB | PostgreSQL | Enterprise-grade, via Docker |
| Vector DB | ChromaDB | Lightweight, no server needed for MVP |
| AI Model | Gemini 2.5 Flash | Free tier, fast, multimodal |
| RAG Framework | LangChain | Industry standard, great Gemini integration |
| Frontend | Next.js 15 | Latest App Router, TypeScript, performance |
| UI Library | shadcn/ui | Accessible, customizable, production-quality |

## 📝 License

MIT License — built for educational and demonstration purposes.
