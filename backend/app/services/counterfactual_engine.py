from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.graph import Node, Edge

class CounterfactualSimulationEngine:
    @staticmethod
    def _get_predicate_sign(predicate: str) -> int:
        p = predicate.upper()
        if any(w in p for w in ["INHIBIT", "DOWNREGULATE", "SUPPRESS", "BLOCK", "PREVENT"]):
            return -1
        if any(w in p for w in ["ACTIVATE", "UPREGULATE", "STIMULATE", "PROMOTE", "CAUSE", "ENHANCE"]):
            return 1
        return 1  # Default positive interaction

    @classmethod
    def simulate_knockout(cls, db: Session, target_node_id: str, max_depth: int = 3) -> Dict[str, Any]:
        target_node = db.query(Node).filter(Node.id == target_node_id).first()
        if not target_node:
            return {"error": "Target node not found"}

        # BFS Queue: (node_id, current_sign_multiplier, current_depth)
        queue = [(target_node_id, -1, 1)] # Knockout initial state multiplier = -1
        visited = {target_node_id}
        cascading_effects = []

        while queue:
            curr_id, curr_sign, depth = queue.pop(0)
            if depth > max_depth:
                continue

            outgoing_edges = db.query(Edge).filter(Edge.source_node_id == curr_id).all()
            for edge in outgoing_edges:
                if not edge.target_node_id or edge.target_node_id in visited:
                    continue

                visited.add(edge.target_node_id)
                edge_sign = cls._get_predicate_sign(edge.predicate)
                # Mathematical Signed Signal Propagation
                net_impact_sign = curr_sign * edge_sign

                impact_description = "DOWNREGULATED / INHIBITED" if net_impact_sign < 0 else "UPREGULATED / ACTIVATED"

                tgt_node = edge.target_node
                cascading_effects.append({
                    "node_id": str(edge.target_node_id),
                    "node_name": tgt_node.canonical_name if tgt_node else str(edge.target_node_id),
                    "node_type": tgt_node.entity_type if tgt_node else "Entity",
                    "depth_level": depth,
                    "predicate": edge.predicate,
                    "net_impact_sign": net_impact_sign,
                    "predicted_status": impact_description,
                    "confidence_score": edge.confidence_score
                })

                queue.append((edge.target_node_id, net_impact_sign, depth + 1))

        return {
            "knocked_out_node": {
                "id": str(target_node.id),
                "name": target_node.canonical_name,
                "type": target_node.entity_type
            },
            "total_downstream_impacted": len(cascading_effects),
            "cascading_effects": cascading_effects
        }

counterfactual_engine = CounterfactualSimulationEngine()
