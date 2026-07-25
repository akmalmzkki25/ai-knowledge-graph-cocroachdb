from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.graph import Edge, Node

class GraphLinterEngine:
    OPPOSITE_PREDICATES = {
        "ACTIVATES": ["INHIBITS", "SUPPRESSES", "DOWNREGULATES"],
        "INHIBITS": ["ACTIVATES", "PROMOTES", "UPREGULATES"],
        "UPREGULATES": ["DOWNREGULATES", "INHIBITS", "SUPPRESSES"],
        "DOWNREGULATES": ["UPREGULATES", "ACTIVATES", "PROMOTES"],
        "TREATS": ["CAUSES", "EXACERBATES"],
        "CAUSES": ["TREATS", "PREVENTS"]
    }

    @classmethod
    def scan_contradictions(cls, db: Session) -> List[Dict[str, Any]]:
        # Fetch all edges with their source & target canonical names
        query = text("""
            SELECT 
                e1.id AS edge1_id,
                n1.canonical_name AS source_name,
                n2.canonical_name AS target_name,
                e1.predicate AS pred1,
                e1.confidence_score AS conf1,
                e1.evidence_snippet AS ev1,
                e2.id AS edge2_id,
                e2.predicate AS pred2,
                e2.confidence_score AS conf2,
                e2.evidence_snippet AS ev2
            FROM edges e1
            JOIN edges e2 ON e1.source_node_id = e2.source_node_id AND e1.target_node_id = e2.target_node_id AND e1.id < e2.id
            JOIN nodes n1 ON e1.source_node_id = n1.id
            JOIN nodes n2 ON e1.target_node_id = n2.id
        """)
        
        rows = db.execute(query).fetchall()
        contradictions = []

        for r in rows:
            pred1 = r.pred1.upper()
            pred2 = r.pred2.upper()

            if pred1 in cls.OPPOSITE_PREDICATES and pred2 in cls.OPPOSITE_PREDICATES[pred1]:
                contradictions.append({
                    "source_entity": r.source_name,
                    "target_entity": r.target_name,
                    "edge_1": {
                        "id": str(r.edge1_id),
                        "predicate": r.pred1,
                        "confidence": r.conf1,
                        "evidence": r.ev1
                    },
                    "edge_2": {
                        "id": str(r.edge2_id),
                        "predicate": r.pred2,
                        "confidence": r.conf2,
                        "evidence": r.ev2
                    },
                    "severity": "HIGH" if abs(r.conf1 - r.conf2) < 0.2 else "MEDIUM"
                })

        return contradictions

graph_linter = GraphLinterEngine()
