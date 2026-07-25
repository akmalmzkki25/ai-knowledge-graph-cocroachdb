import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { fetchContradictions } from '../services/api';

export default function LintStudio() {
  const [contradictions, setContradictions] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const data = await fetchContradictions();
      setContradictions(data.contradictions || []);
    } catch (err) {
      console.error("Failed to run graph linting", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            Graph Health & Contradiction Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">Automated scanner detecting conflicting research claims across ingested literature.</p>
        </div>
        <button
          onClick={loadAudit}
          disabled={loading}
          className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-200"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Health Audit</span>
        </button>
      </div>

      {contradictions.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-3 border border-emerald-500/30">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-200">No Contradictions Detected</h3>
          <p className="text-xs text-slate-400">All causal edges in CockroachDB are consistent with zero conflicting claims.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contradictions.map((c, idx) => (
            <div key={idx} className="glass-panel rounded-2xl p-6 border border-red-500/30 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-bold text-slate-200">
                    Conflicting Claims: {c.source_entity} → {c.target_entity}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-300 border border-red-500/40">
                  {c.severity} SEVERITY
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-emerald-400">Claim 1: [{c.edge_1.predicate}] (Confidence: {c.edge_1.confidence * 100}%)</div>
                  <p className="text-slate-300 italic">"{c.edge_1.evidence}"</p>
                </div>
                <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-red-400">Claim 2: [{c.edge_2.predicate}] (Confidence: {c.edge_2.confidence * 100}%)</div>
                  <p className="text-slate-300 italic">"{c.edge_2.evidence}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
