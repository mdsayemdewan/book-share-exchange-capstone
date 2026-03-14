import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearAuth, getAuth } from '../lib/auth';
import { api } from '../lib/api';

export default function Navbar() {
  const nav = useNavigate();
  const auth = getAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [points, setPoints] = useState(null);

  const logout = () => {
    clearAuth();
    nav('/login');
  };

  const loadNotifications = async () => {
    if (!auth?.token) return;
    try {
      const data = await api('/api/notifications');
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);

      const me = await api('/api/auth/me');
      setPoints(me.user?.points || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const id = setInterval(loadNotifications, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNotificationClick = (n) => {
    if (n.isRead === false) {
      api(`/api/notifications/${n._id}/read`, { method: 'PATCH' }).catch(() => { });
      setNotifications((prev) =>
        prev.map((x) => (x._id === n._id ? { ...x, isRead: true } : x))
      );
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.data?.shareBookId || n.data?.borrowRequestId) {
      nav('/dashboard');
    } else if (n.data?.requestId) {
      if (n.type === 'exchange_request') {
        nav('/dashboard', { state: { section: 'exchange', exTab: 'offers' } });
      } else {
        nav('/exchange');
      }
    }
    setOpen(false);
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-slate-900/80 backdrop-blur-xl border-b border-white/10 transition-all duration-300 shadow-xl">
      <div className="mx-auto max-w-6xl px-4 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-xl font-extrabold tracking-tight text-white hover:text-primary-400 transition flex items-center gap-2 group"
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-primary-500 to-violet-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <span className="text-white text-base drop-shadow-sm">📚</span>
          </div>
          Bookish
        </Link>

        {/* Desktop nav */}
        <div className="flex items-center gap-1.5 sm:gap-4 text-sm font-semibold">
          <button
            onClick={() => nav('/rating')}
            className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
          >
            Leaderboard
          </button>

          {auth?.token ? (
            <>
              {auth?.user?.role === 'admin' ? (
                <button
                  onClick={() => nav('/admin')}
                  className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
                >
                  Admin Panel
                </button>
              ) : (
                <>
                  <button
                    onClick={() => nav('/dashboard')}
                    className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => nav('/share')}
                    className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
                  >
                    Share Books
                  </button>
                  <button
                    onClick={() => nav('/exchange')}
                    className="hidden md:flex items-center gap-1.5 text-slate-300 hover:text-white hover:bg-white/10 px-4 py-2 rounded-xl transition-all"
                  >
                    Exchange
                  </button>
                </>
              )}

              <div className="h-6 w-px bg-white/10 hidden md:block mx-1" />

              {/* Bell (notifications) */}
              <div className="relative flex items-center">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:shadow-lg hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  <span className="text-xl leading-none opacity-80">🔔</span>
                  {unread > 0 && (
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[11px] font-black text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] border-2 border-slate-900 animate-pulse">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {open && (
                  <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-white/10 bg-slate-800/95 backdrop-blur-2xl shadow-2xl transform transition-all origin-top-right overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                      <span className="text-sm font-extrabold text-white">Notifications</span>
                      <button
                        onClick={loadNotifications}
                        className="text-xs font-bold text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 px-3 py-1.5 rounded-lg transition-colors border border-primary-500/20"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto overscroll-contain">
                      {notifications.length === 0 ? (
                        <div className="px-5 py-10 text-center text-sm text-slate-400 flex flex-col items-center gap-3">
                          <span className="text-4xl opacity-50 drop-shadow-sm">📭</span>
                          No notifications yet.
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5">
                          {notifications.map((n) => (
                            <button
                              key={n._id}
                              type="button"
                              onClick={() => onNotificationClick(n)}
                              className={`flex w-full flex-col items-start px-5 py-4 text-left transition-colors hover:bg-white/5 ${n.isRead ? 'opacity-60' : 'bg-primary-500/5'}`}
                            >
                              <div className="flex w-full items-start justify-between gap-3">
                                <span className={`text-sm ${n.isRead ? 'text-slate-300' : 'text-white font-bold'} leading-relaxed`}>
                                  {n.message}
                                </span>
                                {!n.isRead && (
                                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User info (desktop) — clickable → /profile */}
              <button
                type="button"
                onClick={() => nav('/profile')}
                className="hidden sm:flex items-center gap-3 pl-2 hover:opacity-80 transition-opacity group"
                title="View Profile"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-white group-hover:text-primary-300 transition-colors">
                    {auth?.user?.name || 'User'}
                  </span>
                  {points !== null && (
                    <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 flex items-center gap-1 drop-shadow-sm">
                      <span className="text-amber-400">⭐</span> {points} pts
                    </span>
                  )}
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary-600 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-inner border border-white/10">
                  {(auth?.user?.name || 'U').charAt(0).toUpperCase()}
                </div>
              </button>

              <button
                onClick={logout}
                className="hidden md:inline-flex ml-2 rounded-xl bg-white/5 border border-white/10 px-5 py-2.5 text-sm font-bold text-red-400 hover:text-white hover:bg-red-500 hover:border-red-500 hover:shadow-lg transition-all active:scale-95"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Sign in
              </Link>
              <Link
                to="/signup"
                className="rounded-xl bg-gradient-to-r from-primary-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5 active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* ── Mobile hamburger (visible below md) ── */}
          <MobileMenu auth={auth} nav={nav} logout={logout} points={points} />
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   Mobile hamburger menu component
───────────────────────────────────────────────────── */
function MobileMenu({ auth, nav, logout, points }) {
  const [open, setOpen] = useState(false);

  const go = (path) => {
    setOpen(false);
    nav(path);
  };

  return (
    <div className="md:hidden relative">
      {/* Hamburger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open menu"
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/50"
      >
        {/* Animated 3-bar icon */}
        <span className="flex flex-col gap-[5px] w-5">
          <span
            style={{ transition: 'transform 0.25s, opacity 0.25s' }}
            className={`block h-0.5 w-full bg-white rounded-full ${open ? 'rotate-45 translate-y-[7px]' : ''}`}
          />
          <span
            style={{ transition: 'opacity 0.25s' }}
            className={`block h-0.5 w-full bg-white rounded-full ${open ? 'opacity-0' : ''}`}
          />
          <span
            style={{ transition: 'transform 0.25s, opacity 0.25s' }}
            className={`block h-0.5 w-full bg-white rounded-full ${open ? '-rotate-45 -translate-y-[7px]' : ''}`}
          />
        </span>
      </button>

      {/* Dropdown menu */}
      {open && (
        <div className="absolute right-0 top-14 z-50 w-72 rounded-2xl border border-white/10 bg-slate-800/95 backdrop-blur-2xl shadow-2xl p-3 flex flex-col gap-1.5 origin-top-right overflow-hidden">
          {/* User card */}
          {auth?.token && (
            <div className="flex items-center gap-4 px-4 py-3 mb-2 rounded-xl bg-gradient-to-r from-primary-500/10 to-violet-500/10 border border-white/5 shadow-inner">
              <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-tr from-primary-500 to-violet-500 flex items-center justify-center text-white font-extrabold shadow-sm">
                {(auth?.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-extrabold text-white drop-shadow-sm">
                  {auth?.user?.name || 'User'}
                </span>
                {points !== null && (
                  <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                    ⭐ {points} pts
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rating — visible for everyone */}
          <MobileNavItem label="Leaderboard" onClick={() => go('/rating')} />

          {auth?.token ? (
            <>
              {auth?.user?.role === 'admin' ? (
                <MobileNavItem label="Admin Panel" onClick={() => go('/admin')} />
              ) : (
                <>
                  <MobileNavItem label="Dashboard" onClick={() => go('/dashboard')} />
                  <MobileNavItem label="My Profile" onClick={() => go('/profile')} />
                  <MobileNavItem label="Share Books" onClick={() => go('/share')} />
                  <MobileNavItem label="Exchange" onClick={() => go('/exchange')} />
                </>
              )}
              <div className="my-1.5 border-t border-white/10 mx-2" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:text-white hover:bg-red-500/20 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <div className="my-1.5 border-t border-white/10 mx-2" />
              <MobileNavItem label="Sign In" onClick={() => go('/login')} />
              <MobileNavItem
                label="Get Started"
                onClick={() => go('/signup')}
                highlight
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MobileNavItem({ emoji, label, onClick, highlight }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${highlight
        ? 'bg-gradient-to-r from-primary-500 to-violet-500 text-white shadow-lg shadow-primary-500/20 active:scale-95'
        : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
    >
      <span className={highlight ? 'drop-shadow-sm' : 'opacity-80'}>{emoji}</span>
      {label}
    </button>
  );
}
