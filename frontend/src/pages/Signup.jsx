import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    lat: '',
    lng: '',
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files]
  );

  const onPickFiles = (picked) => {
    const arr = Array.from(picked || []);
    const images = arr.filter((f) => f.type.startsWith('image/'));
    setFiles((prev) => [...prev, ...images].slice(0, 6));
  };

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const useMyLocation = () => {
    setError('');
    if (!navigator.geolocation) {
      setError('Geolocation not supported in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          lat: String(pos.coords.latitude),
          lng: String(pos.coords.longitude),
        }));
      },
      () => setError('Could not get location. Please enter lat/lng manually.')
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (files.length < 1) {
      setError('Please upload at least one profile image.');
      return;
    }
    const latNum = Number(form.lat);
    const lngNum = Number(form.lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      setError('Please provide valid lat/lng.');
      return;
    }

    setSubmitting(true);
    try {
      // 1) Convert files -> base64 data URLs
      const images = await Promise.all(files.map(async (f) => ({ base64: await fileToDataUrl(f), name: f.name })));

      // 2) Upload to backend (backend uploads to imgbb with IMGBB_API_KEY)
      const uploadResp = await api('/api/uploads/imgbb', { method: 'POST', body: { images } });
      const imageUrls = (uploadResp.images || []).map((i) => i.url).filter(Boolean);
      if (imageUrls.length < 1) throw new Error('Image upload failed.');

      // 3) Signup with returned URLs
      await api('/api/auth/signup', {
        method: 'POST',
        body: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          lat: latNum,
          lng: lngNum,
          imageUrls,
        },
      });

      setSuccess('Signup successful! Your account is pending admin approval.');
      setTimeout(() => nav('/login'), 900);
    } catch (err) {
      setError(err?.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white/10 transition-all font-medium";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-900 flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[600px] h-[600px] bg-primary-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none opacity-80"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[120px] mix-blend-screen pointer-events-none opacity-80"></div>

      <div className="w-full max-w-3xl z-10">
        <div className="rounded-[2.5rem] bg-white/5 backdrop-blur-2xl p-8 md:p-12 shadow-2xl border border-white/10">
          <div className="mb-10 text-center max-w-lg mx-auto">
            <h1 className="text-4xl font-extrabold text-white tracking-tight drop-shadow-sm">Create an account</h1>
            <p className="mt-3 text-sm font-medium text-slate-400">
              Join the community! Your account will be <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">pending</span> until an admin approves it.
            </p>
          </div>

          {error ? (
            <div className="mb-8 rounded-2xl bg-red-500/10 p-4 border border-red-500/20 flex gap-4 text-red-400 shadow-inner">
              <span className="text-2xl leading-none">⚠️</span>
              <p className="text-sm font-bold flex items-center">{error}</p>
            </div>
          ) : null}
          {success ? (
            <div className="mb-8 rounded-2xl bg-emerald-500/10 p-4 border border-emerald-500/20 flex gap-4 text-emerald-400 shadow-inner">
              <span className="text-2xl leading-none">✅</span>
              <p className="text-sm font-bold flex items-center">{success}</p>
            </div>
          ) : null}

          <form onSubmit={submit} className="grid grid-cols-1 gap-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <label className="grid gap-2 focus-within:text-primary-400 transition-colors">
                <span className="text-sm font-bold text-slate-300 inherit ml-1">Full Name</span>
                <input
                  className={inputClass}
                  value={form.name}
                  placeholder="e.g. Sayem Dewan"
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-2 focus-within:text-primary-400 transition-colors">
                <span className="text-sm font-bold text-slate-300 inherit ml-1">Email Address</span>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-2 focus-within:text-primary-400 transition-colors">
                <span className="text-sm font-bold text-slate-300 inherit ml-1">Phone Number</span>
                <input
                  className={inputClass}
                  value={form.phone}
                  placeholder="01xxxxxxxxx"
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  required
                />
              </label>
              <label className="grid gap-2 focus-within:text-primary-400 transition-colors">
                <span className="text-sm font-bold text-slate-300 inherit ml-1">Password</span>
                <input
                  className={`${inputClass} tracking-wider`}
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="border border-white/10 rounded-3xl p-6 md:p-8 bg-slate-800/50 shadow-inner">
              <h3 className="text-sm font-extrabold text-white mb-5 flex items-center gap-2 uppercase tracking-widest">
                 📍 Location Info
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <label className="grid gap-2 sm:col-span-4 focus-within:text-primary-400 transition-colors">
                  <span className="text-xs font-bold text-slate-400 inherit ml-1">Latitude</span>
                  <input
                    className={inputClass}
                    value={form.lat}
                    onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
                    placeholder="e.g. 23.8103"
                    required
                  />
                </label>
                <label className="grid gap-2 sm:col-span-4 focus-within:text-primary-400 transition-colors">
                  <span className="text-xs font-bold text-slate-400 inherit ml-1">Longitude</span>
                  <input
                    className={inputClass}
                    value={form.lng}
                    onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
                    placeholder="e.g. 90.4125"
                    required
                  />
                </label>
                <button
                  type="button"
                  onClick={useMyLocation}
                  className="sm:col-span-4 rounded-2xl border border-primary-500/30 bg-primary-500/10 px-4 py-3 text-sm font-bold text-primary-400 hover:bg-primary-500/20 hover:border-primary-500/50 transition-colors h-[50px] flex items-center justify-center gap-2"
                >
                  📡 Auto Detect
                </button>
              </div>
            </div>

            <div className="grid gap-3 border border-white/10 rounded-3xl p-6 md:p-8 bg-slate-800/50 shadow-inner">
              <span className="text-sm font-extrabold text-white flex items-center gap-2 uppercase tracking-widest mb-2">
                 📸 Profile Images (Max 6)
              </span>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  onPickFiles(e.dataTransfer.files);
                }}
                className="rounded-2xl border-2 border-dashed border-white/20 hover:border-primary-500/50 p-10 text-center text-sm text-slate-400 bg-white/[0.02] hover:bg-white/[0.04] transition-all flex items-center justify-center cursor-pointer group"
                onClick={() => document.getElementById('fileUpload').click()}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/10 group-hover:bg-primary-500/20 flex items-center justify-center shadow-inner transition-colors border border-white/5">
                    <span className="text-2xl drop-shadow-sm">☁️</span>
                  </div>
                  <div className="font-bold text-slate-300 group-hover:text-primary-300 transition-colors">Click or drop images here</div>
                  <div className="text-xs font-medium text-slate-500">Supported formats: JPG, PNG...</div>
                  <input
                    id="fileUpload"
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                </div>
              </div>

              {previews.length ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-5">
                  {previews.map((p) => (
                    <div key={p.name} className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-lg bg-slate-900">
                      <img src={p.url} alt={p.name} className="h-32 w-full object-cover group-hover:scale-110 group-hover:opacity-50 transition-all duration-500" />
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm bg-black/40">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(p.name); }}
                          className="rounded-xl bg-red-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:bg-red-600 hover:scale-105 transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <button
              disabled={submitting}
              className="mt-4 rounded-2xl bg-gradient-to-r from-primary-500 to-violet-500 px-4 py-4 md:py-5 text-base font-extrabold text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Complete Signup'}
            </button>
          </form>

          <div className="mt-10 pt-8 gap-3 border-t border-white/5 flex flex-col sm:flex-row items-center justify-center text-sm font-medium text-slate-400">
            Already have an account?
            <Link to="/login" className="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-5 py-2 text-white font-bold hover:bg-white/10 transition-colors shadow-sm cursor-pointer z-20">
              Sign In Instead &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
