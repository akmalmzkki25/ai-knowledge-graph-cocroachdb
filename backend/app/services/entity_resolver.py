from typing import Optional, List, Dict
from difflib import SequenceMatcher
from sqlalchemy.orm import Session
from app.models.graph import Node

class EntityResolverEngine:
    """
    Bio-Medical Entity Resolution Engine using Fuzzy Levenshtein Distance Matching (>85% similarity threshold).
    Merges variant spellings (e.g. 'p-53', 'p53-protein' -> 'TP53') into a single canonical graph node.
    """

    def __init__(self):
        # Known Biomedical Synonym Dictionary
        self.alias_dictionary: Dict[str, str] = {
            "p53": "TP53",
            "p-53": "TP53",
            "p53 protein": "TP53",
            "tumor protein p53": "TP53",
            "brca-1": "BRCA1",
            "brca 1": "BRCA1",
            "egfr-gene": "EGFR",
            "pd1": "PDCD1",
            "pd-1": "PDCD1",
            "pembrolizumab": "Keytruda",
            "keytruda": "Keytruda"
        }

    def _fuzzy_similarity(self, a: str, b: str) -> float:
        """Calculate normalized Levenshtein sequence similarity ratio (0.0 to 1.0)"""
        return SequenceMatcher(None, a.lower().strip(), b.lower().strip()).ratio()

    def resolve_canonical_name(self, raw_entity_name: str) -> str:
        """Resolve raw entity string to canonical entity name if recognized in dictionary"""
        clean_name = raw_entity_name.strip()
        lower_name = clean_name.lower()
        if lower_name in self.alias_dictionary:
            return self.alias_dictionary[lower_name]
        return clean_name

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
            aliases=[name],
            attributes={}
        )
        db.add(new_node)
        db.commit()
        db.refresh(new_node)
        return new_node

entity_resolver = EntityResolverEngine()
