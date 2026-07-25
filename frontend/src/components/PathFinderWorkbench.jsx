import React, { useEffect, useState } from 'react';
import { 
  FaRoute, 
  FaWandMagicSparkles, 
  FaXmark 
} from 'react-icons/fa6';
import { fetchNodes, discoverPath } from '../services/api';

export default function PathFinderWorkbench({ onHighlightPath, onClose }) {
  const [nodes, setNodes] = useState([]);
  const [startNodeId, setStartNodeId] = useState('');
  const [targetNodeId, setTargetNodeId] = useState('');
  const [maxHops, setMaxHops] = useState(4);
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadNodes = async () => {
      try {
        const data = await fetchNodes({ limit: 50 });
        setNodes(data);
        if (data.length > 1) {
          setStartNodeId(data[0].id);
          setTargetNodeId(data[1].id);
        }
      } catch (err) {
        console.error("Failed to load nodes", err);
      }
    };
    loadNodes();
  }, []);

  const handleSearchPath = async (e) => {
    e.preventDefault();
    if (!startNodeId || !targetNodeId) return;
    setLoading(true);
    try {
      const res = await discoverPath(startNodeId, targetNodeId, maxHops);
      setPaths(res);
      if (res.length > 0 && onHighlightPath) {
        onHighlightPath(res[0].path_node_ids);
      }
    } catch (err) {
      console.error("Path discovery error", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-3.5 rounded-2xl border border-amber-500/30 space-y-3 text-xs shadow-2xl bg-slate-950/90 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
          <FaRoute className="w-4 h-4 text-amber-400" /> Multi-Hop Path Finder Workbench
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] text-slate-500 font-mono">Recursive SQL Engine</span>
          {onClose && (
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
              <FaXmark className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSearchPath} className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          value={startNodeId}
          onChange={(e) => setStartNodeId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          {nodes.map(n => (
            <option key={n.id} value={n.id}>Start: {n.canonical_name}</option>
          ))}
        </select>

        <select
          value={targetNodeId}
          onChange={(e) => setTargetNodeId(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
        >
          {nodes.map(n => (
            <option key={n.id} value={n.id}>Target: {n.canonical_name}</option>
          ))}
        </select>

        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-400">
          <span>Max Hops:</span>
          <input
            type="number"
            min="1"
            max="6"
            value={maxHops}
            onChange={(e) => setMaxHops(parseInt(e.target.value))}
            className="w-10 bg-transparent text-amber-400 font-bold text-xs focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !startNodeId || !targetNodeId}
          className="glass-button flex items-center justify-center space-x-2 px-4 py-2 rounded-xl font-bold text-amber-200 bg-amber-600/30 border border-amber-500/40 hover:scale-105 transition"
        >
          <FaWandMagicSparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{loading ? 'Searching...' : 'Discover Path'}</span>
        </button>
      </form>

      {paths.length > 0 && (
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-amber-300">
          <span>Discovered {paths.length} indirect causal paths. Best path confidence: {paths[0].confidence_score * 100}%</span>
          <button
            onClick={() => onHighlightPath && onHighlightPath(paths[0].path_node_ids)}
            className="font-bold underline hover:text-amber-200"
          >
            Highlight Glowing Gold Path
          </button>
        </div>
      )}
    </div>
  );
}
