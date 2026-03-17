import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getAuth } from '../lib/auth';

const CONDITION_OPTIONS = ['all', 'new', 'good', 'used'];
const CONDITION_COLORS = {
  new: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  good: 'bg-sky-100 text-sky-700 border border-sky-200',
  used: 'bg-amber-100 text-amber-700 border border-amber-200',
};
const CONDITION_GRADIENTS = {
  new: 'from-emerald-500 to-teal-600',
  good: 'from-sky-500 to-blue-600',
  used: 'from-amber-500 to-orange-600',
};
const CATEGORIES = ['Fiction', 'Non-fiction', 'Academic', 'Science', 'History', 'Self-help', 'Children', 'Thriller', 'Horror', 'Comics', 'Fantasy', 'Other'];

export default function Exchange() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');

  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  const [requestingOffer, setRequestingOffer] = useState(null);
  const [offeredBook, setOfferedBook] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/exchange/offers');
      setOffers(data.offers || []);
    } catch (err) {
      setError(err?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUserLat(pos.coords.latitude); setUserLng(pos.coords.longitude); },
        () => { }
      );
    }
  }, []);

  const filtered = offers.filter((o) => {
    if (filterCondition !== 'all' && o.condition !== filterCondition) return false;
    if (filterCategory && o.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${o.bookName} ${o.category} ${o.location} ${o.ownerName} ${o.wantedBook}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const geoOffers = filtered.filter((o) => typeof o.lat === 'number' && typeof o.lng === 'number');

  const openRequest = (offer) => {
    if (!auth?.token) { navigate('/login'); return; }
    setRequestingOffer(offer);
    setOfferedBook('');
    setMessage('');
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!requestingOffer) return;
    setError('');
    setSending(true);
    try {
      await api(`/api/exchange/offers/${requestingOffer.id}/requests`, {
        method: 'POST',
        body: { offeredBook, message },
      });
      setRequestingOffer(null);
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to send request');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-14 pb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold uppercase tracking-widest mb-4">
            🔄 Local Exchanges
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Book <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-primary-400">Exchange</span>
          </h1>
          <p className="mt-3 text-violet-200/80 font-medium max-w-xl text-lg">
            Discover books available for exchange near you. Browse the map and send an exchange request.
          </p>

          {/* Stats bar */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-2xl">📚</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{offers.length}</div>
                <div className="text-violet-300 text-xs">Offers Listed</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-2xl">📍</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{geoOffers.length}</div>
                <div className="text-violet-300 text-xs">On Map</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{filtered.length}</div>
                <div className="text-violet-300 text-xs">Matching</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-12 space-y-6">
        {error && (
          <div className="rounded-2xl bg-red-500/20 border border-red-400/30 px-5 py-3 text-sm text-red-300 backdrop-blur-sm">
            {error}
          </div>
        )}

        {/* ── Map ── */}
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-violet-400/20">
          <div className="h-80 w-full">
            <MapContainer
              center={userLat && userLng ? [userLat, userLng] : [23.8103, 90.4125]}
              zoom={userLat && userLng ? 15 : 6}
              className="h-full w-full z-0"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {userLat && userLng && (
                <Marker position={[userLat, userLng]}>
                  <Popup><strong>You are here</strong></Popup>
                </Marker>
              )}
              {geoOffers.map((o) => (
                <Marker key={o.id} position={[o.lat, o.lng]}>
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[160px]">
                      <div className="font-semibold text-sm">{o.bookName}</div>
                      <div>{o.condition} · {o.category}</div>
                      <div className="text-gray-500">{o.location}</div>
                      <div className="text-gray-500">By {o.ownerName}</div>
                      {o.pendingRequests > 0 && (
                        <div className="text-amber-700 font-medium">{o.pendingRequests} pending request{o.pendingRequests > 1 ? 's' : ''}</div>
                      )}
                      <button
                        type="button"
                        onClick={() => openRequest(o)}
                        className="mt-1 w-full rounded-lg bg-violet-600 py-1.5 text-[11px] font-medium text-white hover:bg-violet-700"
                      >
                        {auth?.token ? 'Request Exchange' : 'Login to Request'}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="rounded-3xl bg-white/10 backdrop-blur-xl border border-white/15 shadow-xl p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, category, location, owner…"
                className="w-full rounded-2xl border border-white/20 bg-white/10 text-white placeholder-violet-300/60 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 focus:bg-white/15 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Condition pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-violet-300/80 uppercase tracking-wider">Condition:</span>
              {CONDITION_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCondition(c)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${filterCondition === c
                    ? 'bg-violet-500 text-white border-violet-500 shadow-lg shadow-violet-500/30'
                    : 'bg-white/10 text-violet-200 border-white/20 hover:bg-white/20'
                    }`}
                >
                  {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-violet-300/80 uppercase tracking-wider">Genre:</span>
            <button
              type="button"
              onClick={() => setFilterCategory('')}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${!filterCategory ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/30' : 'bg-white/10 text-violet-200 border-white/20 hover:bg-white/20'}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${filterCategory === c
                  ? 'bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/30'
                  : 'bg-white/10 text-violet-200 border-white/20 hover:bg-white/20'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results bar ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-violet-300/80 font-medium">
            {loading ? 'Loading…' : `${filtered.length} offer${filtered.length !== 1 ? 's' : ''} found`}
          </p>
          <button
            onClick={load}
            className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-violet-200 hover:bg-white/20 transition-all"
          >
            ↺ Refresh
          </button>
        </div>

        {/* ── Empty state ── */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl bg-white/10 border border-white/15 p-12 text-center backdrop-blur-sm">
            <div className="text-5xl mb-4">🔄</div>
            <div className="font-bold text-white text-lg">No offers match your search</div>
            <div className="mt-2 text-sm text-violet-300/80">
              Try adjusting your filters, or{' '}
              {auth?.token ? (
                <button onClick={() => navigate('/dashboard', { state: { section: 'exchange', exTab: 'create' } })} className="underline font-semibold text-violet-400 hover:text-violet-300">
                  post your own exchange offer
                </button>
              ) : (
                <button onClick={() => navigate('/signup')} className="underline font-semibold text-violet-400 hover:text-violet-300">
                  create an account to post one
                </button>
              )}.
            </div>
          </div>
        )}

        {/* ── Exchange Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((o) => (
            <div
              key={o.id}
              className="group rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/15 hover:border-violet-400/40 hover:shadow-2xl hover:shadow-violet-900/40 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Book cover */}
              {o.imageUrls?.[0] ? (
                <div className="h-44 overflow-hidden">
                  <img
                    src={o.imageUrls[0]}
                    alt={o.bookName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className={`h-44 bg-gradient-to-br ${CONDITION_GRADIENTS[o.condition] || 'from-gray-600 to-gray-700'} flex flex-col items-center justify-center gap-2`}>
                  <span className="text-6xl opacity-40 group-hover:opacity-60 transition-opacity">📗</span>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white leading-snug line-clamp-2 text-sm">{o.bookName}</h3>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[o.condition] || 'bg-gray-100 text-gray-700'}`}>
                    {o.condition}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center rounded-lg bg-violet-500/20 border border-violet-400/30 px-2 py-0.5 font-semibold text-violet-300">{o.category}</span>
                  <span className="text-violet-400/60">•</span>
                  <span className="text-violet-200/70">{o.location}</span>
                </div>

                <div className="text-xs text-violet-300/70">
                  Posted by <span className="font-semibold text-violet-200">{o.ownerName}</span>
                </div>

                {o.wantedBook && (
                  <div className="rounded-xl bg-violet-500/15 border border-violet-400/20 px-3 py-2 text-xs text-violet-200">
                    <span className="font-semibold text-violet-300">Wants:</span> {o.wantedBook}
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs">
                  {o.pendingRequests > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 font-semibold text-amber-300">
                      ⏳ {o.pendingRequests} pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 font-semibold text-emerald-300">
                      ✅ Open
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openRequest(o)}
                  className="w-full rounded-2xl bg-gradient-to-r from-violet-500 to-primary-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  {auth?.token ? '🔄 Request Exchange' : '🔑 Login to Request'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Exchange Request Modal ── */}
      {requestingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-violet-600 to-primary-600 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-lg">Request Exchange</h3>
                  <p className="text-violet-100/80 text-sm mt-0.5">
                    For "<span className="font-semibold">{requestingOffer.bookName}</span>"
                  </p>
                </div>
                <button onClick={() => setRequestingOffer(null)} className="text-white/70 hover:text-white text-2xl leading-none mt-0.5 transition-colors">×</button>
              </div>
            </div>
            {/* Modal body */}
            <form onSubmit={sendRequest} className="p-6 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-violet-300">Book you offer in return <span className="text-red-400">*</span></span>
                <input
                  className="rounded-2xl border border-white/20 bg-white/10 text-white placeholder-slate-400 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
                  value={offeredBook}
                  onChange={(e) => setOfferedBook(e.target.value)}
                  placeholder="e.g. The Great Gatsby"
                  required
                  autoFocus
                />
              </label>
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-violet-300">Message <span className="text-violet-400/60 font-normal">(optional)</span></span>
                <textarea
                  className="rounded-2xl border border-white/20 bg-white/10 text-white placeholder-slate-400 px-4 py-3 text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none transition-all"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell the owner more about your offer…"
                />
              </label>
              <div className="flex gap-3">
                <button
                  disabled={sending}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-violet-500 to-primary-500 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-60"
                >
                  {sending ? 'Sending…' : '🔄 Send Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setRequestingOffer(null)}
                  className="rounded-2xl border border-white/20 bg-white/10 text-white px-5 py-2.5 text-sm font-medium hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
