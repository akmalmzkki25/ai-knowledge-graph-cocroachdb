from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.graph import Node, Edge

class DrugCompareService:
    @staticmethod
    def compare_drugs(db: Session, drug_a_id: str, drug_b_id: str) -> Dict[str, Any]:
        drug_a = db.query(Node).filter(Node.id == drug_a_id).first()
        drug_b = db.query(Node).filter(Node.id == drug_b_id).first()

        if not drug_a or not drug_b:
            return {"error": "One or both selected drugs not found in database."}

        # Targets of Drug A
        edges_a = db.query(Edge).filter(Edge.source_node_id == drug_a_id).all()
        targets_a = {
            e.target_node_id: {
                "id": str(e.target_node_id),
                "name": e.target_node.canonical_name if e.target_node else str(e.target_node_id),
                "type": e.target_node.entity_type if e.target_node else "Entity",
                "predicate": e.predicate,
                "confidence": e.confidence_score
            }
            for e in edges_a if e.target_node_id
        }

        # Targets of Drug B
        edges_b = db.query(Edge).filter(Edge.source_node_id == drug_b_id).all()
        targets_b = {
            e.target_node_id: {
                "id": str(e.target_node_id),
                "name": e.target_node.canonical_name if e.target_node else str(e.target_node_id),
                "type": e.target_node.entity_type if e.target_node else "Entity",
                "predicate": e.predicate,
                "confidence": e.confidence_score
            }
            for e in edges_b if e.target_node_id
        }

        shared_target_ids = set(targets_a.keys()).intersection(set(targets_b.keys()))
        unique_a_ids = set(targets_a.keys()) - shared_target_ids
        unique_b_ids = set(targets_b.keys()) - shared_target_ids

        shared_targets = [targets_a[tid] for tid in shared_target_ids]
        unique_a_targets = [targets_a[tid] for tid in unique_a_ids]
        unique_b_targets = [targets_b[tid] for tid in unique_b_ids]

        # Calculate synergy potential score
        synergy_score = round(len(shared_targets) * 0.4 + (len(unique_a_targets) + len(unique_b_targets)) * 0.2, 2)

        return {
            "drug_a": {"id": str(drug_a.id), "name": drug_a.canonical_name},
            "drug_b": {"id": str(drug_b.id), "name": drug_b.canonical_name},
            "shared_targets": shared_targets,
            "unique_drug_a_targets": unique_a_targets,
            "unique_drug_b_targets": unique_b_targets,
            "synergy_score": min(synergy_score, 0.99),
            "summary": f"Drug {drug_a.canonical_name} and {drug_b.canonical_name} share {len(shared_targets)} common targets and have {len(unique_a_targets) + len(unique_b_targets)} distinct pathways."
        }

drug_compare_service = DrugCompareService()
