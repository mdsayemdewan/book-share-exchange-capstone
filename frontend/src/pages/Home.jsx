import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getAuth } from '../lib/auth';

const CONDITION_COLORS = { new: 'bg-emerald-100 text-emerald-800', good: 'bg-sky-100 text-sky-800', used: 'bg-amber-100 text-amber-800' };

export default function Home() {
  const navigate = useNavigate();
  const auth = getAuth();

  const [data, setData] = useState({ shares: [], exchanges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await api('/api/home/recent');
      setData(result);
    } catch (err) {
      setError(err?.message || 'Failed to load recent posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ── */}
      <section className="bg-gradient-to-br from-violet-50 via-white to-sky-50 border-b">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24 grid gap-10 md:grid-cols-2 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              A Community-Driven <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-sky-600">
                Book Platform
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-md leading-relaxed">
              Share the books you love, borrow from neighbors, or exchange your collection. Earn reward points every time you participate in creating a thriving reading community.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/share"
                className="rounded-full bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition transform hover:-translate-y-0.5"
              >
                Find Books to Borrow
              </Link>
              {!auth?.token ? (
                <Link
                  to="/signup"
                  className="rounded-full border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  Join for Free
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="rounded-full border-2 border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>
          </div>

          <div className="hidden md:flex gap-4 justify-end">
            {/* Decorative static cards */}
            <div className="flex flex-col gap-4 mt-12">
              <div className="rounded-2xl border bg-white p-5 shadow-sm transform -rotate-3 transition hover:rotate-0 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">📚</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Atomic Habits</div>
                    <div className="text-xs text-gray-500">Shared by Sarah in Dhaka</div>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-5 shadow-sm transform rotate-2 transition hover:rotate-0 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-sky-600">✨</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Exchange Complete!</div>
                    <div className="text-xs text-gray-500">You earned +1 Reward Point</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm transform rotate-3 transition hover:rotate-0 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">🤝</div>
                  <div>
                    <div className="font-semibold text-sm text-gray-900">Looking for 1984</div>
                    <div className="text-xs text-gray-500">Will trade for The Hobbit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <div className="mx-auto max-w-6xl px-4 py-16 space-y-16">
        {error && <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 border border-red-200">{error}</div>}

        {/* ── Book Shares Section ── */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Book Shares</h2>
              <p className="mt-1 text-sm text-gray-500">Discover books available to borrow from the community.</p>
            </div>
            <Link to="/share" className="text-sm font-semibold text-sky-600 hover:text-sky-700 hidden sm:block">
              Show more shares &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border bg-white/50 h-72 animate-pulse"></div>
              ))}
            </div>
          ) : data.shares.length === 0 ? (
            <div className="rounded-2xl border bg-gray-50 border-dashed p-10 text-center text-gray-500">
              No recent shares found. Be the first to share a book!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.shares.map((b) => (
                <div key={b.id} className="group rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition">
                  {b.imageUrls?.[0] ? (
                    <div className="h-48 bg-gray-100 relative">
                      <img src={b.imageUrls[0]} alt={b.bookName} className="h-full w-full object-cover" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                        {b.borrowDuration} days
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center relative">
                      <span className="text-5xl opacity-30">📖</span>
                      <div className="absolute top-2 right-2 bg-white/90 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">
                        {b.borrowDuration} days
                      </div>
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">{b.bookName}</h3>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[b.condition] || 'bg-gray-100 text-gray-800'}`}>
                        {b.condition}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 gap-1.5">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-700">{b.category}</span>
                      <span>•</span>
                      <span className="truncate">{b.location}</span>
                    </div>
                    <div className="text-xs text-gray-500 pt-1">
                      Shared by <span className="font-medium text-gray-700">{b.ownerName}</span>
                    </div>
                    <Link
                      to="/share"
                      className="mt-3 block w-full text-center rounded-xl bg-gray-50 py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 sm:hidden">
            <Link to="/share" className="block w-full text-center rounded-xl border-2 border-gray-100 bg-white py-3 text-sm font-semibold text-gray-700">
              Show more shares
            </Link>
          </div>
        </section>

        {/* ── Book Exchanges Section ── */}
        <section>
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Recent Book Exchanges</h2>
              <p className="mt-1 text-sm text-gray-500">Trade your books for titles you've been wanting to read.</p>
            </div>
            <Link to="/exchange" className="text-sm font-semibold text-sky-600 hover:text-sky-700 hidden sm:block">
              Show more exchanges &rarr;
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border bg-white/50 h-72 animate-pulse"></div>
              ))}
            </div>
          ) : data.exchanges.length === 0 ? (
            <div className="rounded-2xl border bg-gray-50 border-dashed p-10 text-center text-gray-500">
              No recent exchanges found. Post the first offer!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.exchanges.map((o) => (
                <div key={o.id} className="group rounded-2xl border bg-white shadow-sm overflow-hidden hover:shadow-md transition">
                  {o.imageUrls?.[0] ? (
                    <div className="h-48 bg-gray-100">
                      <img src={o.imageUrls[0]} alt={o.bookName} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
                      <span className="text-5xl opacity-30">🔄</span>
                    </div>
                  )}
                  <div className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase mb-0.5">Offering</div>
                        <h3 className="font-bold text-gray-900 leading-snug line-clamp-1">{o.bookName}</h3>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[o.condition] || 'bg-gray-100 text-gray-800'}`}>
                        {o.condition}
                      </span>
                    </div>
                    {o.wantedBook && (
                      <div className="rounded-lg bg-sky-50 border border-sky-100 p-2 text-xs mt-2">
                        <span className="font-semibold text-sky-700">Looking for:</span> {o.wantedBook}
                      </div>
                    )}
                    <div className="flex items-center text-xs text-gray-500 gap-1.5 pt-1">
                      <span className="bg-gray-100 px-2 py-0.5 rounded-md font-medium text-gray-700">{o.category}</span>
                      <span>•</span>
                      <span className="truncate">{o.location}</span>
                    </div>
                    <Link
                      to="/exchange"
                      className="mt-3 block w-full text-center rounded-xl bg-gray-900 py-2.5 text-xs font-semibold text-white hover:bg-gray-800 transition"
                    >
                      Offer an Exchange
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 sm:hidden">
            <Link to="/exchange" className="block w-full text-center rounded-xl border-2 border-gray-100 bg-white py-3 text-sm font-semibold text-gray-700">
              Show more exchanges
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
