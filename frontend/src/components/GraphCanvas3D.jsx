import React, { useEffect, useRef, useState } from 'react';
import ForceGraph3D from '3d-force-graph';
import { RefreshCw, RotateCcw, Box } from 'lucide-react';
import { fetchNodes, fetchEdges } from '../services/api';

export default function GraphCanvas3D() {
  const containerRef = useRef(null);
  const fgRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      const nodes = await fetchNodes({ limit: 80 });
      const edges = await fetchEdges({ limit: 100 });

      const gData = {
        nodes: nodes.map(n => ({
          id: n.id,
          name: n.canonical_name,
          type: n.entity_type,
          val: 8
        })),
        links: edges.map(e => ({
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
            .linkLabel(link => `<div style="color: #cbd5e1; background: #0f172a; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${link.predicate} (${int(link.confidence * 100)}%)</div>`)
            .onNodeClick(node => {
              setSelectedNode(node);
              // Aim camera at node
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
    loadGraphData();
  }, []);

  return (
    <div className="relative w-full h-[calc(100vh-65px)] bg-slate-950 overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />

      {/* Floating Controls */}
      <div className="absolute top-4 left-4 z-10 glass-panel p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Box className="w-4 h-4" /> 3D Sci-Fi Universe Canvas
          </span>
          <button
            onClick={loadGraphData}
            disabled={loading}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <p className="text-slate-400 text-[11px]">Rotate camera with left click drag, pan with right click drag, scroll to zoom.</p>
      </div>

      {/* Selected Node Details */}
      {selectedNode && (
        <div className="absolute bottom-6 left-6 z-10 glass-panel p-4 rounded-xl border border-indigo-500/40 text-xs w-72 space-y-1">
          <div className="font-bold text-slate-100 text-sm">{selectedNode.name}</div>
          <div className="text-indigo-400">Type: {selectedNode.type}</div>
          <div className="text-slate-500 text-[10px]">3D Coords: ({Math.round(selectedNode.x)}, {Math.round(selectedNode.y)}, {Math.round(selectedNode.z)})</div>
        </div>
      )}
    </div>
  );
}
