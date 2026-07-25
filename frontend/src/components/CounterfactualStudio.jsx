import React, { useEffect, useState } from 'react';
import { Zap, Play, ArrowDownRight, Layers } from 'lucide-react';
import { fetchNodes, simulateKnockout } from '../services/api';

export default function CounterfactualStudio() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const data = await fetchNodes({ limit: 50 });
        setNodes(data);
        if (data.length > 0) setSelectedNodeId(data[0].id);
      } catch (err) {
        console.error("Failed to load nodes", err);
      }
    };
    loadNodes();
  }, []);

  const handleRunSimulation = async (e) => {
    e.preventDefault();
    if (!selectedNodeId) return;
    setLoading(true);
    try {
      const res = await simulateKnockout(selectedNodeId, maxDepth);
      setSimulationResult(res);
    } catch (err) {
      console.error("Simulation error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            "What-If" Counterfactual Simulation Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">Simulate gene knockouts or drug inhibition cascades downstream across the knowledge graph.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Simulation Config Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Simulation Controls</h3>
          
          <form onSubmit={handleRunSimulation} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Select Target Entity to Knock Out</label>
              <select
                value={selectedNodeId}
                onChange={(e) => setSelectedNodeId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {nodes.map(n => (
                  <option key={n.id} value={n.id}>{n.canonical_name} ({n.entity_type})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Max Cascade Depth (Hops): {maxDepth}</label>
              <input
                type="range"
                min="1"
                max="5"
                value={maxDepth}
                onChange={(e) => setMaxDepth(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !selectedNodeId}
              className="w-full glass-button flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm text-amber-200 bg-amber-600/30 border border-amber-500/40"
            >
              <Play className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{loading ? 'Simulating Cascade...' : 'Execute Knockout Simulation'}</span>
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="md:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center justify-between">
            <span>Cascade Results</span>
            {simulationResult && (
              <span className="text-xs text-amber-400 font-normal">
                {simulationResult.total_affected_nodes} Downstream Entities Affected
              </span>
            )}
          </h3>

          {!simulationResult ? (
            <div className="text-center py-16 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
              Select an entity and run a simulation to view downstream impact paths.
            </div>
          ) : simulationResult.cascade.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No downstream outgoing causal edges found for this entity.
            </div>
          ) : (
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
              {simulationResult.cascade.map((c, idx) => (
                <div key={idx} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">Hop {c.depth}</span>
                    <span className="font-semibold text-slate-200">{c.source_name}</span>
                    <span className="text-indigo-400 font-bold">[{c.predicate}]</span>
                    <ArrowDownRight className="w-4 h-4 text-slate-500" />
                    <span className="font-semibold text-emerald-400">{c.target_name}</span>
                  </div>
                  <span className="text-slate-500">Confidence: {c.confidence * 100}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
