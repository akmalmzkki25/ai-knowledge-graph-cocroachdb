import React, { useState } from 'react';
import { FaFilePdf, FaXmark, FaWandMagicSparkles, FaDownload, FaCircleCheck } from 'react-icons/fa6';
import { generateExecutiveReport } from '../services/api';
import AudioPlayer from './AudioPlayer';

export default function ReportModal({ isOpen, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await generateExecutiveReport();
      setReport(data);
    } catch (err) {
      console.error("Report generation error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    if (!report) return;
    const blob = new Blob([report.report_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BioGraph_Executive_Report_${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="glass-panel border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl bg-slate-950/95">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
              <FaFilePdf className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">AI Executive Literature Research Report</h3>
              <p className="text-xs text-slate-400">AWS Bedrock GLM 5.2 Synthesized Document</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <FaXmark className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {!report ? (
            <div className="text-center py-12 space-y-4">
              <FaWandMagicSparkles className="w-12 h-12 text-indigo-400 mx-auto animate-bounce opacity-80" />
              <div>
                <h4 className="text-sm font-bold text-slate-200">Generate Publication-Ready Executive Report</h4>
                <p className="text-slate-400 max-w-md mx-auto mt-1">
                  Synthesizes all ingested PDF papers, causal graph networks, novel hypotheses, and contradiction audits into a formal Markdown document.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="glass-button px-6 py-3 rounded-xl font-bold text-white bg-indigo-600/40 border border-indigo-500/50 shadow-lg hover:scale-105 transition"
              >
                {loading ? 'Synthesizing Report via GLM-5.2...' : 'Generate Executive Report'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Audio Briefing Player Widget */}
              <AudioPlayer textToRead={report.executive_summary} title="Executive Summary Audio Briefing" />

              <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 space-y-2 bg-indigo-950/20">
                <h4 className="text-sm font-bold text-indigo-300">{report.report_title}</h4>
                <p className="text-slate-300 leading-relaxed">{report.executive_summary}</p>
              </div>

              {report.key_findings && (
                <div className="space-y-2">
                  <h5 className="font-bold text-amber-400 uppercase tracking-wider text-[11px]">Key Research Findings</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {report.key_findings.map((f, i) => (
                      <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-start space-x-2">
                        <FaCircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-300">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl font-mono text-[11px] whitespace-pre-wrap leading-relaxed text-slate-300 max-h-96 overflow-y-auto">
                {report.report_markdown}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {report && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="text-xs text-slate-400 hover:text-slate-200 underline"
            >
              Re-generate Report
            </button>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Close
              </button>
              <button
                onClick={handleDownloadMarkdown}
                className="glass-button flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold text-indigo-200 bg-indigo-600/30 border border-indigo-500/40"
              >
                <FaDownload className="w-3.5 h-3.5" />
                <span>Download Report (.md)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
