from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.graph import Node, Edge, SourceDocument, Hypothesis

class GraphAnalyticsEngine:
    @staticmethod
    def get_network_statistics(db: Session) -> Dict[str, Any]:
        total_nodes = db.query(Node).count()
        total_edges = db.query(Edge).count()
        total_documents = db.query(SourceDocument).count()
        total_hypotheses = db.query(Hypothesis).count()

        # Top Hub Entities (highest degree centrality)
        query = text("""
            SELECT 
                n.id, 
                n.canonical_name, 
                n.entity_type, 
                COUNT(e.id) AS connection_count
            FROM nodes n
            JOIN edges e ON n.id = e.source_node_id OR n.id = e.target_node_id
            GROUP BY n.id, n.canonical_name, n.entity_type
            ORDER BY connection_count DESC
            LIMIT 5;
        """)
        
        hub_rows = db.execute(query).fetchall()
        top_hubs = [
            {
                "id": str(r.id),
                "name": r.canonical_name,
                "type": r.entity_type,
                "connections": r.connection_count
            }
            for r in hub_rows
        ]

        # Calculate average confidence
        avg_conf_query = text("SELECT AVG(confidence_score) FROM edges;")
        avg_confidence = db.execute(avg_conf_query).scalar() or 0.85

        return {
            "total_nodes": total_nodes,
            "total_edges": total_edges,
            "total_documents": total_documents,
            "total_hypotheses": total_hypotheses,
            "average_confidence": round(float(avg_confidence), 2),
            "top_hub_entities": top_hubs
        }

analytics_engine = GraphAnalyticsEngine()
