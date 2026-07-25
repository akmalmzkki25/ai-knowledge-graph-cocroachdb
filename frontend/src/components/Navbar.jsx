import React, { useState, useRef, useEffect } from 'react';
import { 
  FaDiagramProject, 
  FaCube, 
  FaTableCells, 
  FaLightbulb, 
  FaBoltLightning, 
  FaShieldHalved, 
  FaDownload, 
  FaPlus, 
  FaRobot, 
  FaChevronDown, 
  FaRoute, 
  FaDatabase,
  FaFlask,
  FaFilePdf,
  FaUserGear,
  FaRightFromBracket,
  FaUserCheck,
  FaUser
} from 'react-icons/fa6';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenIngestModal, 
  onOpenExportModal, 
  onOpenReportModal,
  onToggleCopilot, 
  showPathWorkbench,
  setShowPathWorkbench,
  healthStatus,
  currentUser,
  onLogout
}) {
  const [openSubMenu, setOpenSubMenu] = useState(null); // 'visualizers' | 'analytics' | 'user' | null
  const subMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (subMenuRef.current && !subMenuRef.current.contains(event.target)) {
        setOpenSubMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId);
    setOpenSubMenu(null);
  };

  const isVisualizerActive = ['graph', 'graph3d', 'matrix'].includes(activeTab);
  const isAnalyticsActive = ['hypotheses', 'simulation', 'lint', 'compare', 'users'].includes(activeTab);

  return (
    <header className="glass-panel sticky top-0 z-40 px-5 py-2 border-b border-slate-800/80 flex items-center justify-between shadow-xl bg-slate-950/90 backdrop-blur-xl h-14">
      {/* Left: Clean Brand Logo */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2 bg-indigo-600/20 border border-indigo-500/40 rounded-xl text-indigo-400">
          <FaDiagramProject className="w-4 h-4 text-indigo-400" />
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent tracking-tight">
            AetherBio AI
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">v1.0</span>
        </div>
      </div>

      {/* Center: Single-Line Dropdown Navigation */}
      <nav ref={subMenuRef} className="flex items-center space-x-1.5">
        {/* Dropdown 1: Visualizers */}
        <div className="relative">
          <button
            onClick={() => setOpenSubMenu(openSubMenu === 'visualizers' ? null : 'visualizers')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              isVisualizerActive
                ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FaDiagramProject className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {activeTab === 'graph3d' ? '3D Universe' : activeTab === 'matrix' ? 'Causal Matrix' : 'Graph Canvas'}
            </span>
            <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${openSubMenu === 'visualizers' ? 'rotate-180 text-indigo-300' : ''}`} />
          </button>

          {openSubMenu === 'visualizers' && (
            <div className="absolute top-full left-0 mt-2 w-52 glass-panel border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 bg-slate-950/95 backdrop-blur-xl">
              <button
                onClick={() => handleSelectTab('graph')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'graph' ? 'bg-indigo-600/40 text-indigo-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaDiagramProject className="w-3.5 h-3.5 text-indigo-400" />
                <span>2D Knowledge Graph</span>
              </button>

              <button
                onClick={() => handleSelectTab('graph3d')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'graph3d' ? 'bg-indigo-600/40 text-indigo-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaCube className="w-3.5 h-3.5 text-emerald-400" />
                <span>3D Sci-Fi Universe</span>
              </button>

              <button
                onClick={() => handleSelectTab('matrix')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'matrix' ? 'bg-indigo-600/40 text-indigo-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaTableCells className="w-3.5 h-3.5 text-purple-400" />
                <span>Causal Matrix</span>
              </button>
            </div>
          )}
        </div>

        {/* Dropdown 2: Analytics & AI */}
        <div className="relative">
          <button
            onClick={() => setOpenSubMenu(openSubMenu === 'analytics' ? null : 'analytics')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              isAnalyticsActive
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FaLightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {activeTab === 'simulation' ? 'Simulation' : activeTab === 'compare' ? 'Drug Compare' : activeTab === 'users' ? 'Users' : activeTab === 'lint' ? 'Health Audit' : 'AI Hypotheses'}
            </span>
            <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${openSubMenu === 'analytics' ? 'rotate-180 text-purple-300' : ''}`} />
          </button>

          {openSubMenu === 'analytics' && (
            <div className="absolute top-full left-0 mt-2 w-56 glass-panel border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 space-y-1 bg-slate-950/95 backdrop-blur-xl">
              <button
                onClick={() => handleSelectTab('hypotheses')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'hypotheses' ? 'bg-purple-600/40 text-purple-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaLightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>AI Hypotheses Studio</span>
              </button>

              <button
                onClick={() => handleSelectTab('compare')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'compare' ? 'bg-purple-600/40 text-purple-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaFlask className="w-3.5 h-3.5 text-indigo-400" />
                <span>Drug Compare Studio</span>
              </button>

              <button
                onClick={() => handleSelectTab('simulation')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'simulation' ? 'bg-purple-600/40 text-purple-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaBoltLightning className="w-3.5 h-3.5 text-amber-500" />
                <span>"What-If" Simulation</span>
              </button>

              <button
                onClick={() => handleSelectTab('lint')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                  activeTab === 'lint' ? 'bg-purple-600/40 text-purple-200' : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <FaShieldHalved className="w-3.5 h-3.5 text-red-400" />
                <span>Graph Health Audit</span>
              </button>

              {currentUser?.role === 'superadmin' && (
                <button
                  onClick={() => handleSelectTab('users')}
                  className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition border-t border-slate-800 mt-1 ${
                    activeTab === 'users' ? 'bg-amber-600/40 text-amber-200' : 'text-amber-300 hover:bg-slate-900'
                  }`}
                >
                  <FaUserGear className="w-3.5 h-3.5 text-amber-400" />
                  <span>User Management</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Path Finder Toggle */}
        <button
          onClick={() => setShowPathWorkbench(!showPathWorkbench)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
            showPathWorkbench
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FaRoute className="w-3.5 h-3.5 text-amber-400" />
          <span>Path Finder</span>
        </button>
      </nav>

      {/* Right: Consolidated Action Bar */}
      <div className="flex items-center space-x-2">
        {/* Copilot */}
        <button
          onClick={onToggleCopilot}
          className="glass-button flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-600/20 border-amber-500/40 hover:scale-105 transition whitespace-nowrap"
          title="Open AI Copilot"
        >
          <FaRobot className="w-3.5 h-3.5 text-amber-400" />
          <span>Copilot</span>
        </button>

        {/* Primary Action: + Ingest */}
        <button
          onClick={onOpenIngestModal}
          className="glass-button flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600/40 border border-indigo-500/50 hover:scale-105 transition whitespace-nowrap shadow-sm shadow-indigo-500/20"
        >
          <FaPlus className="w-3 h-3 text-indigo-300" />
          <span>Ingest</span>
        </button>

        {/* User Account & Actions Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpenSubMenu(openSubMenu === 'user' ? null : 'user')}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition text-xs"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold text-[11px]">
              {currentUser?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="font-bold text-slate-200 max-w-[80px] truncate">{currentUser?.username}</span>
            <FaChevronDown className={`w-2.5 h-2.5 text-slate-400 transition-transform ${openSubMenu === 'user' ? 'rotate-180' : ''}`} />
          </button>

          {openSubMenu === 'user' && (
            <div className="absolute top-full right-0 mt-2 w-56 glass-panel border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 space-y-1 bg-slate-950/95 backdrop-blur-xl text-xs">
              <div className="p-2 border-b border-slate-800 space-y-0.5">
                <div className="font-bold text-slate-200">{currentUser?.username}</div>
                <div className="text-[10px] text-indigo-400 font-bold uppercase">{currentUser?.role}</div>
              </div>

              {/* DB Status Badge inside Menu */}
              <div className="p-2 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5"><FaDatabase className="w-3 h-3 text-indigo-400" /> Database</span>
                <span className={healthStatus?.cockroach === 'connected' || healthStatus?.postgres === 'connected' ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {healthStatus?.cockroach === 'connected' ? 'CockroachDB' : healthStatus?.postgres === 'connected' ? 'PostgreSQL' : 'Checking...'}
                </span>
              </div>

              <button
                onClick={() => {
                  onOpenReportModal();
                  setOpenSubMenu(null);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-900 transition text-left"
              >
                <FaFilePdf className="w-3.5 h-3.5 text-indigo-400" />
                <span>Generate AI Report</span>
              </button>

              <button
                onClick={() => {
                  onOpenExportModal();
                  setOpenSubMenu(null);
                }}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-900 transition text-left"
              >
                <FaDownload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Graph Data</span>
              </button>

              <div className="border-t border-slate-800 pt-1">
                <button
                  onClick={() => {
                    onLogout();
                    setOpenSubMenu(null);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-red-400 hover:bg-red-950/40 transition text-left font-bold"
                >
                  <FaRightFromBracket className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
