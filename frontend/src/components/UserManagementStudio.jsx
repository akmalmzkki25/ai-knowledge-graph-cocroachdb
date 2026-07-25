import React, { useEffect, useState } from 'react';
import { FaUserGear, FaUserPlus, FaShield, FaUserCheck, FaCircleExclamation, FaCircleCheck } from 'react-icons/fa6';
import { fetchUsers, createUser } from '../services/api';

export default function UserManagementStudio() {
  const [users, setUsers] = useState([]);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const loadUsers = async () => {
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createUser({ username: newUsername, password: newPassword, role: newRole });
      setSuccessMsg(`User '${newUsername}' created successfully!`);
      setNewUsername('');
      setNewPassword('');
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-xs font-sans">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 bg-slate-950/80">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300">
            <FaUserGear className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">Superadmin User Management Panel</h2>
            <p className="text-slate-400 text-xs">Only superadmin accounts can create new workspace users.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-950/60 border border-red-800/60 rounded-xl text-red-300 flex items-center gap-2">
            <FaCircleExclamation className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center gap-2">
            <FaCircleCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">New Username</label>
            <input
              type="text"
              required
              placeholder="e.g., researcher1"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="Set initial password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Role</label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="user">Standard User</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full glass-button flex items-center justify-center space-x-2 py-2 rounded-xl font-bold text-white bg-indigo-600/40 border border-indigo-500/50 hover:scale-105 transition"
            >
              <FaUserPlus className="w-3.5 h-3.5" />
              <span>{loading ? 'Creating...' : 'Add Account'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* User List */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
          <FaUserCheck className="w-4 h-4 text-emerald-400" /> Active Workspace Accounts ({users.length})
        </h3>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden">
          {users.map(u => (
            <div key={u.id} className="p-3.5 bg-slate-900/60 flex items-center justify-between hover:bg-slate-900/90 transition">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl ${u.role === 'superadmin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'}`}>
                  <FaShield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-xs">{u.username}</div>
                  <div className="text-[10px] text-slate-500">Created: {new Date(u.created_at).toLocaleDateString()}</div>
                </div>
              </div>

              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                u.role === 'superadmin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
              }`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
