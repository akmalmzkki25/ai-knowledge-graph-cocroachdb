import React, { useState } from 'react';
import { FaDiagramProject, FaLock, FaUser, FaWandMagicSparkles, FaCircleExclamation } from 'react-icons/fa6';
import { loginUser } from '../services/api';

export default function LoginScreen({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await loginUser(username, password);
      onLoginSuccess(data.user, data.access_token);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow Effects Background */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel border border-slate-800 rounded-3xl p-8 shadow-2xl z-10 bg-slate-950/80 backdrop-blur-2xl space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl text-indigo-400 mb-2">
            <FaDiagramProject className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            AetherBio AI
          </h1>
          <p className="text-xs text-slate-400">Next-Gen Multi-Hop Biomedical Graph Intelligence</p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 text-xs flex items-center gap-2">
            <FaCircleExclamation className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Username</label>
            <div className="relative">
              <FaUser className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                required
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Password</label>
            <div className="relative">
              <FaLock className="w-3.5 h-3.5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full glass-button flex items-center justify-center space-x-2 py-3 rounded-xl font-bold text-white bg-indigo-600/40 border border-indigo-500/50 hover:scale-105 transition shadow-lg shadow-indigo-500/20"
          >
            <FaWandMagicSparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
          </button>
        </form>

        <div className="pt-4 border-t border-slate-800/80 text-center text-[11px] text-slate-500">
          Strict Multi-Tenant Access • Public registration is disabled.
        </div>
      </div>
    </div>
  );
}
