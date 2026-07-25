from difflib import SequenceMatcher
from typing import Dict, Optional, List
from sqlalchemy.orm import Session
from app.models.graph import Node

class EntityResolverEngine:
    def __init__(self):
        # Known synonym mappings for bio-entities
        self.alias_dictionary: Dict[str, str] = {
            "p53": "TP53",
            "tumor protein p53": "TP53",
            "p-53": "TP53",
            "egfr": "EGFR",
            "erbb1": "EGFR",
            "her1": "EGFR",
            "gefitinib": "Gefitinib",
            "iressa": "Gefitinib",
            "erlotinib": "Erlotinib",
            "tarceva": "Erlotinib",
            "brca1": "BRCA1",
            "brca-1": "BRCA1",
            "akt": "AKT1",
            "akt1": "AKT1",
            "pten": "PTEN",
            "myna": "MYC",
            "c-myc": "MYC",
            "myc": "MYC"
        }

    @staticmethod
    def _clean_str(text: str) -> str:
        if not text:
            return ""
        return text.replace("\x00", "").strip()

    @staticmethod
    def _fuzzy_similarity(s1: str, s2: str) -> float:
        return SequenceMatcher(None, s1.lower(), s2.lower()).ratio()

    def resolve_canonical_name(self, raw_name: str) -> str:
        clean_raw = self._clean_str(raw_name)
        lower_raw = clean_raw.lower()
        if lower_raw in self.alias_dictionary:
            return self.alias_dictionary[lower_raw]
        return clean_raw

    def get_or_create_canonical_node(
        self,
        db: Session,
        name: str,
        entity_type: str = "Entity",
        similarity_threshold: float = 0.85
    ) -> Node:
        canonical_name = self.resolve_canonical_name(name)
        
        # 1. Exact canonical name match
        existing_node = db.query(Node).filter(Node.canonical_name.ilike(canonical_name)).first()
        if existing_node:
            return existing_node

        # 2. Fuzzy Levenshtein Distance Match (>85% similarity threshold)
        all_nodes = db.query(Node).all()
        for node in all_nodes:
            sim = self._fuzzy_similarity(canonical_name, node.canonical_name)
            if sim >= similarity_threshold:
                # Merge into existing canonical node alias
                self.alias_dictionary[canonical_name.lower()] = node.canonical_name
                return node

        # 3. Create new canonical node if no fuzzy match found
        new_node = Node(
            canonical_name=canonical_name,
            entity_type=entity_type,
            metadata_json={"aliases": [name]}
        )
        db.add(new_node)
        db.commit()
        db.refresh(new_node)
        return new_node

entity_resolver = EntityResolverEngine()
