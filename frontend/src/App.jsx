import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import GraphCanvas from './components/GraphCanvas';
import GraphCanvas3D from './components/GraphCanvas3D';
import CausalMatrix from './components/CausalMatrix';
import CounterfactualStudio from './components/CounterfactualStudio';
import HypothesisStudio from './components/HypothesisStudio';
import LintStudio from './components/LintStudio';
import DrugCompareStudio from './components/DrugCompareStudio';
import UserManagementStudio from './components/UserManagementStudio';
import LoginScreen from './components/LoginScreen';
import IngestModal from './components/IngestModal';
import ExportModal from './components/ExportModal';
import ReportModal from './components/ReportModal';
import ManageSourcesModal from './components/ManageSourcesModal';
import CopilotDrawer from './components/CopilotDrawer';
import PathFinderWorkbench from './components/PathFinderWorkbench';
import { checkHealth, fetchCurrentUser } from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aetherbio_token'));
  const [activeTab, setActiveTab] = useState('graph');
  const [showPathWorkbench, setShowPathWorkbench] = useState(false);
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isManageSourcesOpen, setIsManageSourcesOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const user = await fetchCurrentUser();
          setCurrentUser(user);
        } catch (err) {
          console.error("Token verification failed, clearing auth", err);
          handleLogout();
        }
      }
    };
    initAuth();
  }, [token]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await checkHealth();
        setHealthStatus(data);
      } catch (err) {
        setHealthStatus({ status: 'error', cockroach: 'disconnected' });
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleLoginSuccess = (user, accessToken) => {
    localStorage.setItem('aetherbio_token', accessToken);
    setToken(accessToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('aetherbio_token');
    setToken(null);
    setCurrentUser(null);
  };

  // If unauthenticated, render LoginScreen
  if (!token || !currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenIngestModal={() => setIsIngestOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
        onOpenReportModal={() => setIsReportOpen(true)}
        onOpenManageSourcesModal={() => setIsManageSourcesOpen(true)}
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)}
        showPathWorkbench={showPathWorkbench}
        setShowPathWorkbench={setShowPathWorkbench}
        healthStatus={healthStatus}
        currentUser={currentUser}
        onLogout={handleLogout}
        onDataReset={() => window.location.reload()}
      />

      <AnalyticsDashboard />

      <main className="flex-1 relative">
        {activeTab === 'graph' && (
          <div className="flex flex-col h-full relative">
            {showPathWorkbench && (
              <div className="p-3 bg-slate-900/80 border-b border-slate-800 animate-in slide-in-from-top duration-200 z-20">
                <PathFinderWorkbench onClose={() => setShowPathWorkbench(false)} />
              </div>
            )}
            <GraphCanvas
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onRunSimulation={() => setActiveTab('simulation')}
            />
          </div>
        )}
        {activeTab === 'graph3d' && <GraphCanvas3D />}
        {activeTab === 'matrix' && <CausalMatrix />}
        {activeTab === 'simulation' && <CounterfactualStudio />}
        {activeTab === 'compare' && <DrugCompareStudio />}
        {activeTab === 'hypotheses' && <HypothesisStudio />}
        {activeTab === 'lint' && <LintStudio />}
        {activeTab === 'users' && <UserManagementStudio />}
      </main>

      <CopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
      />

      <IngestModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onIngestSuccess={(result) => {
          alert(`Successfully extracted ${result.triplets.length} causal triplets!`);
          window.location.reload();
        }}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />

      <ManageSourcesModal
        isOpen={isManageSourcesOpen}
        onClose={() => setIsManageSourcesOpen(false)}
        onDataChanged={() => window.location.reload()}
      />
    </div>
  );
}
