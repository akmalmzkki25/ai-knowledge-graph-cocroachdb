# AetherBio AI v1.0
> **High-Performance Biomedical Knowledge Graph Engine, Multi-Hop Causal Reasoner & AI Drug Discovery Copilot**

---

## 1. Background & Pain Points (Masalah Utama)

Dalam dunia riset biomedis, farmakologi, dan genomik modern, para peneliti menghadapi berbagai tantangan kritis:

1. **Fragmentasi Data Unstructured (PDF Silos):**
   Jutaan artikel ilmiah (PubMed, jurnal klinis, ulasan paten) tersimpan dalam format PDF yang tidak terstruktur. Ekstraksi relasi antara Obat (Drug), Gen (Gene), Protein (Protein), dan Penyakit (Disease) secara manual sangat lambat dan rawan human-error.
2. **Kekacauan Sinonim & Ejaan Varian (Synonym Ambiguity):**
   Entitas biomedis memiliki puluhan nama alias (misal: `p53`, `TP53`, `tumor protein p53`, atau nama dagang seperti `Keytruda` vs `pembrolizumab`). Tanpa penyelarasan otomatis, knowledge graph akan mengalami duplikasi node dan memutus koneksi antargen.
3. **Keterbatasan Navigasi Multi-Hop (Causal Path Discovery):**
   Database relasional standar sulit melakukan penelusuran rantai kausalitas multitingkat (misal: *Bagaimana Obat X menekan Gen Y, yang mempengaruhi Protein Z, hingga meredakan Penyakit W?*).
4. **Isolasi Data & Keamanan Multi-Tenant:**
   Peneliti membutuhkan lingkungan aman untuk menyimpan temuan riset tanpa risiko kebocoran data antar-pengguna atau antar-tim.

---

## 2. End Goals (Tujuan Akhir)

AetherBio AI diciptakan sebagai platform pengolahan knowledge graph biomedis generasi baru dengan visi:
* **Otomasi Ekstraksi Pengetahuan:** Mengubah dokumen ilmiah PDF secara instan menjadi grafis relasi 3-tupel `(Source -> Predicate -> Target)` yang terverifikasi beserta bukti kutipan teks (*evidence snippet*).
* **Visualisasi Interaktif 2D & 3D:** Memungkinkan peneliti menjelajahi jutaan entitas dan relasi genomik dalam kanvas interaktif Cytoscape 2D dan 3D Space Visualizer berbasis fisika.
* **Simulasi Knockout & Causal Reasoning:** Menyediakan alat analitik untuk menemukan jalur kausal tersembunyi hingga 6 *hops* dan mensimulasikan dampak *in-silico gene knockout*.
* **Enterprise-Grade Security & Scalability:** Mendukung multi-tenancy aman berbasis JWT & CockroachDB/PostgreSQL berskala enterprise, terintegrasi penuh dengan Alembic dan Docker.

---

## 3. Key Features & Capabilities (Fitur-Fitur Utama)

### A. Dual Interactive Visualizers (2D Cytoscape & 3D Universe)
* **Kanvas 2D Physics Layout (Cytoscape.js):** Dilengkapi *live search*, penyaring tipe entitas (*Drug, Gene, Protein, Disease*), dan *slider* ambang batas tingkat kepercayaan (*confidence threshold score*).
* **Kanvas 3D Sci-Fi Force Graph:** Visualisasi luar angkasa 3D berkinerja tinggi untuk analisis struktur grafis berskala besar.
* **Context Menu Klik Kanan:**
  * **Isolate Subgraph:** Mengisolasi node dan tetangga terdekatnya untuk fokus analisis.
  * **Simulate Knockout:** Mensimulasikan dampak pembekuan/penghapusan gen terhadap jaringan target.
  * **Ask AI Copilot:** Mengirim entitas langsung ke AI Copilot untuk analisis mendalam.

### B. Automated PDF Ingestion & Entity Resolution Engine
* **Ekstraksi PDF Otomatis:** Mengunggah dokumen PDF dan mengekstrak entitas Biomedis serta relasinya menggunakan NLP & LLM.
* **Fuzzy Entity Resolution (Levenshtein > 85%):** Mesin penyelarasan otomatis yang memetakan alias varian (contoh: `p-53` atau `tumor protein p53` otomatis dilebur ke dalam node kanonis `TP53`).

### C. Multi-Hop Causal Path Finder (Recursive SQL CTE)
* Menelusuri rantai kausalitas terpendek dan paling signifikan antara dua node (misal: Obat A ke Penyakit B) menggunakan query *Recursive Common Table Expression (CTE)* CockroachDB/PostgreSQL hingga 6 *hops* dengan deteksi siklus otomatis.

### D. Embedded AWS Bedrock Mantle GLM-5.2 Copilot
* Asisten AI pintar berkonteks grafis biomedis yang siap menjawab pertanyaan hipotesis, mekanisme aksi obat (*Mechanism of Action*), dan rekomendasi target terapi secara *real-time*.

### E. Superadmin Studio & Multi-Tenant Engine
* Sistem otentikasi JWT aman dengan enkripsi `bcrypt`.
* **Studio Manajemen Pengguna (khusus Superadmin):** Tambah pengguna baru, ubah peran (*Superadmin* vs *Researcher*), dan atur hak akses data.

### F. Complete Dockerization & Alembic Single Source of Truth
* Migrasi skema database dijalankan otomatis saat startup container melalui Alembic (`001_initial_schema` & `002_add_auth_and_user_id`).
* Peluncuran satu klik menggunakan `scripts.bat` (Windows) atau `scripts.sh` (Linux/macOS).

---

## 4. Tech Stack & Architecture

```
                                    +-----------------------------------------+
                                    |        AetherBio AI Frontend            |
                                    |   React 18 + Vite + TailwindCSS + Nginx |
                                    | (2D Cytoscape.js & 3D Force Graph)      |
                                    +--------------------+--------------------+
                                                         |
                                             REST API / JSON (Axios)
                                                         |
                                    +--------------------+--------------------+
                                    |        AetherBio AI Backend             |
                                    |    FastAPI (Python 3.12) + Uvicorn      |
                                    | (Entity Resolver, Path Finder, Ingest)  |
                                    +---------+------------------+------------+
                                              |                  |
                       +----------------------+                  +-----------------------+
                       |                                                                 |
         +-------------+-------------+                                    +--------------+--------------+
         |     Primary Database      |                                    |         AI Engine           |
         | CockroachDB / PostgreSQL  |                                    | AWS Bedrock Mantle GLM-5.2    |
         |  (Alembic Auto-Migration) |                                    |    (OpenAI API Compatible)    |
         +---------------------------+                                    +-----------------------------+
```

---

## 5. Quick Start & Deployment Guide (Cara Penggunaan)

### Prasyarat:
* **Docker** & **Docker Compose** terinstal di sistem Anda.
* Kredensial AWS Bedrock / OpenAI API Key untuk fitur Copilot AI.

### Langkah-Langkah Deployment:

1. **Clone & Masuk ke Direktori Proyek:**
   ```bash
   git clone https://github.com/akmalmzkki25/ai-knowledge-graph-cocroachdb.git
   cd ai-knowledge-graph-cocroachdb
   ```

2. **Siapkan File `.env`:**
   * Di direktori `backend/.env`:
     ```env
     DATABASE_URL="postgresql://postgres:password@host.docker.internal:5432/knowledge_base"
     COCKROACH_URL="cockroachdb://root@host.docker.internal:26257/knowledge_base?sslmode=disable"
     REDIS_URI="redis://:password@host.docker.internal:6379/0"
     OPENAI_API_KEY="your_api_key_here"
     OPENAI_BASE_URL="https://bedrock-mantle.ap-southeast-3.api.aws/v1"
     BEDROCK_MODEL="zai.glm-5"
     ```
   * Di direktori `frontend/.env`:
     ```env
     VITE_API_URL="http://localhost:8000"
     ```

3. **Jalankan Aplikasi (Satu Klik):**
   * **Linux / macOS:**
     ```bash
     chmod +x scripts.sh
     ./scripts.sh
     ```
   * **Windows:**
     ```cmd
     scripts.bat
     ```

4. **Akses Aplikasi:**
   * **Frontend Web Dashboard:** `http://localhost:3000`
   * **Backend REST API Docs:** `http://localhost:8000/docs`
   * **Healthcheck API:** `http://localhost:8000/api/v1/health`

5. **Default Login Credentials:**
   * **Username:** `superadmin`
   * **Password:** `superadminhalmahera123`

---

## 6. Lisensi & Kontribusi

Proyek ini dikembangkan di bawah lisensi MIT. Hak Cipta (c) 2026 **AetherBio AI Team**.
