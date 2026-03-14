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
  new: 'from-emerald-400 to-teal-500',
  good: 'from-sky-400 to-blue-500',
  used: 'from-amber-400 to-orange-500',
};
const CATEGORIES = ['Fiction', 'Non-fiction', 'Academic', 'Science', 'History', 'Self-help', 'Children', 'Other'];

export default function Share() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState('all');
  const [filterCategory, setFilterCategory] = useState('');

  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  const [borrowingBook, setBorrowingBook] = useState(null);
  const [borrowMsg, setBorrowMsg] = useState('');
  const [borrowing, setBorrowing] = useState(false);

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/share/books');
      setBooks(data.books || []);
    } catch (err) {
      setError(err?.message || 'Failed to load books');
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

  const filtered = books.filter((b) => {
    if (filterCondition !== 'all' && b.condition !== filterCondition) return false;
    if (filterCategory && b.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${b.bookName} ${b.category} ${b.location} ${b.ownerName}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const geoBooks = filtered.filter((b) => typeof b.lat === 'number' && typeof b.lng === 'number');

  const openBorrow = (book) => {
    if (!auth?.token) { navigate('/login'); return; }
    setBorrowingBook(book);
    setBorrowMsg('');
  };

  const sendBorrow = async (e) => {
    e.preventDefault();
    if (!borrowingBook) return;
    setError('');
    setBorrowing(true);
    try {
      await api(`/api/share/books/${borrowingBook.id}/borrow`, {
        method: 'POST',
        body: { message: borrowMsg },
      });
      setBorrowingBook(null);
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to send borrow request');
    } finally {
      setBorrowing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-teal-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 pt-14 pb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-bold uppercase tracking-widest mb-4">
            📚 Community Lending
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Share <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">Books</span>
          </h1>
          <p className="mt-3 text-teal-200/80 font-medium max-w-xl text-lg">
            Browse books available for borrowing near you. Find one you like and send a borrow request.
          </p>

          {/* Stats bar */}
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-2xl">📖</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{books.length}</div>
                <div className="text-teal-300 text-xs">Books Available</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-2xl">🗺️</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{geoBooks.length}</div>
                <div className="text-teal-300 text-xs">On Map</div>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-2.5">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="text-white font-bold text-lg leading-none">{filtered.length}</div>
                <div className="text-teal-300 text-xs">Matching</div>
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
        <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-teal-400/20">
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
              {geoBooks.map((b) => (
                <Marker key={b.id} position={[b.lat, b.lng]}>
                  <Popup>
                    <div className="text-xs space-y-1 min-w-[160px]">
                      <div className="font-semibold text-sm">{b.bookName}</div>
                      <div>{b.condition} · {b.category}</div>
                      <div className="text-gray-500">{b.location}</div>
                      <div className="text-gray-500">By {b.ownerName}</div>
                      <div className="text-gray-500">Borrow: {b.borrowDuration} days</div>
                      {b.pendingRequests > 0 && (
                        <div className="text-amber-700 font-medium">{b.pendingRequests} pending</div>
                      )}
                      <button
                        type="button"
                        onClick={() => openBorrow(b)}
                        className="mt-1 w-full rounded-lg bg-teal-600 py-1.5 text-[11px] font-medium text-white hover:bg-teal-700"
                      >
                        {auth?.token ? 'Request to Borrow' : 'Login to Borrow'}
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
              <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <input
                type="text"
                placeholder="Search by title, category, location, owner…"
                className="w-full rounded-2xl border border-white/20 bg-white/10 text-white placeholder-teal-300/60 py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:bg-white/15 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Condition pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-teal-300/80 uppercase tracking-wider">Condition:</span>
              {CONDITION_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFilterCondition(c)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${filterCondition === c
                    ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/30'
                    : 'bg-white/10 text-teal-200 border-white/20 hover:bg-white/20'
                    }`}
                >
                  {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>
          {/* Categories */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-teal-300/80 uppercase tracking-wider">Genre:</span>
            <button
              type="button"
              onClick={() => setFilterCategory('')}
              className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${!filterCategory ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-teal-200 border-white/20 hover:bg-white/20'}`}
            >
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFilterCategory(c)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-all ${filterCategory === c
                  ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/30'
                  : 'bg-white/10 text-teal-200 border-white/20 hover:bg-white/20'
                  }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results bar ── */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-teal-300/80 font-medium">
            {loading ? 'Loading…' : `${filtered.length} book${filtered.length !== 1 ? 's' : ''} available`}
          </p>
          <button
            onClick={load}
            className="rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold text-teal-200 hover:bg-white/20 transition-all"
          >
            ↺ Refresh
          </button>
        </div>

        {/* ── Empty state ── */}
        {!loading && filtered.length === 0 && (
          <div className="rounded-3xl bg-white/10 border border-white/15 p-12 text-center backdrop-blur-sm">
            <div className="text-5xl mb-4">📚</div>
            <div className="font-bold text-white text-lg">No books available to borrow</div>
            <div className="mt-2 text-sm text-teal-300/80">
              Try adjusting your filters, or{' '}
              {auth?.token ? (
                <button onClick={() => navigate('/dashboard')} className="underline font-semibold text-teal-400 hover:text-teal-300">
                  share a book from your dashboard
                </button>
              ) : (
                <button onClick={() => navigate('/signup')} className="underline font-semibold text-teal-400 hover:text-teal-300">
                  create an account to share one
                </button>
              )}.
            </div>
          </div>
        )}

        {/* ── Book Cards Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((b) => (
            <div
              key={b.id}
              className="group rounded-3xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/15 hover:border-teal-400/40 hover:shadow-2xl hover:shadow-teal-900/40 hover:-translate-y-1 transition-all duration-300"
            >
              {/* Book cover */}
              {b.imageUrls?.[0] ? (
                <div className="h-44 overflow-hidden">
                  <img
                    src={b.imageUrls[0]}
                    alt={b.bookName}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div className={`h-44 bg-gradient-to-br ${CONDITION_GRADIENTS[b.condition] || 'from-gray-600 to-gray-700'} flex items-center justify-center`}>
                  <span className="text-6xl opacity-40 group-hover:opacity-60 transition-opacity">📖</span>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white leading-snug line-clamp-2 text-sm">{b.bookName}</h3>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[b.condition] || 'bg-gray-100 text-gray-700'}`}>
                    {b.condition}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="inline-flex items-center rounded-lg bg-teal-500/20 border border-teal-400/30 px-2 py-0.5 font-semibold text-teal-300">{b.category}</span>
                  <span className="text-teal-400/60">•</span>
                  <span className="text-teal-200/70">{b.location}</span>
                </div>

                <div className="text-xs text-teal-300/70">
                  Shared by <span className="font-semibold text-teal-200">{b.ownerName}</span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="inline-flex items-center rounded-full bg-teal-500/20 border border-teal-400/30 px-2.5 py-1 font-semibold text-teal-300">
                    ⏱ {b.borrowDuration} day{b.borrowDuration !== 1 ? 's' : ''}
                  </span>
                  {b.pendingRequests > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-400/30 px-2.5 py-1 font-semibold text-amber-300">
                      ⏳ {b.pendingRequests} pending
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-1 font-semibold text-emerald-300">
                      ✅ Available
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openBorrow(b)}
                  className="w-full rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                >
                  {auth?.token ? '📬 Request to Borrow' : '🔑 Login to Borrow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Borrow Modal ── */}
      {borrowingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/15 shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-lg">Request to Borrow</h3>
                  <p className="text-teal-100/80 text-sm mt-0.5">
                    "<span className="font-semibold">{borrowingBook.bookName}</span>" for {borrowingBook.borrowDuration} days
                  </p>
                </div>
                <button onClick={() => setBorrowingBook(null)} className="text-white/70 hover:text-white text-2xl leading-none mt-0.5 transition-colors">×</button>
              </div>
            </div>
            {/* Modal body */}
            <form onSubmit={sendBorrow} className="p-6 grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-teal-300">Message to the owner <span className="text-teal-400/60 font-normal">(optional)</span></span>
                <textarea
                  className="rounded-2xl border border-white/20 bg-white/10 text-white placeholder-slate-400 px-4 py-3 text-sm min-h-24 focus:outline-none focus:ring-2 focus:ring-teal-500/50 resize-none transition-all"
                  value={borrowMsg}
                  onChange={(e) => setBorrowMsg(e.target.value)}
                  placeholder="Tell the owner why you'd like to borrow this book…"
                />
              </label>
              <div className="flex gap-3">
                <button
                  disabled={borrowing}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-teal-500/30 transition-all active:scale-95 disabled:opacity-60"
                >
                  {borrowing ? 'Sending…' : '📬 Send Request'}
                </button>
                <button
                  type="button"
                  onClick={() => setBorrowingBook(null)}
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
