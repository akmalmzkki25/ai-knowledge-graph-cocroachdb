import React from 'react';
import { X, Download, FileText, Database, Presentation } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ExportModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">Export Knowledge Graph & Hypotheses</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <a
            href={`${API_BASE_URL}/api/v1/export/json-ld`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition group"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-indigo-400" />
              <div>
                <div className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300">JSON-LD Ontology Graph</div>
                <div className="text-xs text-slate-500">Standard semantic web format linked data</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
          </a>

          <a
            href={`${API_BASE_URL}/api/v1/export/marp`}
            download="hypotheses_presentation.md"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition group"
          >
            <div className="flex items-center space-x-3">
              <Presentation className="w-5 h-5 text-amber-400" />
              <div>
                <div className="text-sm font-semibold text-slate-200 group-hover:text-amber-300">Marp Markdown Presentation</div>
                <div className="text-xs text-slate-500">Auto-generated slide deck of research hypotheses</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
          </a>

          <a
            href={`${API_BASE_URL}/api/v1/export/csv`}
            download="knowledge_graph_edges.csv"
            className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition group"
          >
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300">CSV Causal Edges Dataset</div>
                <div className="text-xs text-slate-500">Tabular format for Excel / Python data analysis</div>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
