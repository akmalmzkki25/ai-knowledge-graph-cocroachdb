from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_cockroach_db
from app.models.graph import Node, Edge
from app.schemas.graph import NodeResponse, EdgeResponse, PathDiscoveryResponse

router = APIRouter()

@router.get("/nodes", response_model=List[NodeResponse])
def get_graph_nodes(
    entity_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    db: Session = Depends(get_cockroach_db)
):
    query = db.query(Node)
    if entity_type:
        query = query.filter(Node.entity_type == entity_type)
    return query.limit(limit).all()


@router.get("/edges", response_model=List[EdgeResponse])
def get_graph_edges(
    predicate: Optional[str] = Query(None),
    min_confidence: float = Query(0.0, ge=0.0, le=1.0),
    limit: int = Query(200, le=1000),
    db: Session = Depends(get_cockroach_db)
):
    query = db.query(Edge).filter(Edge.confidence_score >= min_confidence)
    if predicate:
        query = query.filter(Edge.predicate == predicate)
    return query.limit(limit).all()


@router.get("/path", response_model=List[PathDiscoveryResponse])
def discover_causal_path(
    start_node_id: str = Query(...),
    target_node_id: str = Query(...),
    max_hops: int = Query(4, le=6),
    db: Session = Depends(get_cockroach_db)
):
    start_node = db.query(Node).filter(Node.id == start_node_id).first()
    target_node = db.query(Node).filter(Node.id == target_node_id).first()

    if not start_node or not target_node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Start or target node not found."
        )

    # Recursive SQL CTE Graph Traversal with Cycle Detection Array Track
    sql_query = text("""
        WITH RECURSIVE causal_path AS (
            SELECT 
                source_node_id, 
                target_node_id, 
                predicate, 
                confidence_score, 
                1 AS depth, 
                ARRAY[source_node_id::text, target_node_id::text] AS path_nodes,
                confidence_score AS path_confidence
            FROM edges
            WHERE source_node_id = :start_id

            UNION ALL

            SELECT 
                e.source_node_id, 
                e.target_node_id, 
                e.predicate, 
                e.confidence_score, 
                cp.depth + 1, 
                cp.path_nodes || e.target_node_id::text,
                cp.path_confidence * e.confidence_score
            FROM edges e
            JOIN causal_path cp ON e.source_node_id = cp.target_node_id
            WHERE cp.depth < :max_depth
              -- Cycle Detection: Prevent revisiting already visited nodes in this path
              AND NOT (e.target_node_id::text = ANY(cp.path_nodes))
        )
        SELECT path_nodes, path_confidence, depth
        FROM causal_path
        WHERE target_node_id = :target_id
        ORDER BY path_confidence DESC
        LIMIT 10;
    """)

    results = db.execute(
        sql_query, 
        {
            "start_id": start_node_id, 
            "target_id": target_node_id, 
            "max_depth": max_hops
        }
    ).fetchall()

    paths = []
    for r in results:
        paths.append(PathDiscoveryResponse(
            start_entity=start_node.canonical_name,
            target_entity=target_node.canonical_name,
            path_node_ids=list(r.path_nodes),
            hops=r.depth,
            confidence_score=round(float(r.path_confidence), 2)
        ))

    return paths
