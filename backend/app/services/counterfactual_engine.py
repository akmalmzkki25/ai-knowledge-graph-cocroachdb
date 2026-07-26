import uuid
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.graph import Node, Edge

class CounterfactualSimulationEngine:
    @staticmethod
    def _get_predicate_sign(predicate: str) -> int:
        p = (predicate or "").upper()
        if any(w in p for w in ["INHIBIT", "DOWNREGULATE", "SUPPRESS", "BLOCK", "PREVENT"]):
            return -1
        if any(w in p for w in ["ACTIVATE", "UPREGULATE", "STIMULATE", "PROMOTE", "CAUSE", "ENHANCE"]):
            return 1
        return 1  # Default positive interaction

    @classmethod
    def simulate_knockout(
        cls, 
        db: Session, 
        target_node_id: Optional[str] = None, 
        node_id: Optional[str] = None, 
        max_depth: int = 3
    ) -> Dict[str, Any]:
        actual_id_str = str(target_node_id or node_id or "").strip()
        if not actual_id_str:
            return {"error": "Target node_id is required"}

        try:
            # Match UUID object or string representation
            try:
                target_uuid = uuid.UUID(actual_id_str)
            except ValueError:
                target_uuid = actual_id_str

            target_node = db.query(Node).filter(
                (Node.id == target_uuid) | (Node.id == actual_id_str)
            ).first()

            if not target_node:
                return {"error": f"Target node '{actual_id_str}' not found"}

            target_id_val = str(target_node.id)

            # BFS Queue: (node_id_str, current_sign_multiplier, current_depth)
            queue = [(target_id_val, -1, 1)] # Knockout initial state multiplier = -1
            visited = {target_id_val}
            cascading_effects = []

            while queue:
                curr_id_str, curr_sign, depth = queue.pop(0)
                if depth > max_depth:
                    continue

                try:
                    curr_uuid = uuid.UUID(curr_id_str)
                except ValueError:
                    curr_uuid = curr_id_str

                outgoing_edges = db.query(Edge).filter(
                    (Edge.source_node_id == curr_uuid) | (Edge.source_node_id == curr_id_str)
                ).all()

                for edge in outgoing_edges:
                    if not edge.target_node_id:
                        continue
                    
                    target_edge_id_str = str(edge.target_node_id)
                    if target_edge_id_str in visited:
                        continue

                    visited.add(target_edge_id_str)
                    edge_sign = cls._get_predicate_sign(edge.predicate)
                    
                    # Mathematical Signed Signal Propagation
                    net_impact_sign = curr_sign * edge_sign
                    impact_description = "DOWNREGULATED / INHIBITED" if net_impact_sign < 0 else "UPREGULATED / ACTIVATED"

                    tgt_node = edge.target_node
                    cascading_effects.append({
                        "node_id": target_edge_id_str,
                        "node_name": tgt_node.canonical_name if tgt_node else target_edge_id_str,
                        "node_type": tgt_node.entity_type if tgt_node else "Entity",
                        "depth_level": depth,
                        "predicate": edge.predicate,
                        "net_impact_sign": net_impact_sign,
                        "predicted_status": impact_description,
                        "confidence_score": edge.confidence_score
                    })

                    queue.append((target_edge_id_str, net_impact_sign, depth + 1))

            return {
                "knocked_out_node": {
                    "id": str(target_node.id),
                    "name": target_node.canonical_name,
                    "type": target_node.entity_type
                },
                "total_downstream_impacted": len(cascading_effects),
                "cascading_effects": cascading_effects
            }
        except Exception as e:
            print(f"Error executing knockout simulation: {e}")
            return {
                "error": f"Simulation failed: {str(e)}",
                "total_downstream_impacted": 0,
                "cascading_effects": []
            }

counterfactual_engine = CounterfactualSimulationEngine()
