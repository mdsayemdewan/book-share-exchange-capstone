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

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm border">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-600">
            After signup, your account stays <span className="font-medium">pending</span> until an admin approves it.
          </p>
        </div>

        {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
        {success ? <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{success}</div> : null}

        <form onSubmit={submit} className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                className="rounded-lg border px-3 py-2"
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Password</span>
              <input
                className="rounded-lg border px-3 py-2"
                type="password"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Latitude</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={form.lat}
                onChange={(e) => setForm((p) => ({ ...p, lat: e.target.value }))}
                placeholder="e.g. 23.8103"
                required
              />
            </label>
            <label className="grid gap-1">
              <span className="text-sm font-medium text-gray-700">Longitude</span>
              <input
                className="rounded-lg border px-3 py-2"
                value={form.lng}
                onChange={(e) => setForm((p) => ({ ...p, lng: e.target.value }))}
                placeholder="e.g. 90.4125"
                required
              />
            </label>
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Use my location
            </button>
          </div>

          <div className="grid gap-2">
            <span className="text-sm font-medium text-gray-700">Profile images (drag & drop, multiple)</span>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onPickFiles(e.dataTransfer.files);
              }}
              className="rounded-xl border-2 border-dashed p-5 text-sm text-gray-600 bg-gray-50"
            >
              <div className="flex flex-col gap-2">
                <div>Drop images here, or</div>
                <label className="inline-flex w-fit cursor-pointer rounded-lg bg-gray-900 px-3 py-2 text-white">
                  Choose files
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={(e) => onPickFiles(e.target.files)}
                  />
                </label>
                <div className="text-xs text-gray-500">Max 6 images.</div>
              </div>
            </div>

            {previews.length ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {previews.map((p) => (
                  <div key={p.name} className="relative overflow-hidden rounded-xl border bg-white">
                    <img src={p.url} alt={p.name} className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(p.name)}
                      className="absolute right-2 top-2 rounded-md bg-white/90 px-2 py-1 text-xs hover:bg-white"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <button
            disabled={submitting}
            className="mt-2 rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Sign up'}
          </button>
        </form>

        <div className="mt-5 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-gray-900 hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
