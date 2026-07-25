from fastapi import APIRouter
from app.api.v1.endpoints import (
    health, auth, users, ingest, graph, hypothesis, 
    lint, counterfactual, export, analytics, copilot, report, compare
)

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health Check"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(ingest.router, prefix="/ingest", tags=["Document Ingestion"])
api_router.include_router(graph.router, prefix="/graph", tags=["Knowledge Graph"])
api_router.include_router(hypothesis.router, prefix="/hypotheses", tags=["Causal Hypotheses"])
api_router.include_router(lint.router, prefix="/lint", tags=["Graph Health & Contradictions"])
api_router.include_router(counterfactual.router, prefix="/counterfactual", tags=["Counterfactual Simulation"])
api_router.include_router(export.router, prefix="/export", tags=["Data Exporters"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Graph Analytics"])
api_router.include_router(copilot.router, prefix="/copilot", tags=["AI Copilot Assistant"])
api_router.include_router(report.router, prefix="/report", tags=["Executive Research Report"])
api_router.include_router(compare.router, prefix="/compare", tags=["Multi-Drug Comparative Studio"])
