from typing import List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.graph import Node, Edge, Hypothesis

class CausalDiscoveryEngine:
    @staticmethod
    def discover_paths(db: Session, start_node_id: str, target_node_id: str, max_hops: int = 4) -> List[Dict[str, Any]]:
        query = text("""
        WITH RECURSIVE causal_path(source_id, target_id, path, hops, cumulative_confidence) AS (
            SELECT 
                e.source_node_id, 
                e.target_node_id, 
                ARRAY[e.source_node_id::text, e.target_node_id::text] AS path,
                1 AS hops,
                e.confidence_score AS cumulative_confidence
            FROM edges e
            WHERE e.source_node_id = :start_id

            UNION ALL

            SELECT 
                e.source_node_id, 
                e.target_node_id, 
                cp.path || e.target_node_id::text,
                cp.hops + 1,
                cp.cumulative_confidence * e.confidence_score
            FROM edges e
            JOIN causal_path cp ON e.source_node_id = cp.target_id
            WHERE cp.hops < :max_hops AND NOT (e.target_node_id::text = ANY(cp.path))
        )
        SELECT path, hops, cumulative_confidence 
        FROM causal_path 
        WHERE target_id = :target_id 
        ORDER BY cumulative_confidence DESC 
        LIMIT 20;
        """)
        
        result = db.execute(query, {
            "start_id": start_node_id, 
            "target_id": target_node_id, 
            "max_hops": max_hops
        })
        
        paths = []
        for row in result:
            paths.append({
                "path_node_ids": row.path,
                "hops": row.hops,
                "confidence_score": float(row.cumulative_confidence)
            })
        return paths

causal_engine = CausalDiscoveryEngine()
