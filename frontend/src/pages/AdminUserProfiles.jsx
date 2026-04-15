import { useEffect, useState } from 'react';
import { api, isNetworkError } from '../lib/api';

// ── Profile detail drawer ─────────────────────────────────────────────────────
function ProfileDrawer({ user, onClose }) {
  if (!user) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-b border-white/10 p-8 flex flex-col items-center gap-4">
          <div className="h-24 w-24 rounded-[2rem] overflow-hidden bg-slate-700 border-2 border-white/15 shadow-xl">
            {user.imageUrls?.[0] ? (
              <img src={user.imageUrls[0]} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-4xl font-extrabold text-slate-200 bg-gradient-to-tr from-indigo-700 to-purple-700">
                {user.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-white">{user.name}</div>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                user.status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : user.status === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>{user.status}</span>
              {user.role === 'admin' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Admin</span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors font-bold"
          >
            ✕
          </button>
        </div>

        {/* Detail rows */}
        <div className="p-6 flex flex-col gap-3">
          <ProfileRow  label="Email" value={user.email} />
          <ProfileRow  label="Phone" value={user.phone || '—'} />
          <ProfileRow  label="Points" value={user.points ?? '—'} />
          <ProfileRow  label="Location" value={
            user.location?.lat
              ? `${user.location.lat.toFixed(5)}, ${user.location.lng?.toFixed(5)}`
              : '—'
          } />
          <ProfileRow  label="Joined" value={
            user.createdAt
              ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
              : '—'
          } />
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-white/10 border border-white/15 py-3 text-sm font-bold text-white hover:bg-white/15 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3 border border-white/5">
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{label}</div>
        <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{value}</div>
      </div>
    </div>
  );
}

export default function AdminUserProfiles() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Profile drawer state
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      if (isNetworkError(err)) {
        setTimeout(load, 3000);
        return;
      }
      setError(err?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openProfile = async (u) => {
    setSelectedUserId(u.id);
    setProfileData(null);
    setProfileError('');
    setProfileLoading(true);
    try {
      const data = await api(`/api/admin/users/${u.id}/profile`);
      setProfileData(data.user);
    } catch (err) {
      setProfileError(err?.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const closeProfile = () => {
    setSelectedUserId(null);
    setProfileData(null);
    setProfileError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">

      {/* Profile drawer / loading overlay */}
      {selectedUserId && (
        profileLoading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              <span className="text-slate-300 font-medium">Loading profile…</span>
            </div>
          </div>
        ) : profileError ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-slate-800 border border-red-500/30 rounded-3xl p-8 max-w-sm w-full text-center flex flex-col gap-4">
              <div className="text-4xl">⚠️</div>
              <p className="text-red-300 font-bold">{profileError}</p>
              <button onClick={closeProfile} className="rounded-2xl bg-white/10 border border-white/15 py-3 text-sm font-bold text-white hover:bg-white/15 transition-colors">Close</button>
            </div>
          </div>
        ) : (
          <ProfileDrawer user={profileData} onClose={closeProfile} />
        )
      )}

      {/* Header */}
      <div className="relative border-b border-white/10 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl mix-blend-screen opacity-50 pointer-events-none" />
        <div className="mx-auto max-w-5xl px-4 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">
                 Admin · User Profiles
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">User Profiles</h1>
              <p className="mt-2 text-sm text-slate-400 font-medium max-w-lg">
                Browse all registered users and view their full profile details.
              </p>
            </div>
            <button
              onClick={load}
              className="self-start md:self-auto flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white hover:bg-white/20 shadow-lg transition-all active:scale-95"
            >
              <span>↻</span> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        {error && (
          <div className="mb-8 rounded-2xl bg-red-500/10 p-5 border border-red-500/30 flex gap-4 text-red-300 shadow-lg">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm font-bold flex items-center">{error}</p>
          </div>
        )}

        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md overflow-hidden">
          <div className="px-8 py-5 border-b border-white/10 bg-white/[0.02]">
            <h3 className="font-bold text-white flex items-center gap-3 text-lg">
              All Users
              <span className="inline-flex items-center justify-center rounded-xl bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 px-3 py-1 text-xs font-extrabold">
                {users.length}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
              Loading users…
            </div>
          ) : users.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <h3 className="text-2xl font-extrabold text-white mb-2">No users found</h3>
              <p className="text-slate-400 text-sm">No user accounts exist yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    {/* Avatar */}
                    <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shadow-md">
                      {u.imageUrls?.[0] ? (
                        <img src={u.imageUrls[0]} alt={u.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl font-extrabold text-slate-300 bg-gradient-to-tr from-slate-700 to-slate-600">
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-base">{u.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{u.phone || '—'}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${
                          u.status === 'approved'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : u.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-red-500/15 text-red-300 border-red-500/30'
                        }`}>{u.status}</span>
                        {u.role === 'admin' && (
                          <span className="px-2.5 py-0.5 rounded-full border text-xs font-bold bg-indigo-500/15 text-indigo-300 border-indigo-500/30">Admin</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* View profile button */}
                  <button
                    onClick={() => openProfile(u)}
                    className="shrink-0 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 shadow-md shadow-indigo-500/20 active:scale-95 transition-all"
                  >
                     View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
