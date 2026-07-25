import React, { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import { FaCube, FaRotate, FaXmark } from 'react-icons/fa6';
import { fetchNodes, fetchEdges } from '../services/api';

export default function GraphCanvas3D() {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadGraph3D = async () => {
    setLoading(true);
    try {
      const nodes = await fetchNodes({ limit: 500 });
      const edges = await fetchEdges({ limit: 1000 });

      // Build node ID set to filter out orphaned edges with non-existent source or target
      const validNodeIds = new Set(nodes.map(n => n.id));
      const validEdges = edges.filter(
        e => validNodeIds.has(e.source_node_id) && validNodeIds.has(e.target_node_id)
      );

      const gData = {
        nodes: nodes.map(n => ({
          id: n.id,
          name: n.canonical_name,
          type: n.entity_type,
          val: 8
        })),
        links: validEdges.map(e => ({
          source: e.source_node_id,
          target: e.target_node_id,
          predicate: e.predicate,
          confidence: e.confidence_score
        }))
      };

      if (containerRef.current) {
        if (!fgRef.current) {
          const Graph = ForceGraph3D()(containerRef.current)
            .graphData(gData)
            .backgroundColor('#030712')
            .nodeLabel(node => `<div style="color: #f3f4f6; background: rgba(15,23,42,0.9); padding: 4px 8px; border-radius: 6px; border: 1px solid #4f46e5; font-size: 11px;"><b>${node.name}</b> (${node.type})</div>`)
            .nodeColor(node => {
              if (node.type === 'Drug') return '#10b981';
              if (node.type === 'Gene') return '#3b82f6';
              if (node.type === 'Protein') return '#8b5cf6';
              if (node.type === 'Disease') return '#ef4444';
              return '#6366f1';
            })
            .nodeResolution(16)
            .linkWidth(1.5)
            .linkColor(() => '#475569')
            .linkDirectionalParticles(2)
            .linkDirectionalParticleSpeed(0.005)
            .linkDirectionalParticleWidth(2.5)
            .linkLabel(link => `<div style="color: #cbd5e1; background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${link.predicate} (${Math.round(link.confidence * 100)}%)</div>`)
            .onNodeClick(node => {
              setSelectedNode(node);
              const distance = 120;
              const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);
              Graph.cameraPosition(
                { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
                node,
                2000
              );
            });

          fgRef.current = Graph;
        } else {
          fgRef.current.graphData(gData);
        }
      }
    } catch (err) {
      console.error("Failed to load 3D graph data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGraph3D();
    return () => {
      if (fgRef.current) {
        fgRef.current._destructor && fgRef.current._destructor();
        fgRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-120px)] bg-slate-950 overflow-hidden">
      <div className="absolute top-4 left-4 z-20 glass-panel p-3 rounded-xl border border-slate-800 flex items-center space-x-3 text-xs bg-slate-950/80">
        <FaCube className="w-4 h-4 text-emerald-400" />
        <span className="font-bold text-slate-200">3D Sci-Fi Universe Visualizer</span>
        <button onClick={loadGraph3D} className="p-1 text-slate-400 hover:text-slate-200">
          <FaRotate className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      {selectedNode && (
        <div className="absolute bottom-6 right-6 z-20 glass-panel p-4 rounded-2xl border border-indigo-500/40 w-80 space-y-2 text-xs bg-slate-950/90 shadow-2xl">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-100">{selectedNode.name}</span>
            <button onClick={() => setSelectedNode(null)} className="p-1 text-slate-400 hover:text-slate-200">
              <FaXmark className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-indigo-400 font-medium">Entity Type: {selectedNode.type}</div>
        </div>
      )}
    </div>
  );
}
