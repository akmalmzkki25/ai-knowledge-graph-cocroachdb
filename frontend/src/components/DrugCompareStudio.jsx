import React, { useEffect, useState } from 'react';
import { FaFlask, FaWandMagicSparkles, FaCircleCheck, FaHandshake, FaShieldHalved } from 'react-icons/fa6';
import { fetchNodes, compareDrugs } from '../services/api';

export default function DrugCompareStudio() {
  const [drugs, setDrugs] = useState([]);
  const [drugAId, setDrugAId] = useState('');
  const [drugBId, setDrugBId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDrugs = async () => {
      try {
        const nodes = await fetchNodes({ limit: 80 });
        const drugNodes = nodes.filter(n => n.entity_type === 'Drug' || n.entity_type === 'Entity');
        setDrugs(drugNodes.length > 0 ? drugNodes : nodes);
        if (drugNodes.length > 1) {
          setDrugAId(drugNodes[0].id);
          setDrugBId(drugNodes[1].id);
        }
      } catch (err) {
        console.error("Failed to load drugs", err);
      }
    };
    loadDrugs();
  }, []);

  const handleCompare = async (e) => {
    e.preventDefault();
    if (!drugAId || !drugBId) return;
    setLoading(true);
    try {
      const res = await compareDrugs(drugAId, drugBId);
      if (res.error) {
        alert(res.error);
      } else {
        setResult(res);
      }
    } catch (err) {
      console.error("Drug compare error", err);
      alert("Failed to run comparative analysis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 text-xs font-sans">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
              <FaFlask className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Multi-Drug Comparative Benchmarking Studio</h2>
              <p className="text-slate-400 text-xs">Head-to-Head target overlap, unique pathways, and synergy score</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleCompare} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Drug A</label>
            <select
              value={drugAId}
              onChange={(e) => setDrugAId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {drugs.map(d => (
                <option key={d.id} value={d.id}>{d.canonical_name} ({d.entity_type})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Select Drug B</label>
            <select
              value={drugBId}
              onChange={(e) => setDrugBId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              {drugs.map(d => (
                <option key={d.id} value={d.id}>{d.canonical_name} ({d.entity_type})</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !drugAId || !drugBId}
              className="w-full glass-button flex items-center justify-center space-x-2 py-2.5 rounded-xl font-bold text-white bg-indigo-600/40 border border-indigo-500/50 hover:scale-105 transition"
            >
              <FaWandMagicSparkles className="w-4 h-4 text-amber-400" />
              <span>{loading ? 'Analyzing Synergy...' : 'Compare Head-to-Head'}</span>
            </button>
          </div>
        </form>
      </div>

      {result && (
        <div className="space-y-6">
          {/* Summary Badge & Synergy Score */}
          <div className="glass-panel p-5 rounded-2xl border border-indigo-500/30 flex items-center justify-between bg-indigo-950/20">
            <div>
              <h3 className="font-bold text-slate-100 text-sm">{result.drug_a?.name} vs {result.drug_b?.name}</h3>
              <p className="text-slate-300 mt-0.5">{result.summary}</p>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Synergy Score</div>
              <div className="text-2xl font-extrabold text-emerald-400">{Math.round((result.synergy_score || 0) * 100)}%</div>
            </div>
          </div>

          {/* Venn-style Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Drug A Unique */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-indigo-400 flex items-center gap-2">
                <FaFlask className="w-4 h-4" /> Unique to {result.drug_a?.name} ({result.unique_drug_a_targets?.length || 0})
              </h4>
              <div className="space-y-2">
                {result.unique_drug_a_targets?.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{t.name}</div>
                      <div className="text-[10px] text-slate-500">{t.predicate}</div>
                    </div>
                    <span className="text-[10px] text-indigo-400 font-bold">{t.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shared Targets */}
            <div className="glass-panel p-4 rounded-xl border border-amber-500/30 space-y-3 bg-amber-950/10">
              <h4 className="font-bold text-amber-400 flex items-center gap-2">
                <FaHandshake className="w-4 h-4" /> Shared Overlap Targets ({result.shared_targets?.length || 0})
              </h4>
              <div className="space-y-2">
                {result.shared_targets?.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-900 rounded-lg border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-amber-200">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.predicate}</div>
                    </div>
                    <span className="text-[10px] text-amber-400 font-bold">{t.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Drug B Unique */}
            <div className="glass-panel p-4 rounded-xl border border-slate-800 space-y-3">
              <h4 className="font-bold text-purple-400 flex items-center gap-2">
                <FaFlask className="w-4 h-4" /> Unique to {result.drug_b?.name} ({result.unique_drug_b_targets?.length || 0})
              </h4>
              <div className="space-y-2">
                {result.unique_drug_b_targets?.map(t => (
                  <div key={t.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-200">{t.name}</div>
                      <div className="text-[10px] text-slate-500">{t.predicate}</div>
                    </div>
                    <span className="text-[10px] text-purple-400 font-bold">{t.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
