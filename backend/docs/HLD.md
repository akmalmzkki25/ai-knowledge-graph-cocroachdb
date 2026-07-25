# High Level Design (HLD) Document

## Project Title: Dynamic Causal Discovery & Hypothesis Graph System (`KnowledgeBase-BioGraph`)

---

## 1. System Architecture Overview

The **KnowledgeBase-BioGraph** platform is organized as a decoupled, multi-tiered micro-service architecture designed for ultra-resilient distributed data processing, graph storage, and real-time AI reasoning.

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             FRONTEND LAYER (React + Bun)                         │
│   ┌─────────────────────┐  ┌───────────────────────┐  ┌─────────────────────┐   │
│   │ Interactive Canvas  │  │ Ingestion Workbench   │  │  Hypothesis Studio  │   │
│   │ (Cytoscape / D3.js) │  │  (Drag-and-Drop PDF)  │  │  (Causal Path View) │   │
│   └──────────┬──────────┘  └───────────┬───────────┘  └──────────┬──────────┘   │
└──────────────┼─────────────────────────┼─────────────────────────┼──────────────┘
               │ HTTP REST (JSON)        │ WebSocket (Live Stream) │
┌──────────────▼─────────────────────────▼─────────────────────────▼──────────────┐
│                              BACKEND LAYER (FastAPI)                             │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌────────────────────┐ │
│  │ Ingestion & Parser API │  │  Causal Discovery API  │  │ Graph Linting API  │ │
│  └───────────┬────────────┘  └───────────┬────────────┘  └─────────┬──────────┘ │
│              │                           │                         │            │
│  ┌───────────▼───────────────────────────▼─────────────────────────▼──────────┐ │
│  │                     Service Layer & LLM Orchestrator                      │ │
│  │   • Bedrock GLM 5.2 Extraction Worker   • Entity Resolver & Deduplicator   │ │
│  │   • Multi-Hop Path Mining Engine        • Graph Health & Contradiction Lint│ │
│  └───────────┬───────────────────────────┬─────────────────────────┬──────────┘ │
└──────────────┼───────────────────────────┼─────────────────────────┼────────────┘
               │                           │                         │
┌──────────────▼────────────┐  ┌───────────▼────────────┐  ┌─────────▼────────────┐
│  COCKROACH / POSTGRES DB  │  │   REDIS CACHE & QUEUE  │  │ AWS BEDROCK MANTLE │
│     (`knowledge_base`)    │  │  (Pub/Sub, Query Cache)│  │     (GLM 5.2)      │
│  • Nodes & Edges Tables   │  │  • Fast Traversal Cache│  │ • Causal Triplet   │
│  • Provenance & Audit Logs│  │  • Async Ingestion Q   │  │   Extraction API   │
└───────────────────────────┘  └────────────────────────┘  └────────────────────┘
```

---

## 2. Technology Stack Matrix

| Component Layer | Technology Chosen | Rationale & Specifications |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.12 + `uv`) | High-performance asynchronous REST API, OpenAPI docs, and `uv` package management. |
| **Distributed Graph Database** | CockroachDB / PostgreSQL 16 | Distributed ACID compliance, Postgres wire compatibility, JSONB indexing, and horizontal scaling (`knowledge_base`). |
| **Cache & Event Queue** | Redis 7 | In-memory query caching, WebSocket pub/sub broadcasting, and rate-limiting. |
| **LLM Inference Provider** | AWS Bedrock Mantle | Model: `zai.glm-5` via OpenAI SDK compatibility layer (`https://bedrock-mantle.ap-southeast-3.api.aws/v1`). |
| **Frontend Framework** | React 18 + Bun + Vite | Lightning fast JS bundle compiler with Bun runtime, TailwindCSS styling, and Cytoscape.js visual graph rendering. |
| **Data Migration** | Alembic | Version-controlled database schema migrations. |

---

## 3. Database Schema Specifications (`knowledge_base`)

The system stores the canonical Knowledge Graph nodes, edges, hypotheses, and provenance logs using optimized SQL tables and JSONB columns.

```sql
-- 1. Source Documents Table
CREATE TABLE IF NOT EXISTS source_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(512) NOT NULL,
    authors TEXT,
    publication_date DATE,
    journal VARCHAR(256),
    doi VARCHAR(256) UNIQUE,
    file_hash VARCHAR(64) UNIQUE NOT NULL,
    raw_content TEXT NOT NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- 2. Biological Nodes Table (Entities / Concepts)
CREATE TABLE IF NOT EXISTS nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_name VARCHAR(256) NOT NULL,
    entity_type VARCHAR(64) NOT NULL, -- e.g., 'Gene', 'Protein', 'Drug', 'Disease', 'Pathway', 'Symptom'
    aliases JSONB DEFAULT '[]'::jsonb, -- Array of synonym strings e.g. ["p53", "TP53"]
    attributes JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    CONSTRAINT uq_canonical_name_type UNIQUE (canonical_name, entity_type)
);

-- Index for fast canonical name lookup
CREATE INDEX idx_nodes_type_name ON nodes (entity_type, canonical_name);

-- 3. Causal Edges Table (Relationships)
CREATE TABLE IF NOT EXISTS edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    predicate VARCHAR(128) NOT NULL, -- e.g., 'INHIBITS', 'ACTIVATES', 'UPREGULATES', 'DOWNREGULATES', 'BINDS_TO'
    causal_direction VARCHAR(32) DEFAULT 'DIRECTED', -- 'DIRECTED', 'BIDIRECTIONAL', 'INHIBITORY'
    confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    evidence_snippet TEXT NOT NULL,
    source_document_id UUID REFERENCES source_documents(id) ON DELETE SET NULL,
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- Composite index for rapid 2-hop / 3-hop recursive SQL traversals
CREATE INDEX idx_edges_source_target ON edges (source_node_id, target_node_id, predicate);
CREATE INDEX idx_edges_target_source ON edges (target_node_id, source_node_id, predicate);

-- 4. Hypotheses Table
CREATE TABLE IF NOT EXISTS hypotheses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(512) NOT NULL,
    summary TEXT NOT NULL,
    causal_path_json JSONB NOT NULL, -- Ordered array of node IDs and edge IDs forming the chain
    confidence_score FLOAT NOT NULL,
    status VARCHAR(32) DEFAULT 'DRAFT', -- 'DRAFT', 'VERIFIED', 'REJECTED'
    reviewer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ DEFAULT clock_timestamp()
);

-- 5. Audit & Operations Log Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(64) NOT NULL, -- 'INGEST', 'DEDUPLICATE', 'MERGE_NODE', 'LINT_CONTRADICTION'
    details_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT clock_timestamp()
);
```

---

## 4. LLM Causal Extraction Pipeline (AWS Bedrock Mantle)

The LLM Ingestion pipeline reads text chunks from `source_documents` and invokes **AWS Bedrock Mantle (`zai.glm-5`)** via the OpenAI Python SDK compatibility layer.

```python
# LLM Integration Configuration
from openai import OpenAI

bedrock_client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
    project=settings.BEDROCK_PROJECT,
)
```

---

## 5. Multi-Hop Causal Path Mining Algorithm

To discover novel hypotheses connecting unlinked entities (e.g., finding how `Drug A` might treat `Disease C` through intermediate pathways), the engine uses recursive CTE queries combined with graph scoring:

$$Score(P) = \prod_{e \in P} \text{confidence}(e) \times \frac{1}{|P|^\gamma}$$

Where $|P|$ is path length (hops) and $\gamma = 0.5$ penalizes excessively long paths.

---

## 6. Deployment & Operational Manual

1. **Start CockroachDB Container (Optional/via Docker)**:
   ```bash
   docker compose up -d cockroachdb
   ```
2. **Setup Backend Python Environment & Migrate DB**:
   ```bash
   cd backend
   uv venv
   uv pip install -e .
   uv run alembic upgrade head
   ```
3. **Start FastAPI Backend Server**:
   ```bash
   uv run uvicorn app.main:app --reload --port 8000
   ```
4. **Start React Frontend Development Server (with Bun)**:
   ```bash
   cd frontend
   bun install
   bun run dev
   ```
