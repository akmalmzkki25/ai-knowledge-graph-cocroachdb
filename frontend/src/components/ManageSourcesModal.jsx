import React, { useEffect, useState } from 'react';
import { FaFileLines, FaTrash, FaXmark, FaRotate, FaFilePdf } from 'react-icons/fa6';
import { fetchSources, deleteSource } from '../services/api';

export default function ManageSourcesModal({ isOpen, onClose, onDataChanged }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadSources = async () => {
    setLoading(true);
    try {
      const data = await fetchSources();
      setSources(data);
    } catch (err) {
      console.error("Failed to load sources", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSources();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = async (sourceId, title) => {
    if (!window.confirm(`Are you sure you want to delete document "${title}" and all its extracted relations?`)) {
      return;
    }
    setDeletingId(sourceId);
    try {
      await deleteSource(sourceId);
      await loadSources();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      alert("Failed to delete source document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-slate-950/95 text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-slate-100 text-sm">
            <FaFileLines className="w-4 h-4 text-indigo-400" />
            <span>Manage Ingested Documents</span>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={loadSources} className="p-1 text-slate-400 hover:text-slate-200">
              <FaRotate className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
              <FaXmark className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 max-h-96 overflow-y-auto space-y-3">
          {sources.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic border border-dashed border-slate-800 rounded-xl">
              No ingested documents found.
            </div>
          ) : (
            sources.map((s) => (
              <div key={s.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between hover:border-slate-700 transition">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30 text-indigo-400">
                    <FaFilePdf className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200 text-xs">{s.title}</h5>
                    <div className="flex items-center space-x-3 text-[10px] text-slate-400 mt-0.5">
                      {s.authors && <span>Authors: {s.authors}</span>}
                      <span>Edges Extracted: <strong className="text-indigo-400">{s.edge_count}</strong></span>
                      {s.created_at && <span>Imported: {new Date(s.created_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(s.id, s.title)}
                  disabled={deletingId === s.id}
                  className="p-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40 rounded-xl font-bold flex items-center space-x-1.5 transition"
                  title="Delete Document & Extracted Triples"
                >
                  <FaTrash className="w-3 h-3" />
                  <span>{deletingId === s.id ? 'Deleting...' : 'Delete'}</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/40 flex justify-end">
          <button onClick={onClose} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
