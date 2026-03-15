import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/admin/users?status=pending');
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, type) => {
    setError('');
    try {
      await api(`/api/admin/users/${id}/${type}`, { method: 'PATCH' });
      await load();
    } catch (err) {
      setError(err?.message || 'Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      {/* Decorative Top Bar Area */}
      <div className="relative border-b border-white/10 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl mix-blend-screen opacity-50"></div>
        <div className="mx-auto max-w-5xl px-4 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                🛡️ Admin Panel
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">User Management</h1>
              <p className="mt-2 text-sm text-slate-400 font-medium max-w-lg">Review and approve pending user registrations to give them platform access.</p>
            </div>
            <button onClick={load} className="self-start md:self-auto flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 shadow-lg shadow-black/20 transition-all active:scale-95">
              <span>↻</span> Refresh List
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 relative">
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>

        {error ? <div className="mb-8 rounded-2xl bg-red-500/10 p-5 border border-red-500/30 flex gap-4 text-red-300 shadow-lg backdrop-blur-sm"><span className="text-2xl leading-none drop-shadow">⚠️</span><p className="text-sm font-bold flex items-center">{error}</p></div> : null}

        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md overflow-hidden relative z-10">
          <div className="px-8 py-5 border-b border-white/10 bg-white/[0.02]">
            <h3 className="font-bold text-white flex items-center gap-3 text-lg">
              Pending Approvals 
              <span className="inline-flex items-center justify-center rounded-xl bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 px-3 py-1 text-xs font-extrabold shadow-inner">{users.length}</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
              Loading pending users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="text-6xl mb-6 drop-shadow-lg">✨</div>
              <h3 className="text-2xl font-extrabold text-white mb-2">All caught up!</h3>
              <p className="text-slate-400 font-medium text-sm">No pending users require approval at the moment.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((u) => (
                <div key={u.id} className="p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:bg-white/5 transition-colors">
                  <div className="flex gap-5 items-center">
                    <div className="h-20 w-20 shrink-0 rounded-[1.5rem] overflow-hidden bg-slate-800 border-2 border-white/10 shadow-lg">
                      {u.imageUrls?.[0] ? (
                        <img src={u.imageUrls[0]} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300 text-3xl font-extrabold bg-gradient-to-tr from-slate-700 to-slate-600">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-extrabold text-white text-xl mb-1">{u.name}</div>
                      <div className="text-sm font-semibold text-slate-400 flex flex-wrap gap-x-5 gap-y-2 mt-2 bg-white/5 py-2 px-3 rounded-xl border border-white/5 inline-flex">
                        <span className="flex items-center gap-1.5"><span className="opacity-70">📧</span> {u.email}</span>
                        <span className="flex items-center gap-1.5"><span className="opacity-70">📱</span> {u.phone}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-500 mt-3 flex items-center gap-1 ml-1 opacity-80">
                        📍 Coordinates: {u.location?.lat?.toFixed(5) || 'Unknown'}, {u.location?.lng?.toFixed(5) || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5 w-full md:w-auto">
                    <button
                      onClick={() => act(u.id, 'reject')}
                      className="flex-1 md:flex-none rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors shadow-sm"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => act(u.id, 'approve')}
                      className="flex-1 md:flex-none rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3 text-sm font-bold text-white hover:opacity-90 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex justify-center"
                    >
                      Approve User
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
