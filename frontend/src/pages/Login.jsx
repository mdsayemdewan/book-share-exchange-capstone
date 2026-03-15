import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { setAuth } from '../lib/auth';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      setAuth({ token: data.token, user: data.user });
      if (data.user.role === 'admin') nav('/admin');
      else nav('/dashboard');
    } catch (err) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none opacity-60"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] mix-blend-screen pointer-events-none opacity-60"></div>

      <div className="w-full max-w-md z-10">
        <div className="rounded-[2.5rem] bg-white/5 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">Welcome Back</h1>
            <p className="mt-2 text-sm text-slate-400 font-medium">Please enter your credentials to log in.</p>
          </div>

          {error ? (
            <div className="mb-6 rounded-2xl bg-red-500/10 p-4 border border-red-500/20 flex gap-3 text-red-400 shadow-inner">
              <span className="text-xl leading-none">⚠️</span>
              <p className="text-sm font-bold flex items-center">{error}</p>
            </div>
          ) : null}

          <form onSubmit={submit} className="grid gap-6">
            <label className="grid gap-2 focus-within:text-primary-400 transition-colors">
              <span className="text-sm font-bold text-slate-300 inherit ml-1">Email Address</span>
              <input
                className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 focus:border-primary-500 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all font-medium"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 focus-within:text-primary-400 transition-colors">
              <div className="flex items-center justify-between ml-1">
                <span className="text-sm font-bold text-slate-300 inherit">Password</span>
                <span className="text-[11px] font-bold text-slate-500 cursor-not-allowed select-none uppercase tracking-widest">Forgot password?</span>
              </div>
              <input
                className="rounded-2xl border border-white/20 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 focus:border-primary-500 focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all font-medium tracking-widest"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            <button
              disabled={loading}
              className="mt-4 rounded-2xl bg-gradient-to-r from-primary-500 to-violet-500 px-4 py-4 text-sm font-extrabold text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm font-medium text-slate-400">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-primary-400 hover:text-primary-300 hover:underline transition-colors ml-1">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
