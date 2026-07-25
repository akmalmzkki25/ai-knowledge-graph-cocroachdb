import json
from typing import List
from openai import OpenAI
from app.core.config import settings
from app.schemas.graph import CausalTriplet, ExtractionResult

class BedrockGLMService:
    def __init__(self):
        self._client = None

    @property
    def model(self) -> str:
        return settings.BEDROCK_MODEL

    @property
    def client(self) -> OpenAI:
        if self._client is None:
            api_key = settings.OPENAI_API_KEY if settings.OPENAI_API_KEY else "dummy-key"
            self._client = OpenAI(
                api_key=api_key,
                project=settings.BEDROCK_PROJECT,
                base_url=settings.OPENAI_BASE_URL
            )
        return self._client

    @staticmethod
    def _clean_str(text: str) -> str:
        if not text:
            return ""
        return text.replace("\x00", "").strip()

    def extract_causal_triplets(self, text_content: str, title: str = "") -> ExtractionResult:
        prompt = f"""
You are an expert BioInformatics & Biomedical Causal Extraction System.
Analyze the following biomedical research text and extract ALL directed causal relationships between biological entities.

Text Title: {self._clean_str(title)}
Text Content:
{self._clean_str(text_content)}

Extract causal relationships in JSON format matching this exact schema:
{{
  "triplets": [
    {{
      "source_entity": "Name of source entity (e.g. Gefitinib, p53, BRCA1)",
      "source_type": "Entity type (e.g. Drug, Gene, Protein, Disease, Pathway, Symptom)",
      "predicate": "Causal mechanism (e.g. INHIBITS, ACTIVATES, UPREGULATES, DOWNREGULATES, BINDS_TO, CAUSES, TREATS)",
      "target_entity": "Name of target entity",
      "target_type": "Entity type",
      "confidence": 0.95,
      "evidence": "Exact sentence quote from the text supporting this relation"
    }}
  ]
}}

Return ONLY valid JSON.
"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        
        raw_output = response.choices[0].message.content.strip()
        
        if raw_output.startswith("```json"):
            raw_output = raw_output[7:]
        if raw_output.startswith("```"):
            raw_output = raw_output[3:]
        if raw_output.endswith("```"):
            raw_output = raw_output[:-3]
            
        data = json.loads(raw_output.strip())
        
        triplets = []
        for item in data.get("triplets", []):
            triplets.append(CausalTriplet(
                source_entity=self._clean_str(item.get("source_entity", "")),
                source_type=self._clean_str(item.get("source_type", "Entity")),
                predicate=self._clean_str(item.get("predicate", "ASSOCIATED_WITH")),
                target_entity=self._clean_str(item.get("target_entity", "")),
                target_type=self._clean_str(item.get("target_type", "Entity")),
                confidence=float(item.get("confidence", 0.8)),
                evidence=self._clean_str(item.get("evidence", ""))
            ))
        
        return ExtractionResult(triplets=triplets, source_title=self._clean_str(title))

bedrock_service = BedrockGLMService()
