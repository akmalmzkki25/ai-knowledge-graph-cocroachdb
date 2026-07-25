import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.core.config import settings
from app.services.bedrock_service import bedrock_service
from app.models.graph import Node, Edge

class GraphCopilotService:
    @staticmethod
    def answer_question(db: Session, user_query: str) -> Dict[str, Any]:
        # Fetch summary of available nodes and edges for context
        nodes = db.query(Node).limit(30).all()
        edges = db.query(Edge).limit(50).all()

        node_context = [{"id": str(n.id), "name": n.canonical_name, "type": n.entity_type} for n in nodes]
        edge_context = [
            {
                "source": str(e.source_node.canonical_name if e.source_node else e.source_node_id),
                "predicate": e.predicate,
                "target": str(e.target_node.canonical_name if e.target_node else e.target_node_id),
                "source_id": str(e.source_node_id),
                "target_id": str(e.target_node_id)
            }
            for e in edges
        ]

        prompt = f"""
You are KnowledgeBase-BioGraph AI Copilot, an expert biomedical reasoning assistant.
Answer the user's research question using the provided Knowledge Graph context.

User Question: {user_query}

Knowledge Graph Nodes Context:
{json.dumps(node_context)}

Knowledge Graph Relationships Context:
{json.dumps(edge_context)}

Respond in valid JSON matching this schema:
{{
  "answer_markdown": "Detailed, professional answer in markdown format explaining the biological mechanism.",
  "highlight_node_ids": ["Array of UUID strings of nodes mentioned or relevant"],
  "highlight_edge_ids": []
}}
"""
        response = bedrock_service.client.chat.completions.create(
            model=settings.BEDROCK_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2
        )

        raw_output = response.choices[0].message.content.strip()
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]

        try:
            parsed = json.loads(raw_output.strip())
            return {
                "answer_markdown": parsed.get("answer_markdown", raw_output),
                "highlight_node_ids": parsed.get("highlight_node_ids", []),
                "highlight_edge_ids": parsed.get("highlight_edge_ids", [])
            }
        except Exception:
            return {
                "answer_markdown": raw_output,
                "highlight_node_ids": [],
                "highlight_edge_ids": []
            }

copilot_service = GraphCopilotService()
