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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Approve or reject pending users.</p>
        </div>
        <button onClick={load} className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50">
          Refresh
        </button>
      </div>

      {error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

      <div className="mt-6 rounded-2xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b">
          <div className="font-medium text-gray-900">Pending users</div>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-gray-600">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-6 text-sm text-gray-600">No pending users.</div>
        ) : (
          <div className="divide-y">
            {users.map((u) => (
              <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex gap-3">
                  <img
                    src={u.imageUrls?.[0]}
                    alt={u.name}
                    className="h-12 w-12 rounded-xl object-cover border"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{u.name}</div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                    <div className="text-xs text-gray-500">
                      {u.phone} • lat {u.location?.lat}, lng {u.location?.lng}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(u.id, 'approve')}
                    className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-500"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(u.id, 'reject')}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-500"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
