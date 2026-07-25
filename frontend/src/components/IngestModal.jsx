import React, { useState } from 'react';
import { X, Upload, Sparkles, AlertCircle, FileText, File } from 'lucide-react';
import { ingestTextDocument, ingestPdfDocument } from '../services/api';

export default function IngestModal({ isOpen, onClose, onIngestSuccess }) {
  const [ingestMode, setIngestMode] = useState('pdf'); // 'pdf' or 'text'
  const [pdfFile, setPdfFile] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authors, setAuthors] = useState('');
  const [doi, setDoi] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let result;
      if (ingestMode === 'pdf') {
        if (!pdfFile) {
          setError("Please select a PDF file to upload.");
          setLoading(false);
          return;
        }
        const formData = new FormData();
        formData.append('file', pdfFile);
        if (authors) formData.append('authors', authors);
        if (doi) formData.append('doi', doi);
        result = await ingestPdfDocument(formData);
      } else {
        result = await ingestTextDocument({ title, content, authors, doi });
      }
      onIngestSuccess(result);
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Ingestion failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-slate-100">Ingest Document (AWS Bedrock Extraction)</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 p-1">
          <button
            type="button"
            onClick={() => setIngestMode('pdf')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition ${
              ingestMode === 'pdf'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <File className="w-4 h-4" />
            <span>Upload PDF File</span>
          </button>

          <button
            type="button"
            onClick={() => setIngestMode('text')}
            className={`flex-1 py-2.5 text-xs font-semibold rounded-xl flex items-center justify-center space-x-2 transition ${
              ingestMode === 'text'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Raw Text</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {ingestMode === 'pdf' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Upload Research Paper (PDF)</label>
                <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center bg-slate-900/40 transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <File className="w-10 h-10 text-indigo-400 mx-auto mb-2 opacity-80" />
                  {pdfFile ? (
                    <div>
                      <div className="text-sm font-bold text-slate-200">{pdfFile.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{(pdfFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-sm font-semibold text-slate-300">Drag & drop your PDF file here, or click to browse</div>
                      <div className="text-xs text-slate-500 mt-1">Supports PubMed, Clinical Trial, and Journal PDFs</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Authors (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Smith et al."
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">DOI (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 10.1038/s41586-024-00000-0"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Gefitinib inhibition of EGFR kinase in non-small cell lung cancer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Authors (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Smith et al."
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">DOI (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 10.1038/s41586-024-00000-0"
                    value={doi}
                    onChange={(e) => setDoi(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Document Text Content</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Paste research paper abstract or text here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-sans"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="glass-button flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600/40 border border-indigo-500/50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{loading ? 'Extracting via GLM-5...' : 'Extract & Integrate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
