import React, { useEffect, useState } from 'react';
import { 
  FaCircleNodes, 
  FaShareNodes, 
  FaFileLines, 
  FaCircleCheck, 
  FaAward 
} from 'react-icons/fa6';
import { fetchAnalytics } from '../services/api';

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await fetchAnalytics();
        setStats(data);
      } catch (err) {
        console.error("Failed to load analytics stats", err);
      }
    };
    loadStats();
  }, []);

  if (!stats) return null;

  return (
    <div className="bg-slate-900/80 border-b border-slate-800/80 px-6 py-1.5 flex items-center justify-between text-xs overflow-x-auto shadow-inner">
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2">
          <FaCircleNodes className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Nodes: <strong className="text-slate-200">{stats.total_nodes}</strong></span>
          <span className="text-slate-700">|</span>
          <FaShareNodes className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">Edges: <strong className="text-slate-200">{stats.total_edges}</strong></span>
        </div>

        <div className="flex items-center space-x-2 border-l border-slate-800/80 pl-6">
          <FaFileLines className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">Sources: <strong className="text-slate-200">{stats.total_documents}</strong></span>
        </div>

        <div className="flex items-center space-x-2 border-l border-slate-800/80 pl-6">
          <FaCircleCheck className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">Avg Confidence: <strong className="text-emerald-400">{stats.average_confidence * 100}%</strong></span>
        </div>
      </div>

      {stats.top_hub_entities && stats.top_hub_entities.length > 0 && (
        <div className="flex items-center space-x-2">
          <FaAward className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400 font-semibold">Top Hub Entity:</span>
          <span className="px-2.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-[11px]">
            {stats.top_hub_entities[0].name} ({stats.top_hub_entities[0].connections} links)
          </span>
        </div>
      )}
    </div>
  );
}
