import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.services.bedrock_service import bedrock_service
from app.models.graph import Node, Edge, SourceDocument, Hypothesis

class ExecutiveReportService:
    @staticmethod
    def generate_research_report(db: Session) -> Dict[str, Any]:
        nodes_count = db.query(Node).count()
        edges_count = db.query(Edge).count()
        docs = db.query(SourceDocument).all()
        hypotheses = db.query(Hypothesis).all()
        edges = db.query(Edge).limit(40).all()

        doc_titles = [d.title for d in docs]
        hypo_summaries = [f"{h.title}: {h.summary[:100]}..." for h in hypotheses]
        relations_context = [
            f"{e.source_node.canonical_name if e.source_node else 'N/A'} {e.predicate} {e.target_node.canonical_name if e.target_node else 'N/A'} (Confidence: {e.confidence_score})"
            for e in edges
        ]

        prompt = f"""
You are an elite Chief Scientific Officer and BioInformatics Specialist.
Generate a comprehensive, publication-ready Executive Research Report based on the KnowledgeBase-BioGraph state.

Network Summary:
- Total Nodes: {nodes_count}
- Total Relationships: {edges_count}
- Ingested Literature Sources: {json.dumps(doc_titles)}
- Current AI Hypotheses: {json.dumps(hypo_summaries)}
- Key Causal Relations: {json.dumps(relations_context[:25])}

Generate a formal markdown report matching this JSON schema:
{{
  "report_title": "Title of the Executive Report",
  "executive_summary": "High-level summary of the findings and network insights.",
  "report_markdown": "# Full Markdown Body with sections: 1. Introduction, 2. Key Biological Pathways & Targets, 3. Novel AI Hypotheses, 4. Risk Assessment & Literature Contradictions, 5. Next Experimental Steps",
  "key_findings": ["Bullet point finding 1", "Bullet point finding 2", "Bullet point finding 3"]
}}

Return ONLY valid JSON.
"""
        response = bedrock_service.client.chat.completions.create(
            model=bedrock_service.model,
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
            return json.loads(raw_output.strip())
        except Exception:
            return {
                "report_title": "Executive Knowledge Base BioGraph Report",
                "executive_summary": "Comprehensive analysis of causal relationships across ingested literature.",
                "report_markdown": raw_output,
                "key_findings": ["Extracted causal network", "Multi-hop path verification", "Target validation"]
            }

report_service = ExecutiveReportService()
