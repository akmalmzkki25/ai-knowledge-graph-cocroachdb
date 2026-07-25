# Product Requirements Document (PRD)

## Project Title: Dynamic Causal Discovery & Hypothesis Graph System (`KnowledgeBase-BioGraph`)

---

## 1. Executive Summary & Vision

In modern biomedical research and drug discovery, millions of research papers, clinical trial results, and molecular interaction studies are published annually. Traditional Retrieval-Augmented Generation (RAG) models suffer from a fundamental flaw: they treat knowledge as static, disposable chunks, rediscovering connections from scratch on every prompt without persistent accumulation or causal synthesis.

**KnowledgeBase-BioGraph** is an enterprise-grade, distributed **LLM-Wiki and Causal Knowledge Graph Platform**. Built on top of **CockroachDB**, **Redis**, **AWS Bedrock (GLM 5.2 Mantle)**, **FastAPI**, and **React**, the system continuously ingests biomedical literature, extracts high-confidence causal triplets `(Subject, Causal Mechanism, Object)`, resolves entity ambiguities, and builds a compounding, version-controlled Causal Knowledge Graph. The system autonomously generates novel research hypotheses by synthesizing multi-hop causal paths across previously unlinked scientific publications.

---

## 2. Problem Statement

1. **Information Fragmentation**: A single drug target or disease pathway is scattered across thousands of PubMed abstracts, clinical trials, and genomic databases. No single researcher can read and synthesize all connections.
2. **Loss of Causal Context in Traditional RAG**: Standard vector search returns chunks based on keyword/semantic similarity, missing complex directed causal chains such as:  
   $$\text{Drug X} \xrightarrow{\text{inhibits}} \text{Protein Y} \xrightarrow{\text{downregulates}} \text{Gene Z} \xrightarrow{\text{suppresses}} \text{Tumor Growth}$$
3. **Lack of Compounding Knowledge & Provenance**: Chatbot interactions disappear into chat history. There is no persistent, auditable record showing *why* a hypothesis was proposed and *which specific sentences* in which papers support or contradict it.
4. **Race Conditions in Multi-Agent Knowledge Curation**: When multiple AI agents or researchers update the knowledge base concurrently, traditional file-based or flat-file approaches suffer from data corruption and write conflicts.

---

## 3. Product Goals & Objectives

| Objective | Target Metric | Description |
| :--- | :--- | :--- |
| **Causal Triplet Precision** | $\ge 92\%$ Extraction Accuracy | Accurately extract directed biological relationships with explicit confidence scores and evidence text. |
| **Multi-Hop Hypothesis Mining** | 2 to 5-hop Path Discovery | Discover indirect causal links connecting disparate research domains (e.g., Target A $\rightarrow$ Pathway B $\rightarrow$ Disease C). |
| **Entity Resolution & Deduplication** | $< 1\%$ Duplicate Rate | Automatically resolve synonyms and aliases (e.g., "TP53", "p53", "Tumor Protein p53") to a canonical entity node. |
| **ACID Multi-Agent Concurrency** | Zero Data Corruption | Support concurrent node/edge insertions and updates via CockroachDB / PostgreSQL distributed transactions. |
| **Query Latency** | $< 200\text{ ms}$ for 3-hop graph traversal | Perform high-speed recursive graph queries backed by SQL index & Redis caching. |

---

## 4. Target Personas & Core User Stories

### Personas:
1. **Dr. Aris (Lead Computational Biologist)**: Wants to input 100 new research papers on oncology targets and instantly see how they alter the existing drug target graph.
2. **Siti (Pharmacologist / Drug Discovery Researcher)**: Wants to query potential off-target effects of a small molecule compound by exploring multi-step causal pathways.
3. **Dr. Budi (R&D Director)**: Wants to review AI-generated research hypotheses with strict provenance tracking before allocating lab experiments.

### Key User Stories:
* *As a Researcher*, I want to upload PDFs or PubMed DOIs so that the system ingests and integrates new findings into the persistent knowledge graph automatically.
* *As a Pharmacologist*, I want to ask *"What downstream genes are suppressed when Receptor A is inhibited?"* and receive a verified 3-hop causal graph with paper citations.
* *As an R&D Lead*, I want the system to run periodic "Linting" to detect contradictions between old trial results and new publication claims.

---

## 5. System Scope & Functional Requirements

```
                                  [ INGESTION LAYER ]
                          (PubMed / PDF / Clinical Data / Text)
                                            │
                                            ▼
                               [ AWS BEDROCK - GLM 5.2 ]
                     (Causal Triplet & Entity Extraction Pipeline)
                                            │
                                            ▼
                            [ ENTITY RESOLUTION & DEDUP ]
                           (Canonical Mapping & Vector Fused)
                                            │
                                            ▼
                             [ COCKROACHDB / POSTGRES & REDIS ]
                     (Distributed Graph Storage + Caching + Log)
                                            │
                                            ▼
                          [ CAUSAL DISCOVERY ENGINE & LINT ]
                    (Multi-Hop Hypothesis Generator & Contradictions)
                                            │
                                            ▼
                             [ FASTAPI + REACT GRAPH UI ]
                        (Cytoscape / Matrix / Hypothesis Studio)
```

### Module 1: Document Ingestion & Source Provenance Engine
* Support raw text, Markdown, PDF, and PubMed XML/JSON ingestion.
* Assign an immutable `source_id`, cryptographic hash (`sha256`), and metadata (authors, publication date, journal, DOI) to every ingested source.

### Module 2: LLM Causal Triplet Extraction (GLM 5.2 via AWS Bedrock Mantle)
* Extract directed causal relations using a JSON Schema:
  * `Subject Entity`: (Name, Type: Protein|Gene|Drug|Disease|Pathway|Symptom, Aliases).
  * `Predicate / Causal Mechanism`: (`INHIBITS`, `ACTIVATES`, `UPREGULATES`, `DOWNREGULATES`, `BINDS_TO`, `CAUSES`, `TREATS`, `ASSOCIATED_WITH`).
  * `Object Entity`: (Name, Type, Aliases).
  * `Causal Direction`: Directed (`A -> B`), Bi-directional (`A <-> B`), or Inhibitory (`A -| B`).
  * `Confidence Score`: Float ($0.00$ to $1.00$).
  * `Evidence Snippet`: Exact sentence excerpt from source document.

### Module 3: Distributed Graph Database Schema (`knowledge_base`)
* **Nodes Table**: Unique ID, canonical name, entity type, JSONB attributes, synonyms, vector embedding (for semantic matching).
* **Edges Table**: ID, source_node_id, target_node_id, predicate, causal_direction, weight/confidence, source_document_id, evidence_quote, created_at.
* **Hypotheses Table**: ID, title, description, causal_path (JSON array of node IDs), confidence_score, status (`DRAFT`, `VERIFIED`, `REJECTED`).
* **Audit Logs Table**: Chronological, append-only log of all `INGEST`, `MUTATION`, `DEDUPLICATION`, and `LINT` operations.

### Module 4: Dynamic Causal Discovery & Hypothesis Mining
* **Multi-Hop Traversal**: Algorithmically search for indirect paths between unlinked entities (e.g., `Drug A -> Gene B -> Disease C` where no direct link `Drug A -> Disease C` exists in literature).
* **Counterfactual Reasoning**: Simulate parameter changes (e.g., *"If Gene X is knocked out, what downstream signaling pathways are affected?"*).
* **Hypothesis Synthesizer**: Periodically aggregate orphan pathways and generate actionable scientific hypotheses with supporting evidence chains.

### Module 5: Graph Health & Automated Linting
* **Contradiction Detection**: Flag edges where Document A claims `X ACTIVATES Y` with high confidence, but Document B claims `X INHIBITS Y`.
* **Orphan & Stale Node Cleanup**: Identify isolated entities lacking incoming/outgoing edges or outdated claims superseded by newer randomized controlled trials (RCTs).
* **Entity Resolution Engine**: Merge near-duplicate node entries using hybrid string distance (Jaro-Winkler) and semantic embedding cosine similarity.

### Module 6: Interactive Web Workspace (React + Bun)
* **Interactive Cytoscape / D3 Graph Canvas**: Visual representation of nodes and directed causal edges with color-coded relationship types.
* **Hypothesis Evaluation Studio**: Dedicated view to inspect AI-generated hypotheses, review supporting quotes, and approve/reject candidates.
* **Document Ingest Console**: Drag-and-drop file upload with live extraction progress logs via WebSocket.

---

## 6. Non-Functional Requirements (NFRs)

* **Consistency & Reliability**: CockroachDB / PostgreSQL transactions ensure serializable isolation level for graph mutations.
* **Performance**: Sub-200ms response time for 3-hop SQL recursive CTE queries; Redis cached graph queries under 15ms.
* **Auditability & Provenance**: Every edge must trace back to an exact sentence in a verified source document.
* **Security & Auth**: Strict API key validation, CORS protection, rate limiting, and encrypted environment storage.

---

## 7. System KPI Matrix

| Metric | Target | Verification Method |
| :--- | :--- | :--- |
| **Ingestion Pipeline Throughput** | $> 50$ pages/min | Benchmark script with multi-threaded PDF ingestion |
| **Graph Traversal Depth** | Up to 5-hop chains | Recursive SQL query execution on 100,000+ edge dataset |
| **Deduplication Precision** | $> 95\%$ correct merges | Synthetic benchmark test set of biological entity synonyms |
| **Redis Cache Hit Ratio** | $> 80\%$ for query API | Redis `INFO stats` tracking |
