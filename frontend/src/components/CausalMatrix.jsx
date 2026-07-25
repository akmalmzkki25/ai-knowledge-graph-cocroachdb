import React, { useEffect, useState } from 'react';
import { Grid, Activity, ArrowRight } from 'lucide-react';
import { fetchNodes, fetchEdges } from '../services/api';

export default function CausalMatrix() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMatrixData = async () => {
      setLoading(true);
      try {
        const n = await fetchNodes({ limit: 30 });
        const e = await fetchEdges({ limit: 100 });
        setNodes(n);
        setEdges(e);
      } catch (err) {
        console.error("Failed to load matrix data", err);
      } finally {
        setLoading(false);
      }
    };
    loadMatrixData();
  }, []);

  const getRelation = (sourceId, targetId) => {
    return edges.find(e => e.source_node_id === sourceId && e.target_node_id === targetId);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Grid className="w-5 h-5 text-indigo-400" />
            Causal Interaction Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">Cross-tabular view mapping source entity relationships to target biological mechanisms.</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-6 border border-slate-800 overflow-x-auto">
        {nodes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">No node interactions available to plot matrix.</div>
        ) : (
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="p-3 font-semibold text-indigo-300 bg-slate-900/80 sticky left-0 z-10">Source \ Target</th>
                {nodes.slice(0, 10).map((target) => (
                  <th key={target.id} className="p-3 font-semibold text-slate-300 text-center min-w-[100px]">
                    <div className="truncate">{target.canonical_name}</div>
                    <span className="text-[10px] text-slate-500 block font-normal">{target.entity_type}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {nodes.slice(0, 10).map((source) => (
                <tr key={source.id} className="border-b border-slate-800/60 hover:bg-slate-900/30">
                  <td className="p-3 font-semibold text-slate-200 bg-slate-900/80 sticky left-0 z-10">
                    <div>{source.canonical_name}</div>
                    <span className="text-[10px] text-slate-500 font-normal">{source.entity_type}</span>
                  </td>
                  {nodes.slice(0, 10).map((target) => {
                    if (source.id === target.id) {
                      return <td key={target.id} className="p-3 bg-slate-950/40 text-center text-slate-700">-</td>;
                    }
                    const rel = getRelation(source.id, target.id);
                    return (
                      <td key={target.id} className="p-3 text-center">
                        {rel ? (
                          <div className={`px-2 py-1 rounded text-[10px] font-bold ${
                            rel.predicate.includes('INHIBIT') || rel.predicate.includes('DOWN') 
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}>
                            {rel.predicate}
                          </div>
                        ) : (
                          <span className="text-slate-800">•</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
