# AI Dictionary

> Where AI meets developers — a single platform delivering curated AI news with full automation.

## Vision

In a world where AI developments happen at breakneck speed, staying informed shouldn't be a full-time job. AI Dictionary exists to bridge that gap by automatically curating, summarizing, and presenting the most relevant AI tools, research, and industry news in one accessible platform. The current codebase is now split across 3 layers: a Next.js frontend, a FastAPI backend, and a LangGraph automation layer.

## What We're Building

AI Dictionary is an AI knowledge platform that combines automated content ingestion with a clean, developer-friendly interface. The platform now pulls from multiple live sources including Product Hunt, NewsAPI, MarkTechPost, and research/scraping workflows, then uses LangGraph agents to generate summaries, titles, slugs, and structured content for publishing. The frontend currently exposes 6 public routes and a richer blog system with dynamic routing, syntax-highlighted code blocks, and reusable content blocks.

### Core Features

#### **Authentication & User Experience**

- Secure cookie-based authentication with JWT (powered by fastapi-users)
- Dark/light mode theming for comfortable reading
- Responsive design that works everywhere

#### **Intelligent Content Pipeline**

- Automated content generation using LangGraph workflows
- Multi-LLM support (Google Gemini, OpenAI, Groq)
- Product Hunt API integration for trending AI tools
- Smart title and summary generation

#### **Modern Blog Platform**

- Dynamic routing for blog posts with unique slugs
- Rich content blocks: code snippets, explanations, examples, images
- Server-side syntax highlighting with Shiki
- Type-safe content rendering system

#### **Robust Backend**

- FastAPI with modular architecture
- Supabase database with row-level security
- Repository pattern for clean data access
- Atomic transactions for data integrity

## Tech Stack

**Frontend:** Next.js 16 · TypeScript · TailwindCSS · Framer Motion  
**Backend:** Python 3.12 · FastAPI · fastapi-users · LangGraph · LangChain  
**Database:** PostgreSQL (Supabase) with RLS  
**AI/LLM:** Google Gemini · OpenAI GPT-4 · Groq  
**Dev Tools:** uv (package manager) · Ruff (backend only) · Pre-commit hooks · TypeScript strict mode

> **Note:** _Ruff linting and formatting is currently enabled for the `backend/` folder only. LangGraph bot integration coming soon._

## Getting Started

### Prerequisites

- Node.js 18+ or latest LTS
- Python 3.12.5
- pnpm (`npm i -g pnpm`)
- [uv](https://docs.astral.sh/uv/getting-started/installation/) (Python package manager)
- [Supabase CLI](https://github.com/supabase/cli?tab=readme-ov-file#install-the-cli)

### Frontend Development

```bash
cd frontend
pnpm install --frozen-lockfile
pnpm dev
```

The frontend will be available at `http://localhost:3000`.

**Environment Setup:** Create `.env.local` in the `frontend/` directory with your configuration (never commit this file).

### Backend Development

The backend uses `uv` for fast, reliable Python package management.

```bash
cd backend
uv sync
uv run uvicorn main:app --reload
# Or alternatively:
# uv run python main.py
```

The API will run at `http://127.0.0.1:8000`.

**Note:** `uv sync` automatically creates a virtual environment and installs all dependencies from `pyproject.toml`.

### Database Setup

1. Install Supabase CLI following the [official guide](https://github.com/supabase/cli?tab=readme-ov-file#install-the-cli)
2. Start local Supabase instance:

   ```bash
   supabase start
   ```

3. Apply migrations:

   ```bash
   supabase migration up
   ```

4. **(Team Members Only)** Link to production:

   ```bash
   supabase link
   ```

### Production Build

```bash
cd frontend
pnpm build
pnpm start
```

## Project Structure

```code
├── frontend/              # Next.js application
│   ├── app/              # Pages and routing
│   ├── components/       # React components
│   ├── lib/              # Utilities and API client
│   └── types/            # TypeScript type definitions
├── backend/              # FastAPI application
│   ├── api/              # API endpoints
│   ├── core/             # Configuration and utilities
│   ├── db/               # Database client and repositories
│   ├── model/            # Pydantic models
│   └── services/         # Business logic and integrations
├── langgraph_bot/        # AI agent workflows
│   ├── agents/           # Agent implementations
│   ├── nodes/            # Workflow nodes
│   ├── tools/            # LangChain tools
│   └── workflow/         # Graph definitions
└── supabase/             # Database configuration
    └── migrations/       # SQL migration files
```

## Development Status

**Current Snapshot:**

- 3 codebases working together: `frontend/`, `backend/`, and `langgraph_bot/`
- 6 public frontend routes, including blog list and dynamic blog detail pages
- 4 active ingestion/research pipelines: Product Hunt, NewsAPI, MarkTechPost, and LangGraph-driven web/PDF research
- 4 Supabase migrations already captured in the repo
- Secure cookie-based authentication with centralized user context management

**Completed:**

- ✅ Authentication system with secure cookie-based JWT
- ✅ Blog platform with dynamic routing and content rendering
- ✅ LangGraph workflows for description, title, slug, and image generation
- ✅ Product Hunt, NewsAPI, and MarkTechPost integrations
- ✅ Database layer with Supabase and RLS
- ✅ Dark/light mode theming
- ✅ Code syntax highlighting
- ✅ Repository pattern for data access

**In Progress:**

- 🔄 Hardening the LangGraph bot workflow and deployment path
- 🔄 Expanding automated content coverage and source diversity
- 🔄 User dashboard and personalization

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.

## Contributing

We welcome contributions! Whether it's bug fixes, new features, or documentation improvements, your help makes AI Dictionary better for everyone.

1. Fork the repository
2. Create your feature branch
3. Follow the existing code style (we use Ruff for Python, ESLint for TypeScript)
4. Write clear commit messages
5. Submit a pull request

---

**Built with ❤️ by developers, for developers.**
