import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getAuth } from '../lib/auth';

const CONDITION_COLORS = { new: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30', good: 'bg-sky-500/20 text-sky-300 border border-sky-500/30', used: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' };

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
      setData({
        shares: result?.shares || [],
        exchanges: result?.exchanges || []
      });
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
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-primary-500/30">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden border-b border-white/5 bg-slate-800/20">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 pointer-events-none">
          <div className="h-[600px] w-[600px] rounded-full bg-primary-500/10 mix-blend-screen blur-[100px]"></div>
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-violet-500/10 mix-blend-screen blur-[100px]"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="h-[450px] w-[450px] rounded-full bg-indigo-500/10 mix-blend-screen blur-[100px]"></div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-20 md:py-28 grid gap-12 md:grid-cols-2 items-center z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-500/10 text-primary-300 text-xs font-bold uppercase tracking-widest border border-primary-500/20 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-400"></span>
              </span>
              The Premier Book Share and Exchange Network
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] drop-shadow-md">
              Share Books, <br />
              Grow your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-indigo-400 to-violet-400 pb-2">
                Community.
              </span>
            </h1>

            <p className="text-lg text-slate-400 max-w-md leading-relaxed">
              Discover your next favorite book. Share the books you love, borrow from neighbors and earn points while building a thriving reading culture.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/share"
                className="group relative inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary-500/25 transition-all duration-300 hover:shadow-primary-500/40 hover:-translate-y-1"
              >
                Explore Books
                <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
              {!auth?.token ? (
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/5 backdrop-blur-sm px-8 py-4 text-sm font-bold text-white transition-all duration-300 hover:bg-white/10 hover:border-white/30"
                >
                  Join for Free
                </Link>
              ) : (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-primary-500/30 bg-primary-500/10 backdrop-blur-sm px-8 py-4 text-sm font-bold text-primary-300 transition-all duration-300 hover:bg-primary-500/20"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {['bg-primary-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500'].map((bg, i) => (
                  <div key={i} className={`h-10 w-10 rounded-full border-2 border-slate-900 ${bg} flex items-center justify-center text-[10px] font-extrabold text-white shadow-md`}>
                    U{i + 1}
                  </div>
                ))}
              </div>
              <div className="text-sm font-medium text-slate-400">
                Join <span className="text-white font-bold">1,000+</span> readers
              </div>
            </div>
          </div>

          <div className="relative hidden md:block">
            {/* Main Illustration or Composition */}
            <div className="relative w-full aspect-square max-w-md mx-auto">
              {/* Central Background shape */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/10 to-violet-500/10 border border-white/5 rounded-[3rem] rotate-3 scale-95 backdrop-blur-sm shadow-2xl"></div>

              {/* Floating Cards */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center z-20">
                  {/* Card 1 */}
                  <div className="absolute top-10 right-4 rounded-2xl bg-slate-800/80 border border-white/10 p-4 shadow-xl backdrop-blur-md animate-float" style={{ animationDelay: '0s' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xl shadow-inner">📚</div>
                      <div>
                        <div className="font-bold text-white text-sm">Atomic Habits</div>
                        <div className="text-xs font-semibold text-slate-400">Shared by Jakia</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2 */}
                  <div className="absolute bottom-20 right-10 rounded-2xl bg-slate-800/80 border border-white/10 p-4 shadow-xl backdrop-blur-md animate-float" style={{ animationDelay: '1.5s' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xl shadow-inner">✨</div>
                      <div>
                        <div className="font-bold text-white text-sm">+5 Points Earned!</div>
                        <div className="text-xs font-semibold text-slate-400">Successful exchange</div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3 */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 rounded-2xl bg-slate-800/80 border border-white/10 p-4 shadow-xl backdrop-blur-md animate-float" style={{ animationDelay: '3s' }}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xl shadow-inner">🤝</div>
                      <div>
                        <div className="font-bold text-white text-sm">Looking for The Poet</div>
                        <div className="text-xs font-bold text-emerald-400">Match found!</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content Area ── */}
      <div className="mx-auto max-w-6xl px-4 py-20 space-y-20 relative">
        <div className="absolute top-1/4 right-0 w-[800px] h-[800px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

        {error && <div className="rounded-2xl bg-red-500/10 p-5 text-sm font-bold text-red-400 border border-red-500/20 shadow-lg backdrop-blur-sm z-10 relative">{error}</div>}

        {/* ── Book Shares Section ── */}
        <section className="relative z-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Recent Book Shares</h2>
              <p className="mt-2 text-sm font-medium text-slate-400 max-w-lg">Discover fresh books available to borrow from your community neighbors.</p>
            </div>
            <Link to="/share" className="text-sm font-bold text-primary-400 hover:text-primary-300 hidden sm:flex items-center gap-1 transition-colors">
              Show more shares <span className="text-lg leading-none">&rarr;</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-white/5 bg-white/5 h-80 animate-pulse"></div>
              ))}
            </div>
          ) : data.shares.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center font-medium text-slate-400 backdrop-blur-sm">
              No recent shares found. Be the first to share a book!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.shares.map((b) => (
                <div key={b.id} className="group flex flex-col rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl hover:shadow-primary-500/10 overflow-hidden">
                  {b.imageUrls?.[0] ? (
                    <div className="h-60 bg-slate-800 relative overflow-hidden">
                      <img src={b.imageUrls[0]} alt={b.bookName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute top-4 right-4 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md">
                        ⏱️ {b.borrowDuration} days
                      </div>
                    </div>
                  ) : (
                    <div className="h-60 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative overflow-hidden border-b border-white/5">
                      <span className="text-7xl opacity-20 group-hover:scale-125 transition-transform duration-700">📖</span>
                      <div className="absolute top-4 right-4 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg backdrop-blur-md">
                        ⏱️ {b.borrowDuration} days
                      </div>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <h3 className="font-extrabold text-xl text-white leading-snug line-clamp-2">{b.bookName}</h3>
                      <span className={`shrink-0 inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${CONDITION_COLORS[b.condition] || 'bg-white/10 text-slate-300 border border-white/20'}`}>
                        {b.condition}
                      </span>
                    </div>

                    <div className="flex items-center text-xs font-semibold text-slate-400 gap-3 mb-6 bg-slate-800/50 p-2.5 rounded-xl border border-white/5">
                      <span className="inline-flex items-center gap-1.5"><span className="opacity-70 text-sm">📁</span> {b.category}</span>
                      <span className="opacity-30">|</span>
                      <span className="inline-flex items-center gap-1.5 truncate"><span className="opacity-70 text-sm">📍</span> {b.location}</span>
                    </div>

                    <div className="mt-auto pt-5 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                          {b.ownerName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-bold text-slate-300">{b.ownerName}</span>
                      </div>

                      <Link
                        to="/share"
                        className="text-primary-400 hover:text-primary-300 text-sm font-black opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all flex items-center gap-1"
                      >
                        Details <span className="text-lg leading-none">&rarr;</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link to="/share" className="block w-full text-center rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              Show more shares
            </Link>
          </div>
        </section>

        {/* ── Book Exchanges Section ── */}
        <section className="relative z-10">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-extrabold text-white">Recent Book Exchanges</h2>
              <p className="mt-2 text-sm font-medium text-slate-400 max-w-lg">Trade your books permanently for titles you've been wanting to read.</p>
            </div>
            <Link to="/exchange" className="text-sm font-bold text-violet-400 hover:text-violet-300 hidden sm:flex items-center gap-1 transition-colors">
              Show more exchanges <span className="text-lg leading-none">&rarr;</span>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-3xl border border-white/5 bg-white/5 h-80 animate-pulse"></div>
              ))}
            </div>
          ) : data.exchanges.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center font-medium text-slate-400 backdrop-blur-sm">
              No recent exchanges found. Post the first offer!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.exchanges.map((o) => (
                <div key={o.id} className="group flex flex-col rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl transition-all duration-300 hover:-translate-y-2 hover:bg-white/10 hover:shadow-2xl hover:shadow-violet-500/10 overflow-hidden">
                  {o.imageUrls?.[0] ? (
                    <div className="h-60 bg-slate-800 relative overflow-hidden">
                      <img src={o.imageUrls[0]} alt={o.bookName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    </div>
                  ) : (
                    <div className="h-60 bg-gradient-to-br from-slate-800 to-slate-900 border-b border-white/5 flex items-center justify-center relative overflow-hidden">
                      <span className="text-7xl opacity-20 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700">🔄</span>
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="text-[10px] font-black tracking-widest text-primary-400 uppercase mb-1 drop-shadow-sm">Offering</div>
                        <h3 className="font-extrabold text-xl text-white leading-snug line-clamp-1 group-hover:text-primary-300 transition-colors">{o.bookName}</h3>
                      </div>
                      <span className={`shrink-0 inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${CONDITION_COLORS[o.condition] || 'bg-white/10 text-slate-300 border border-white/20'}`}>
                        {o.condition}
                      </span>
                    </div>

                    {o.wantedBook && (
                      <div className="rounded-xl bg-slate-800/80 border border-white/10 p-3.5 mt-2 shadow-inner">
                        <div className="text-[10px] font-black tracking-widest text-violet-400 uppercase mb-1 drop-shadow-sm">Looking For</div>
                        <div className="font-bold text-slate-200 line-clamp-1">{o.wantedBook}</div>
                      </div>
                    )}

                    <div className="flex items-center text-xs font-semibold text-slate-400 gap-3 mt-5 mb-6 opacity-80">
                      <span className="inline-flex items-center gap-1.5"><span className="opacity-70 text-sm">📁</span> {o.category}</span>
                      <span>|</span>
                      <span className="inline-flex items-center gap-1.5 truncate"><span className="opacity-70 text-sm">📍</span> {o.location}</span>
                    </div>

                    <Link
                      to="/exchange"
                      className="mt-auto block w-full text-center rounded-xl bg-white/10 border border-white/10 py-3.5 text-sm font-bold text-white hover:bg-gradient-to-r hover:from-violet-600 hover:to-indigo-600 hover:border-transparent hover:shadow-lg transition-all duration-300 active:scale-95"
                    >
                      Offer an Exchange
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link to="/exchange" className="block w-full text-center rounded-2xl border border-white/10 bg-white/5 py-4 text-sm font-bold text-white hover:bg-white/10 transition-colors">
              Show more exchanges
            </Link>
          </div>
        </section>
      </div>

      {/* ── Feedback / Testimonials Section ── */}
      <section className="relative mx-auto max-w-6xl px-4 py-24 z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-bold border border-amber-500/20 uppercase tracking-widest mb-6">
            ⭐ Community Voices
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md">What Our Readers Say</h2>
          <p className="mt-4 text-slate-400 font-medium text-lg max-w-xl mx-auto">Real stories from book lovers who have shared, borrowed, and exchanged through our platform.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Rubi Akter', role: 'Avid Reader', avatar: 'A', color: 'from-violet-500 to-purple-600', stars: 5, text: 'This platform is a game-changer! I have exchanged over 20 books without spending a dime. The community is warm and the process is seamless.' },
            { name: 'Md Mobin', role: 'Book Collector', avatar: 'R', color: 'from-sky-500 to-blue-600', stars: 5, text: 'Found rare titles I had been looking for months. The point system keeps me motivated to share more books with others.' },
            { name: 'Md Shawon Ahmed', role: 'Student', avatar: 'N', color: 'from-emerald-500 to-teal-600', stars: 5, text: 'As a student on a budget, this has been invaluable. I share my old textbooks and borrow novels I always wanted to read.' },
            { name: 'Farjana Ahmed', role: 'Teacher', avatar: 'T', color: 'from-rose-500 to-pink-600', stars: 4, text: 'I recommend this to all my students. It promotes a culture of reading and sharing that is beautiful to be part of.' },
            { name: 'Afsana khan', role: 'Homemaker', avatar: 'S', color: 'from-amber-500 to-orange-600', stars: 5, text: 'Such a heartwarming community. The approval process ensures everyone is trustworthy. I feel safe sharing my books.' },
            { name: 'Hasibul Islam Nipo', role: 'Software Engineer', avatar: 'K', color: 'from-indigo-500 to-violet-600', stars: 5, text: 'Clean UI, fast process, great community. I love how the exchange system matches you with people nearby. Highly recommended!' },
          ].map((t) => (
            <div key={t.name} className="group flex flex-col gap-5 rounded-3xl bg-white/[0.03] backdrop-blur-md border border-white/10 p-7 shadow-xl hover:bg-white/[0.05] hover:border-white/20 hover:-translate-y-2 transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-1 drop-shadow-sm">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-lg ${i < t.stars ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                ))}
              </div>
              {/* Review text */}
              <p className="text-sm font-medium text-slate-300 leading-relaxed flex-1 italic">"{t.text}"</p>
              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white font-extrabold text-lg shadow-inner`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-white text-base drop-shadow-sm">{t.name}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative mt-8 bg-slate-950 border-t border-white/5 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/5 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>
        <div className="mx-auto max-w-6xl px-4 py-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center shadow-lg border border-white/10">
                  <span className="text-white text-xl drop-shadow-sm">📚</span>
                </div>
                <span className="text-2xl font-extrabold text-white tracking-tight">Bookish</span>
              </div>
              <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm">
                A community driven platform to share, borrow and exchange books. Building a culture of reading, one book at a time.
              </p>
              {/* Social links */}
              <div className="flex gap-3 mt-8">
                {[
                  { icon: '𝕏', label: 'Twitter' },
                  { icon: 'in', label: 'LinkedIn' },
                  { icon: 'f', label: 'Facebook' },
                ].map((s) => (
                  <button key={s.label} title={s.label} className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-base font-bold text-slate-300 hover:bg-primary-500 hover:text-white hover:border-primary-400 hover:shadow-lg transition-all active:scale-95">
                    {s.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation column */}
            <div>
              <h4 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest">Platform</h4>
              <ul className="space-y-4">
                {[
                  { label: 'Home', href: '/' },
                  { label: 'Browse Books', href: '/share' },
                  { label: 'Exchange Books', href: '/exchange' },
                  { label: 'Dashboard', href: '/dashboard' },
                  { label: 'Top Readers', href: '/rating' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm font-semibold text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account column */}
            <div>
              <h4 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-widest">Account</h4>
              <ul className="space-y-4">
                {[
                  { label: 'Sign In', href: '/login' },
                  { label: 'Create Account', href: '/signup' },
                ].map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm font-semibold text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <h4 className="text-xs font-black text-slate-500 mb-5 mt-10 uppercase tracking-widest">Contact</h4>
              <ul className="space-y-4">
                <li className="text-sm font-medium text-slate-400 flex items-center gap-3"><span className="opacity-80">📧</span> support@bookshare.com</li>
                <li className="text-sm font-medium text-slate-400 flex items-center gap-3"><span className="opacity-80">📍</span> Dhaka, Bangladesh</li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs font-medium text-slate-500">
              © {new Date().getFullYear()} Bookish. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((t) => (
                <span key={t} className="text-xs font-semibold text-slate-500 hover:text-slate-300 cursor-pointer transition-colors">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
