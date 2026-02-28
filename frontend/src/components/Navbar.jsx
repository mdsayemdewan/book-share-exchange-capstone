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
      nav('/exchange');
    }
    setOpen(false);
  };

  return (
    <div className="w-full border-b bg-white">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="font-semibold text-gray-900">
          Book Distribution
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <button
            onClick={() => nav('/rating')}
            className="hidden md:inline-block text-gray-700 hover:text-gray-900 font-medium"
          >
            Rating
          </button>
          {auth?.token ? (
            <>
              <button
                onClick={() => nav('/dashboard')}
                className="hidden md:inline-block text-gray-700 hover:text-gray-900"
              >
                Dashboard
              </button>
              <button
                onClick={() => nav('/share')}
                className="hidden md:inline-block text-gray-700 hover:text-gray-900"
              >
                Share Books
              </button>
              <button
                onClick={() => nav('/exchange')}
                className="hidden md:inline-block text-gray-700 hover:text-gray-900"
              >
                Exchange
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpen((v) => !v)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-full border bg-white hover:bg-gray-50"
                >
                  <span className="text-lg leading-none">🔔</span>
                  {unread > 0 && (
                    <span className="absolute -right-1 -top-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                      {unread}
                    </span>
                  )}
                </button>
                {open && (
                  <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border bg-white shadow-lg">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <span className="text-xs font-medium text-gray-700">Notifications</span>
                      <button
                        onClick={loadNotifications}
                        className="text-[11px] text-gray-500 hover:text-gray-700"
                      >
                        Refresh
                      </button>
                    </div>
                    <div className="max-h-80 overflow-auto text-xs">
                      {notifications.length === 0 ? (
                        <div className="px-3 py-3 text-gray-500">No notifications yet.</div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n._id}
                            type="button"
                            onClick={() => onNotificationClick(n)}
                            className={`block w-full px-3 py-2 text-left hover:bg-gray-50 ${n.isRead ? 'text-gray-600' : 'bg-gray-50 text-gray-900'
                              }`}
                          >
                            <div className="line-clamp-2">{n.message}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className="hidden sm:inline text-gray-600">
                Hi, {auth?.user?.name || 'User'}
                {points !== null && (
                  <span className="ml-2 font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">
                    ⭐ {points} pts
                  </span>
                )}
              </span>
              <button
                onClick={logout}
                className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-gray-900">
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-gray-900 px-3 py-1.5 text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
