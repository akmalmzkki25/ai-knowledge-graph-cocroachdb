import json
import csv
import io
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.graph import Node, Edge, Hypothesis

class DataExporterService:
    @staticmethod
    def export_json_ld(db: Session) -> Dict[str, Any]:
        nodes = db.query(Node).all()
        edges = db.query(Edge).all()

        graph_ld = []
        for n in nodes:
            graph_ld.append({
                "@id": f"urn:biograph:node:{n.id}",
                "@type": n.entity_type,
                "name": n.canonical_name,
                "aliases": n.aliases or []
            })

        for e in edges:
            graph_ld.append({
                "@id": f"urn:biograph:edge:{e.id}",
                "@type": "CausalRelationship",
                "predicate": e.predicate,
                "subject": f"urn:biograph:node:{e.source_node_id}",
                "object": f"urn:biograph:node:{e.target_node_id}",
                "confidence": e.confidence_score,
                "evidence": e.evidence_snippet
            })

        return {
            "@context": {
                "@vocab": "https://schema.org/",
                "CausalRelationship": "https://bioportal.bioontology.org/ontologies/CAUSAL",
                "predicate": "http://purl.org/dc/terms/relation",
                "confidence": "http://schema.org/ratingValue",
                "evidence": "http://schema.org/citation"
            },
            "@graph": graph_ld
        }

    @staticmethod
    def export_marp_slides(db: Session) -> str:
        hypotheses = db.query(Hypothesis).all()
        
        slides = [
            "---",
            "marp: true",
            "theme: default",
            "paginate: true",
            "backgroundColor: #0f172a",
            "color: #f8fafc",
            "---",
            "\n# 🧬 Knowledge Base BioGraph",
            "## AI-Synthesized Research Hypotheses & Causal Discoveries\n",
            "---"
        ]

        if not hypotheses:
            slides.append("\n# No Active Hypotheses\nIngest documents to generate AI hypotheses.")
        else:
            for h in hypotheses:
                slides.append(f"""
# 🔬 Hypothesis: {h.title}

**Confidence Score:** {int(h.confidence_score * 100)}% | **Status:** {h.status}

### Summary:
{h.summary}

---
""")
        return "\n".join(slides)

    @staticmethod
    def export_edges_csv(db: Session) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Edge_ID", "Source_Node_ID", "Target_Node_ID", "Predicate", "Confidence_Score", "Evidence_Snippet"])
        
        edges = db.query(Edge).all()
        for e in edges:
            writer.writerow([str(e.id), str(e.source_node_id), str(e.target_node_id), e.predicate, e.confidence_score, e.evidence_snippet])
            
        return output.getvalue()

exporter_service = DataExporterService()
