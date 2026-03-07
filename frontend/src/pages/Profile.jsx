import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { getAuth, setAuth } from '../lib/auth';

/* ──────────────────────────────────────────────
   Helpers
────────────────────────────────────────────── */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const STATUS_BADGE = {
  approved: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  rejected: 'bg-red-500/20 text-red-300 border-red-500/30',
};

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
export default function Profile() {
  const nav = useNavigate();
  const auth = getAuth();
  const fileRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // edit form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [newImageB64, setNewImageB64] = useState(null); // base64 string or null

  /* load profile */
  useEffect(() => {
    if (!auth?.token) { nav('/login'); return; }
    (async () => {
      try {
        const data = await api('/api/auth/me');
        setProfile(data.user);
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* open edit mode — pre-fill fields */
  const startEdit = () => {
    setName(profile.name || '');
    setPhone(profile.phone || '');
    setPreviewUrl(profile.imageUrls?.[0] || '');
    setNewImageB64(null);
    setError('');
    setSuccess('');
    setEditMode(true);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setError('');
    setSuccess('');
  };

  /* handle photo pick */
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5 MB.');
      return;
    }
    const b64 = await fileToBase64(file);
    setNewImageB64(b64);
    setPreviewUrl(b64);
    setError('');
  };

  /* upload base64 image to server's upload endpoint */
  const uploadImage = async (b64) => {
    const res = await api('/api/uploads/imgbb', {
      method: 'POST',
      body: { images: [{ base64: b64, name: 'profile' }] },
    });
    return res.images?.[0]?.url || b64;
  };

  /* save changes */
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!name.trim()) { setError('Name cannot be empty.'); return; }
    if (!phone.trim()) { setError('Phone cannot be empty.'); return; }

    setSaving(true);
    try {
      let imageUrls = profile.imageUrls;

      if (newImageB64) {
        try {
          const url = await uploadImage(newImageB64);
          imageUrls = [url, ...profile.imageUrls.slice(1)];
        } catch {
          // fall back: store base64 directly
          imageUrls = [newImageB64, ...profile.imageUrls.slice(1)];
        }
      }

      const data = await api('/api/auth/me', {
        method: 'PATCH',
        body: { name: name.trim(), phone: phone.trim(), imageUrls },
      });

      setProfile(data.user);

      // update cached auth so navbar name stays current
      const stored = getAuth();
      if (stored) {
        setAuth({ ...stored, user: { ...stored.user, name: data.user.name } });
      }

      setSuccess('Profile updated successfully! ✅');
      setEditMode(false);
    } catch (err) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Render ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 font-medium text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 px-6 py-4 rounded-2xl text-red-400 font-medium">
          {error || 'Profile not found.'}
        </div>
      </div>
    );
  }

  const avatarSrc = profile.imageUrls?.[0] || '';
  const initial = (profile.name || 'U').charAt(0).toUpperCase();

  const inputClass = "w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white/10 transition-all";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 py-12 px-4 relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[500px] h-[500px] bg-primary-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-50"></div>
      <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[500px] h-[500px] bg-violet-500/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen opacity-50"></div>

      <div className="mx-auto max-w-2xl relative z-10">

        {/* ── Header card ── */}
        <div className="relative rounded-[2rem] overflow-hidden shadow-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          {/* Banner */}
          <div className="h-40 bg-gradient-to-r from-primary-600/80 via-violet-600/80 to-indigo-600/80 backdrop-blur-md" />

          {/* Avatar */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={profile.name}
                className="h-32 w-32 rounded-full object-cover border-4 border-slate-900 shadow-xl bg-slate-800"
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-gradient-to-tr from-primary-500 to-violet-500 border-4 border-slate-900 shadow-xl flex items-center justify-center text-white text-5xl font-extrabold">
                {initial}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pt-24 pb-10 px-8 text-center">
            <h1 className="text-3xl font-extrabold text-white">{profile.name}</h1>
            <p className="text-slate-400 font-medium mt-1">{profile.email}</p>

            <div className="flex items-center justify-center gap-3 mt-5 flex-wrap">
              <span className={`text-xs font-bold px-4 py-1.5 rounded-full capitalize border ${STATUS_BADGE[profile.status] || STATUS_BADGE.pending}`}>
                {profile.status}
              </span>
              <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                ⭐ {profile.points ?? 0} pts
              </span>
              <span className="text-xs font-bold px-4 py-1.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 capitalize">
                {profile.role}
              </span>
            </div>

            {!editMode && (
              <button
                onClick={startEdit}
                className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-violet-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all active:scale-95"
              >
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* ── Success banner ── */}
        {success && (
          <div className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 px-6 py-4 text-sm text-emerald-300 font-bold backdrop-blur-sm">
            {success}
          </div>
        )}

        {/* ── View mode: info cards ── */}
        {!editMode && (
          <div className="mt-8 grid gap-5">
            <InfoCard title="Account Details" items={[
              { label: 'Full Name', value: profile.name, icon: '👤' },
              { label: 'Email Address', value: profile.email, icon: '📧' },
              { label: 'Phone Number', value: profile.phone, icon: '📱' },
              { label: 'Member Since', value: formatDate(profile.createdAt), icon: '📅' },
            ]} />
            <InfoCard title="Location" items={[
              { label: 'Latitude', value: profile.location?.lat?.toFixed(6), icon: '🌐' },
              { label: 'Longitude', value: profile.location?.lng?.toFixed(6), icon: '🌐' },
            ]} />
          </div>
        )}

        {/* ── Edit mode form ── */}
        {editMode && (
          <form onSubmit={handleSave} className="mt-8 rounded-[2rem] bg-white/5 border border-white/10 shadow-2xl p-8 sm:p-10 flex flex-col gap-6 backdrop-blur-xl">
            <h2 className="text-2xl font-bold text-white mb-2">Edit Profile</h2>

            {/* Photo */}
            <div className="flex flex-col items-center gap-4 mb-2">
              <div className="relative group">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-28 w-28 rounded-full object-cover border-4 border-white/10 shadow-xl bg-slate-800 transition-transform group-hover:scale-105" />
                ) : (
                  <div className="h-28 w-28 rounded-full bg-gradient-to-tr from-primary-500 to-violet-500 border-4 border-white/10 shadow-xl flex items-center justify-center text-white text-4xl font-extrabold transition-transform group-hover:scale-105">
                    {(name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute bottom-1 right-1 h-9 w-9 rounded-full bg-primary-500 hover:bg-primary-400 text-white text-sm flex items-center justify-center shadow-lg border-2 border-slate-800 transition-all scale-100 hover:scale-110"
                  title="Change photo"
                >
                  📷
                </button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <p className="text-xs text-slate-400 font-medium">Click the camera icon to update (Max 5 MB)</p>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Your name"
                required
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="Your phone number"
                required
              />
            </div>

            {/* Read-only email */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-300 ml-1">Email Address <span className="text-slate-500 font-medium ml-2">(cannot be changed)</span></label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full rounded-2xl border border-transparent bg-white/5 px-4 py-3 text-sm text-slate-500 cursor-not-allowed font-medium opacity-60"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-2xl bg-red-500/20 border border-red-500/30 px-5 py-3.5 text-sm text-red-300 font-medium">⚠️ {error}</div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 mt-2 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-2xl bg-gradient-to-r from-primary-500 to-violet-500 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={saving}
                className="rounded-2xl border border-white/20 bg-transparent px-8 py-3.5 text-sm font-bold text-slate-300 hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

/* ── Info card sub-component ── */
function InfoCard({ title, items }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 shadow-xl backdrop-blur-md px-8 py-7">
      <h3 className="text-xs font-extrabold text-primary-400 uppercase tracking-widest mb-6 ml-1">{title}</h3>
      <div className="divide-y divide-white/10">
        {items.map(({ label, value, icon }) => (
          <div key={label} className="flex items-center justify-between py-4 gap-4 hover:bg-white/5 -mx-4 px-4 rounded-xl transition-colors">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
              <span className="text-lg opacity-80">{icon}</span>
              {label}
            </div>
            <span className="text-sm font-bold text-white text-right break-all">{value || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
