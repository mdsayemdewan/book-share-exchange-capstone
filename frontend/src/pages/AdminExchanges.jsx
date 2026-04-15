import { useEffect, useState } from 'react';
import { api } from '../lib/api';

// ── Confirm delete modal ──────────────────────────────────────────────────────
function ConfirmModal({ item, onConfirm, onCancel }) {
  if (!item) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-3xl bg-slate-800 border border-white/10 shadow-2xl p-8 flex flex-col gap-5">
        <div className="text-4xl text-center">🗑️</div>
        <h3 className="text-xl font-extrabold text-white text-center">Delete this exchange post?</h3>
        <p className="text-sm text-slate-400 text-center">
          <span className="font-semibold text-white">"{item.bookName}"</span> by{' '}
          <span className="text-purple-300">{item.ownerName}</span> will be permanently deleted
          along with all related exchange requests. This cannot be undone.
        </p>
        <div className="flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 py-3 text-sm font-bold text-white hover:opacity-90 shadow-lg shadow-red-500/20 active:scale-95 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    open: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    closed: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-xs font-bold ${map[status] || 'bg-white/10 text-slate-300 border-white/10'}`}>
      {status}
    </span>
  );
}

export default function AdminExchanges() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmItem, setConfirmItem] = useState(null);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/admin/exchanges');
      setOffers(data.offers || []);
    } catch (err) {
      setError(err?.message || 'Failed to load exchange posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const confirmDelete = async () => {
    if (!confirmItem) return;
    const item = confirmItem;
    setConfirmItem(null);
    setError('');
    try {
      await api(`/api/admin/exchanges/${item.id}`, { method: 'DELETE' });
      setOffers((prev) => prev.filter((o) => o.id !== item.id));
    } catch (err) {
      setError(err?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <ConfirmModal
        item={confirmItem}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmItem(null)}
      />

      {/* Header */}
      <div className="relative border-b border-white/10 bg-slate-800/50 backdrop-blur-xl overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl mix-blend-screen opacity-50 pointer-events-none" />
        <div className="mx-auto max-w-5xl px-4 py-10 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-bold uppercase tracking-widest mb-4">
                 Admin · Exchange Posts
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Manage Exchange Posts</h1>
              <p className="mt-2 text-sm text-slate-400 font-medium max-w-lg">
                View and delete any user's exchange offer listing from the platform.
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
              All Exchange Posts
              <span className="inline-flex items-center justify-center rounded-xl bg-purple-500/30 border border-purple-500/40 text-purple-200 px-3 py-1 text-xs font-extrabold">
                {offers.length}
              </span>
            </h3>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
              Loading exchange posts…
            </div>
          ) : offers.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="text-6xl mb-6">📭</div>
              <h3 className="text-2xl font-extrabold text-white mb-2">No exchange posts yet</h3>
              <p className="text-slate-400 text-sm">No exchange offers have been created on the platform.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {offers.map((offer) => (
                <div
                  key={offer.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex gap-4 items-center">
                    {/* Offer image */}
                    <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 shadow-md">
                      {offer.imageUrls?.[0] ? (
                        <img src={offer.imageUrls[0]} alt={offer.bookName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-2xl bg-gradient-to-tr from-slate-700 to-slate-600">
                          🔄
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-base truncate">{offer.bookName}</div>
                      {offer.wantedBook && (
                        <div className="text-xs text-purple-300 font-semibold mt-0.5">
                          Wants: {offer.wantedBook}
                        </div>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                        <span className="text-xs text-slate-400"><span className="opacity-60">By</span> {offer.ownerName}</span>
                        <span className="text-xs text-slate-500 truncate">{offer.ownerEmail}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2 items-center">
                        <StatusBadge status={offer.status} />
                        <span className="text-xs bg-white/5 border border-white/10 text-slate-400 px-2.5 py-0.5 rounded-full">{offer.category}</span>
                        <span className="text-xs bg-white/5 border border-white/10 text-slate-400 px-2.5 py-0.5 rounded-full">{offer.condition}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {offer.createdAt ? new Date(offer.createdAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmItem(offer)}
                    className="shrink-0 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors active:scale-95"
                  >
                    🗑️ Delete
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
