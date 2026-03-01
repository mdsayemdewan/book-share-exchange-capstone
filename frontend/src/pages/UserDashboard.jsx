import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const CONDITION_COLORS = { new: 'bg-emerald-100 text-emerald-800', good: 'bg-sky-100 text-sky-800', used: 'bg-amber-100 text-amber-800' };
const CATEGORIES = ['Fiction', 'Non-fiction', 'Academic', 'Science', 'History', 'Self-help', 'Children', 'Other'];
const DURATION_OPTIONS = [7, 14, 21, 30, 60];

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function daysLeft(dueDate) {
  if (!dueDate) return null;
  const diff = new Date(dueDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function UserDashboard() {
  const [section, setSection] = useState('share');

  // ── Share state ──────────────────────────────────────────────────
  const [myShareBooks, setMyShareBooks] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [activeBorrows, setActiveBorrows] = useState([]);
  const [selectedShareBook, setSelectedShareBook] = useState(null);
  const [shareBookRequests, setShareBookRequests] = useState([]);
  const [shareTab, setShareTab] = useState('create');

  // Create share form
  const [sBookName, setSBookName] = useState('');
  const [sCondition, setSCondition] = useState('good');
  const [sCategory, setSCategory] = useState('');
  const [sLocation, setSLocation] = useState('');
  const [sLat, setSLat] = useState('');
  const [sLng, setSLng] = useState('');
  const [sDuration, setSDuration] = useState(14);
  const [sFiles, setSFiles] = useState([]);
  const [sCreating, setSCreating] = useState(false);

  // Edit share
  const [editingShare, setEditingShare] = useState(null);
  const [esBookName, setEsBookName] = useState('');
  const [esCondition, setEsCondition] = useState('good');
  const [esCategory, setEsCategory] = useState('');
  const [esLocation, setEsLocation] = useState('');
  const [esDuration, setEsDuration] = useState(14);
  const [esSaving, setEsSaving] = useState(false);

  // Report modal
  const [reportingBorrow, setReportingBorrow] = useState(null);
  const [reportReason, setReportReason] = useState('');

  // ── Exchange state ───────────────────────────────────────────────
  const [myOffers, setMyOffers] = useState([]);
  const [myExRequests, setMyExRequests] = useState([]);
  const [myExchanges, setMyExchanges] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerRequests, setOfferRequests] = useState([]);
  const [exTab, setExTab] = useState('create');

  // Create exchange offer form
  const [bookName, setBookName] = useState('');
  const [condition, setCondition] = useState('good');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [wantedBook, setWantedBook] = useState('');
  const [files, setFiles] = useState([]);
  const [creating, setCreating] = useState(false);

  // Edit exchange offer
  const [editingOffer, setEditingOffer] = useState(null);
  const [editBookName, setEditBookName] = useState('');
  const [editCondition, setEditCondition] = useState('good');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWantedBook, setEditWantedBook] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // ── File helpers ─────────────────────────────────────────────────
  const previews = useMemo(() => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [files]);
  const sPreviews = useMemo(() => sFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [sFiles]);

  const pickFiles = (setter) => (picked) => {
    const arr = Array.from(picked || []);
    setter((prev) => [...prev, ...arr.filter((f) => f.type.startsWith('image/'))].slice(0, 6));
  };

  const useGeo = (latSetter, lngSetter) => () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { latSetter(String(pos.coords.latitude)); lngSetter(String(pos.coords.longitude)); },
      () => setError('Could not get location')
    );
  };

  // ── Load everything ──────────────────────────────────────────────
  const load = async () => {
    setError('');
    setLoading(true);
    try {
      const [sBooks, borrows, active, offers, exReqs, exchanges] = await Promise.all([
        api('/api/share/my/books'),
        api('/api/share/my/borrows'),
        api('/api/share/my/active'),
        api('/api/exchange/my/offers'),
        api('/api/exchange/my/requests'),
        api('/api/exchange/my/exchanges'),
      ]);
      setMyShareBooks(sBooks.books || []);
      setMyBorrows(borrows.requests || []);
      setActiveBorrows(active.active || []);
      setMyOffers(offers.offers || []);
      setMyExRequests(exReqs.requests || []);
      setMyExchanges(exchanges.exchanges || []);
    } catch (err) {
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Share actions ────────────────────────────────────────────────
  const createShareBook = async (e) => {
    e.preventDefault(); setError(''); setSCreating(true);
    try {
      let imageUrls = [];
      if (sFiles.length > 0) {
        const images = await Promise.all(sFiles.map(async (f) => ({ base64: await fileToDataUrl(f), name: f.name })));
        const r = await api('/api/uploads/imgbb', { method: 'POST', body: { images } });
        imageUrls = (r.images || []).map((i) => i.url).filter(Boolean);
      }
      const latN = sLat ? Number(sLat) : undefined;
      const lngN = sLng ? Number(sLng) : undefined;
      await api('/api/share/books', {
        method: 'POST',
        body: { bookName: sBookName, condition: sCondition, category: sCategory, location: sLocation, lat: Number.isFinite(latN) ? latN : undefined, lng: Number.isFinite(lngN) ? lngN : undefined, imageUrls, borrowDuration: sDuration },
      });
      setSBookName(''); setSCondition('good'); setSCategory(''); setSLocation(''); setSLat(''); setSLng(''); setSDuration(14); setSFiles([]);
      await load(); setShareTab('listings');
    } catch (err) { setError(err?.message || 'Failed'); } finally { setSCreating(false); }
  };

  const loadShareRequests = async (book) => {
    setError('');
    try { const d = await api(`/api/share/books/${book._id}/requests`); setSelectedShareBook(book); setShareBookRequests(d.requests || []); }
    catch (err) { setError(err?.message || 'Failed'); }
  };

  const approveRequest = async (r) => {
    setError('');
    try { await api(`/api/share/requests/${r._id}/approve`, { method: 'POST' }); await load(); if (selectedShareBook) await loadShareRequests(selectedShareBook); }
    catch (err) { setError(err?.message || 'Failed'); }
  };
  const rejectShareReq = async (r) => {
    setError('');
    try { await api(`/api/share/requests/${r._id}/reject`, { method: 'POST' }); await load(); if (selectedShareBook) await loadShareRequests(selectedShareBook); }
    catch (err) { setError(err?.message || 'Failed'); }
  };

  const confirmReturn = async (borrowId) => {
    setError('');
    try { await api(`/api/share/requests/${borrowId}/return`, { method: 'POST' }); await load(); }
    catch (err) { setError(err?.message || 'Failed'); }
  };

  const submitReport = async (e) => {
    e.preventDefault(); setError('');
    if (!reportingBorrow) return;
    try { await api(`/api/share/requests/${reportingBorrow}/report`, { method: 'POST', body: { reason: reportReason } }); setReportingBorrow(null); setReportReason(''); await load(); }
    catch (err) { setError(err?.message || 'Failed'); }
  };

  // Share edit / delete
  const startEditShare = (b) => {
    setEditingShare(b); setEsBookName(b.bookName || ''); setEsCondition(b.condition || 'good');
    setEsCategory(b.category || ''); setEsLocation(b.locationText || ''); setEsDuration(b.borrowDuration || 14);
  };
  const saveEditShare = async (e) => {
    e.preventDefault(); setError(''); setEsSaving(true);
    try {
      await api(`/api/share/books/${editingShare._id}`, {
        method: 'PUT',
        body: { bookName: esBookName, condition: esCondition, category: esCategory, location: esLocation, borrowDuration: esDuration },
      });
      setEditingShare(null); await load();
    } catch (err) { setError(err?.message || 'Failed to save'); } finally { setEsSaving(false); }
  };
  const deleteShareBook = async (b) => {
    if (!window.confirm(`Delete "${b.bookName}"?`)) return;
    setError('');
    try { await api(`/api/share/books/${b._id}`, { method: 'DELETE' }); setSelectedShareBook(null); await load(); }
    catch (err) { setError(err?.message || 'Failed to delete'); }
  };

  // ── Exchange actions ─────────────────────────────────────────────
  const createOffer = async (e) => {
    e.preventDefault(); setError(''); setCreating(true);
    try {
      let imageUrls = [];
      if (files.length > 0) {
        const images = await Promise.all(files.map(async (f) => ({ base64: await fileToDataUrl(f), name: f.name })));
        const r = await api('/api/uploads/imgbb', { method: 'POST', body: { images } });
        imageUrls = (r.images || []).map((i) => i.url).filter(Boolean);
      }
      const latN = lat ? Number(lat) : undefined;
      const lngN = lng ? Number(lng) : undefined;
      await api('/api/exchange/offers', {
        method: 'POST',
        body: { bookName, condition, category, location, wantedBook, lat: Number.isFinite(latN) ? latN : undefined, lng: Number.isFinite(lngN) ? lngN : undefined, imageUrls },
      });
      setBookName(''); setCondition('good'); setCategory(''); setLocation(''); setWantedBook(''); setLat(''); setLng(''); setFiles([]);
      await load(); setExTab('offers');
    } catch (err) { setError(err?.message || 'Failed'); } finally { setCreating(false); }
  };

  const loadOfferRequests = async (offer) => {
    setError('');
    try { const d = await api(`/api/exchange/offers/${offer._id}/requests`); setSelectedOffer(offer); setOfferRequests(d.requests || []); }
    catch (err) { setError(err?.message || 'Failed'); }
  };
  const acceptIncoming = async (req) => {
    setError('');
    try { await api(`/api/exchange/requests/${req._id}/accept`, { method: 'POST', body: {} }); await load(); if (selectedOffer) await loadOfferRequests(selectedOffer); }
    catch (err) { setError(err?.message || 'Failed'); }
  };
  const rejectIncoming = async (req) => {
    setError('');
    try { await api(`/api/exchange/requests/${req._id}/reject`, { method: 'POST' }); await load(); if (selectedOffer) await loadOfferRequests(selectedOffer); }
    catch (err) { setError(err?.message || 'Failed'); }
  };

  // Exchange edit / delete
  const startEditOffer = (o) => {
    setEditingOffer(o); setEditBookName(o.bookName || ''); setEditCondition(o.condition || 'good');
    setEditCategory(o.category || ''); setEditLocation(o.locationText || ''); setEditWantedBook(o.wantedBook || '');
  };
  const saveEditOffer = async (e) => {
    e.preventDefault(); setError(''); setEditSaving(true);
    try {
      await api(`/api/exchange/offers/${editingOffer._id}`, {
        method: 'PUT',
        body: { bookName: editBookName, condition: editCondition, category: editCategory, location: editLocation, wantedBook: editWantedBook },
      });
      setEditingOffer(null); await load();
    } catch (err) { setError(err?.message || 'Failed to save'); } finally { setEditSaving(false); }
  };
  const deleteOffer = async (o) => {
    if (!window.confirm(`Delete "${o.bookName}"? This will also remove all incoming requests.`)) return;
    setError('');
    try { await api(`/api/exchange/offers/${o._id}`, { method: 'DELETE' }); setSelectedOffer(null); await load(); }
    catch (err) { setError(err?.message || 'Failed to delete'); }
  };

  // ── Sections ─────────────────────────────────────────────────────
  const SECTIONS = [
    { id: 'share', label: 'My Share Books', count: myShareBooks.length },
    { id: 'exchange', label: 'My Exchanges', count: myOffers.length + myExRequests.length },
  ];

  // ── Status badge helper ──────────────────────────────────────────
  const statusBadge = (st) => {
    const map = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-sky-50 text-sky-700 border-sky-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      returned: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      overdue: 'bg-red-100 text-red-800 border-red-300',
      available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      borrowed: 'bg-sky-50 text-sky-700 border-sky-200',
    };
    return `inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${map[st] || 'bg-gray-100 text-gray-700 border-gray-200'}`;
  };

  return (
    <div className="min-h-screen">
      {(sCreating || creating) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center p-6 rounded-2xl bg-white shadow-2xl border">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-900 border-t-transparent mb-4"></div>
            <h3 className="font-semibold text-gray-900">Uploading Book Details...</h3>
            <p className="text-sm text-gray-500 mt-1">Please wait while we upload images to ImgBB and save.</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-50 via-white to-sky-50 border-b">
        <div className="mx-auto max-w-5xl px-4 pt-8 pb-0">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">Manage your shared books, exchange offers, and borrows.</p>
            </div>
            <button onClick={load} className="rounded-full border bg-white px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 shadow-sm">Refresh</button>
          </div>
          <div className="flex gap-1 border-b -mb-px">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${section === s.id ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                {s.label}
                {s.count > 0 && <span className="ml-1.5 inline-flex items-center rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">{s.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

        {/* ══════════════════════════════════════ SHARE TAB ══════════════════════════════════════ */}
        {section === 'share' && (
          <div className="space-y-6">
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'create', label: 'Share a book' },
                { id: 'listings', label: `My listings (${myShareBooks.length})` },
                { id: 'borrows', label: `My borrows (${myBorrows.length})` },
                { id: 'active', label: `Active (${activeBorrows.length})` },
              ].map((t) => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${shareTab === t.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >{t.label}</button>
              ))}
            </div>

            {/* ── Create share listing ── */}
            {shareTab === 'create' && (
              <div className="max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">Share a book for borrowing</h3>
                <p className="text-xs text-gray-500 mt-1">List a book you'd like to lend to others.</p>
                <form onSubmit={createShareBook} className="mt-5 grid gap-3">
                  <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Book title</span>
                    <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={sBookName} onChange={(e) => setSBookName(e.target.value)} required /></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Condition</span>
                      <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={sCondition} onChange={(e) => setSCondition(e.target.value)}>
                        <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                      </select></label>
                    <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Category</span>
                      <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={sCategory} onChange={(e) => setSCategory(e.target.value)} required>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></label>
                  </div>
                  <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Location</span>
                    <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. Dhanmondi, Dhaka" value={sLocation} onChange={(e) => setSLocation(e.target.value)} required /></label>
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <label className="col-span-2 grid gap-1"><span className="text-xs font-medium text-gray-600">Lat</span><input className="rounded-lg border bg-gray-50 px-2 py-1.5 text-xs" value={sLat} onChange={(e) => setSLat(e.target.value)} placeholder="auto" /></label>
                    <label className="col-span-2 grid gap-1"><span className="text-xs font-medium text-gray-600">Lng</span><input className="rounded-lg border bg-gray-50 px-2 py-1.5 text-xs" value={sLng} onChange={(e) => setSLng(e.target.value)} placeholder="auto" /></label>
                    <button type="button" onClick={useGeo(setSLat, setSLng)} className="rounded-lg border px-2 py-1.5 text-[10px] hover:bg-gray-50">Detect</button>
                  </div>
                  <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Borrow duration</span>
                    <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={sDuration} onChange={(e) => setSDuration(Number(e.target.value))}>
                      {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                    </select></label>
                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-gray-700">Book images</span>
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFiles(setSFiles)(e.dataTransfer.files); }}
                      className="rounded-xl border-2 border-dashed bg-gray-50 p-4 text-center text-xs text-gray-500">
                      <div>Drop images here or <label className="cursor-pointer font-medium text-gray-900 underline">browse<input type="file" className="hidden" multiple accept="image/*" onChange={(e) => pickFiles(setSFiles)(e.target.files)} /></label></div>
                      <div className="text-[10px] text-gray-400 mt-1">Max 6 images</div>
                    </div>
                    {sPreviews.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{sPreviews.map((p) => (
                      <div key={p.name} className="relative rounded-lg border overflow-hidden"><img src={p.url} alt="" className="h-16 w-full object-cover" />
                        <button type="button" onClick={() => setSFiles((prev) => prev.filter((f) => f.name !== p.name))} className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] opacity-0 hover:opacity-100 transition">&times;</button></div>
                    ))}</div>}
                  </div>
                  <button disabled={sCreating} className="rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">{sCreating ? 'Uploading…' : 'Share book'}</button>
                </form>
              </div>
            )}

            {/* ── My listings ── */}
            {shareTab === 'listings' && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-900">Your shared book listings</h3></div>
                {myShareBooks.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No listings yet.</div> : (
                  <div className="divide-y">{myShareBooks.map((b) => (
                    <div key={b._id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONDITION_COLORS[b.condition]}`}>{b.condition}</span>
                          <span className="font-medium text-gray-900">{b.bookName}</span>
                          <span className="text-xs text-gray-500">{b.category}</span>
                          <span className={statusBadge(b.status)}>{b.status}</span>
                          <span className="text-xs text-gray-400">{b.borrowDuration}d</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.status === 'available' && (
                            <>
                              <button type="button" onClick={() => startEditShare(b)} className="rounded-full border px-2.5 py-1 text-[10px] text-gray-600 hover:bg-gray-50">Edit</button>
                              <button type="button" onClick={() => deleteShareBook(b)} className="rounded-full border border-red-200 px-2.5 py-1 text-[10px] text-red-600 hover:bg-red-50">Delete</button>
                            </>
                          )}
                          <button type="button" onClick={() => selectedShareBook?._id === b._id ? setSelectedShareBook(null) : loadShareRequests(b)} className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50">
                            {selectedShareBook?._id === b._id ? 'Hide' : 'Requests'}
                          </button>
                        </div>
                      </div>
                      {selectedShareBook?._id === b._id && (
                        <div className="ml-4 rounded-xl border bg-gray-50 overflow-hidden">
                          {shareBookRequests.length === 0 ? <div className="p-3 text-xs text-gray-500">No requests yet.</div> : (
                            <div className="divide-y">{shareBookRequests.map((r) => (
                              <div key={r._id} className="p-3 text-xs space-y-1">
                                <div><span className="font-medium text-gray-900">{r.borrower?.name || 'User'}</span> wants to borrow</div>
                                {r.message && <div className="text-gray-600">"{r.message}"</div>}
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <span className={statusBadge(r.status)}>{r.status}</span>
                                  {r.status === 'pending' && (
                                    <div className="flex gap-1.5">
                                      <button type="button" onClick={() => approveRequest(r)} className="rounded-full bg-gray-900 px-2.5 py-0.5 text-[10px] text-white hover:bg-gray-800">Approve</button>
                                      <button type="button" onClick={() => rejectShareReq(r)} className="rounded-full border px-2.5 py-0.5 text-[10px] hover:bg-gray-50">Reject</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {/* ── My borrows (as borrower) ── */}
            {shareTab === 'borrows' && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-900">Borrow requests you sent</h3></div>
                {myBorrows.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No borrow requests yet.</div> : (
                  <div className="divide-y">{myBorrows.map((r) => (
                    <div key={r._id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{r.shareBook?.bookName}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{r.shareBook?.category} · {r.shareBook?.condition} · {r.shareBook?.borrowDuration}d</div>
                        {r.message && <div className="text-xs text-gray-500 mt-0.5">"{r.message}"</div>}
                        {r.dueDate && <div className="text-xs mt-0.5"><span className="font-medium text-gray-700">Due:</span> {fmtDate(r.dueDate)}</div>}
                        {r.owner && r.status === 'approved' && <div className="text-xs text-gray-500 mt-0.5">Owner: {r.owner.name} · {r.owner.phone}</div>}
                      </div>
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {/* ── Active borrows (due dates, return, overdue, report) ── */}
            {shareTab === 'active' && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b">
                  <h3 className="font-semibold text-gray-900">Active borrows</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Due dates, return confirmations, overdue tracking, and reports.</p>
                </div>
                {activeBorrows.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No active borrows.</div> : (
                  <div className="divide-y">{activeBorrows.map((a) => {
                    const dl = daysLeft(a.dueDate);
                    const isOverdue = a.status === 'overdue' || (dl !== null && dl < 0 && a.status !== 'returned');
                    return (
                      <div key={a.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-gray-900">{a.bookName}</span>
                              <span className="text-xs text-gray-500">{a.category}</span>
                              <span className={statusBadge(a.status)}>{a.status}</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-600">
                              {a.isOwner ? (
                                <span>Borrowed by <span className="font-medium">{a.borrowerName}</span> · {a.borrowerPhone}</span>
                              ) : (
                                <span>Owner: <span className="font-medium">{a.ownerName}</span> · {a.ownerPhone}</span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                              <span>Borrowed: {fmtDate(a.borrowedAt)}</span>
                              <span className={isOverdue ? 'font-bold text-red-600' : 'font-medium text-gray-800'}>
                                Due: {fmtDate(a.dueDate)}
                                {dl !== null && a.status !== 'returned' && (
                                  <span className="ml-1">({dl > 0 ? `${dl}d left` : dl === 0 ? 'today' : `${Math.abs(dl)}d overdue`})</span>
                                )}
                              </span>
                              {a.returnConfirmedAt && <span className="text-emerald-700">Returned: {fmtDate(a.returnConfirmedAt)}</span>}
                            </div>
                            {a.reportReason && (
                              <div className="mt-1 rounded-lg bg-red-50 border border-red-200 p-2 text-xs text-red-700">
                                Report: {a.reportReason} ({fmtDate(a.reportedAt)})
                              </div>
                            )}
                          </div>
                        </div>
                        {(a.status === 'approved' || a.status === 'overdue') && (
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => confirmReturn(a.id)} className="rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-700">
                              Confirm return
                            </button>
                            {!a.reportReason && (
                              <button type="button" onClick={() => { setReportingBorrow(a.id); setReportReason(''); }} className="rounded-full border border-red-200 px-3 py-1 text-[11px] text-red-600 hover:bg-red-50">
                                Report issue
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════ EXCHANGE TAB ══════════════════════════════════════ */}
        {section === 'exchange' && (
          <div className="space-y-6">
            <div className="flex gap-1.5 flex-wrap">
              {[{ id: 'create', label: 'New offer' }, { id: 'offers', label: `My offers (${myOffers.length})` }, { id: 'sent', label: `Sent requests (${myExRequests.length})` }, { id: 'done', label: `Completed (${myExchanges.length})` }].map((t) => (
                <button key={t.id} onClick={() => setExTab(t.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium border transition ${exTab === t.id ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >{t.label}</button>
              ))}
            </div>

            {exTab === 'create' && (
              <div className="max-w-lg rounded-2xl border bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">Post an exchange offer</h3>
                <p className="text-xs text-gray-500 mt-1">Share a book you have and what you're looking for.</p>
                <form onSubmit={createOffer} className="mt-5 grid gap-3">
                  <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Book you have</span>
                    <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={bookName} onChange={(e) => setBookName(e.target.value)} required /></label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Condition</span>
                      <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={condition} onChange={(e) => setCondition(e.target.value)}>
                        <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                      </select></label>
                    <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Category</span>
                      <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={category} onChange={(e) => setCategory(e.target.value)} required>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></label>
                  </div>
                  <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Location</span>
                    <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" placeholder="e.g. Dhanmondi, Dhaka" value={location} onChange={(e) => setLocation(e.target.value)} required /></label>
                  <div className="grid grid-cols-5 gap-2 items-end">
                    <label className="col-span-2 grid gap-1"><span className="text-xs font-medium text-gray-600">Lat</span><input className="rounded-lg border bg-gray-50 px-2 py-1.5 text-xs" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="auto" /></label>
                    <label className="col-span-2 grid gap-1"><span className="text-xs font-medium text-gray-600">Lng</span><input className="rounded-lg border bg-gray-50 px-2 py-1.5 text-xs" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="auto" /></label>
                    <button type="button" onClick={useGeo(setLat, setLng)} className="rounded-lg border px-2 py-1.5 text-[10px] hover:bg-gray-50">Detect</button>
                  </div>
                  <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Book you want (optional)</span>
                    <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={wantedBook} onChange={(e) => setWantedBook(e.target.value)} /></label>
                  <div className="grid gap-1">
                    <span className="text-sm font-medium text-gray-700">Book images</span>
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFiles(setFiles)(e.dataTransfer.files); }}
                      className="rounded-xl border-2 border-dashed bg-gray-50 p-4 text-center text-xs text-gray-500">
                      <div>Drop images here or <label className="cursor-pointer font-medium text-gray-900 underline">browse<input type="file" className="hidden" multiple accept="image/*" onChange={(e) => pickFiles(setFiles)(e.target.files)} /></label></div>
                      <div className="text-[10px] text-gray-400 mt-1">Max 6 images</div>
                    </div>
                    {previews.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{previews.map((p) => (
                      <div key={p.name} className="relative rounded-lg border overflow-hidden"><img src={p.url} alt="" className="h-16 w-full object-cover" />
                        <button type="button" onClick={() => setFiles((prev) => prev.filter((f) => f.name !== p.name))} className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] opacity-0 hover:opacity-100 transition">&times;</button></div>
                    ))}</div>}
                  </div>
                  <button disabled={creating} className="rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">{creating ? 'Uploading…' : 'Post offer'}</button>
                </form>
              </div>
            )}

            {exTab === 'offers' && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-900">Your offers &amp; incoming requests</h3></div>
                {myOffers.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No offers yet.</div> : (
                  <div className="divide-y">{myOffers.map((o) => (
                    <div key={o._id} className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${CONDITION_COLORS[o.condition]}`}>{o.condition}</span>
                          <span className="font-medium text-gray-900">{o.bookName}</span>
                          <span className="text-xs text-gray-500">{o.category}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${o.status === 'closed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {o.status === 'closed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {o.status === 'open' && (
                            <>
                              <button type="button" onClick={() => startEditOffer(o)} className="rounded-full border px-2.5 py-1 text-[10px] text-gray-600 hover:bg-gray-50">Edit</button>
                              <button type="button" onClick={() => deleteOffer(o)} className="rounded-full border border-red-200 px-2.5 py-1 text-[10px] text-red-600 hover:bg-red-50">Delete</button>
                            </>
                          )}
                          <button type="button" onClick={() => selectedOffer?._id === o._id ? setSelectedOffer(null) : loadOfferRequests(o)} className="rounded-full border px-3 py-1 text-xs hover:bg-gray-50">
                            {selectedOffer?._id === o._id ? 'Hide' : 'View requests'}
                          </button>
                        </div>
                      </div>
                      {selectedOffer?._id === o._id && (
                        <div className="ml-4 rounded-xl border bg-gray-50 overflow-hidden">
                          {offerRequests.length === 0 ? <div className="p-3 text-xs text-gray-500">No requests yet.</div> : (
                            <div className="divide-y">{offerRequests.map((r) => (
                              <div key={r._id} className="p-3 text-xs space-y-1">
                                <div><span className="font-medium text-gray-900">{r.fromUser?.name || 'User'}</span> offers: <span className="font-medium">{r.offeredBook}</span></div>
                                {r.message && <div className="text-gray-600">"{r.message}"</div>}
                                <div className="flex items-center justify-between gap-2 pt-1">
                                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                                  {r.status === 'pending' && (
                                    <div className="flex gap-1.5">
                                      <button type="button" onClick={() => acceptIncoming(r)} className="rounded-full bg-gray-900 px-2.5 py-0.5 text-[10px] text-white hover:bg-gray-800">Accept</button>
                                      <button type="button" onClick={() => rejectIncoming(r)} className="rounded-full border px-2.5 py-0.5 text-[10px] hover:bg-gray-50">Reject</button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {exTab === 'sent' && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-900">Exchange requests you sent</h3></div>
                {myExRequests.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No requests sent yet.</div> : (
                  <div className="divide-y">{myExRequests.map((r) => (
                    <div key={r._id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition">
                      <div>
                        <div className="text-sm"><span className="text-gray-500">Their book:</span> <span className="font-medium text-gray-900">{r.offer?.bookName}</span></div>
                        <div className="text-sm"><span className="text-gray-500">You offered:</span> <span className="font-medium text-gray-900">{r.offeredBook}</span></div>
                        {r.message && <div className="mt-0.5 text-xs text-gray-500">"{r.message}"</div>}
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${r.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{r.status}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {exTab === 'done' && (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-900">Successful exchanges</h3><p className="text-xs text-gray-500 mt-0.5">Initial books and final agreed books.</p></div>
                {myExchanges.length === 0 ? <div className="p-8 text-center text-sm text-gray-500">No completed exchanges yet.</div> : (
                  <div className="divide-y">{myExchanges.map((e) => (
                    <div key={e.id} className="p-4 space-y-1">
                      <div className="text-sm font-medium text-gray-900">{e.ownerName} ↔ {e.requesterName}</div>
                      <div className="text-xs text-gray-600">Initial: {e.offerBook} ↔ {e.requesterBook}</div>
                      <div className="text-xs text-gray-600">Final: <span className="font-medium text-gray-800">{e.finalOwnerBook}</span> ↔ <span className="font-medium text-gray-800">{e.finalFromUserBook}</span></div>
                    </div>
                  ))}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ Edit Share Modal ══════════════ */}
      {editingShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><h3 className="font-semibold text-gray-900">Edit listing</h3><p className="text-sm text-gray-600 mt-0.5">Update your share book listing.</p></div>
              <button onClick={() => setEditingShare(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={saveEditShare} className="grid gap-3">
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Book title</span>
                <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={esBookName} onChange={(e) => setEsBookName(e.target.value)} required /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Condition</span>
                  <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={esCondition} onChange={(e) => setEsCondition(e.target.value)}>
                    <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                  </select></label>
                <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Category</span>
                  <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={esCategory} onChange={(e) => setEsCategory(e.target.value)} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></label>
              </div>
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Location</span>
                <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={esLocation} onChange={(e) => setEsLocation(e.target.value)} required /></label>
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Borrow duration</span>
                <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={esDuration} onChange={(e) => setEsDuration(Number(e.target.value))}>
                  {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                </select></label>
              <div className="flex gap-2 pt-1">
                <button disabled={esSaving} className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">{esSaving ? 'Saving…' : 'Save changes'}</button>
                <button type="button" onClick={() => setEditingShare(null)} className="rounded-xl border px-4 py-2.5 text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ Edit Exchange Offer Modal ══════════════ */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><h3 className="font-semibold text-gray-900">Edit offer</h3><p className="text-sm text-gray-600 mt-0.5">Update your exchange offer details.</p></div>
              <button onClick={() => setEditingOffer(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={saveEditOffer} className="grid gap-3">
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Book you have</span>
                <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={editBookName} onChange={(e) => setEditBookName(e.target.value)} required /></label>
              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Condition</span>
                  <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={editCondition} onChange={(e) => setEditCondition(e.target.value)}>
                    <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                  </select></label>
                <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Category</span>
                  <select className="rounded-xl border bg-gray-50 px-3 py-2 text-sm" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></label>
              </div>
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Location</span>
                <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required /></label>
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Book you want (optional)</span>
                <input className="rounded-xl border bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200" value={editWantedBook} onChange={(e) => setEditWantedBook(e.target.value)} /></label>
              <div className="flex gap-2 pt-1">
                <button disabled={editSaving} className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60">{editSaving ? 'Saving…' : 'Save changes'}</button>
                <button type="button" onClick={() => setEditingOffer(null)} className="rounded-xl border px-4 py-2.5 text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ Report Modal ══════════════ */}
      {reportingBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div><h3 className="font-semibold text-gray-900">Report an issue</h3><p className="text-sm text-gray-600 mt-0.5">Describe the problem with this borrow.</p></div>
              <button onClick={() => setReportingBorrow(null)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">&times;</button>
            </div>
            <form onSubmit={submitReport} className="grid gap-3">
              <label className="grid gap-1"><span className="text-sm font-medium text-gray-700">Reason</span>
                <textarea className="rounded-xl border bg-gray-50 px-3 py-2.5 text-sm min-h-24 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-200"
                  value={reportReason} onChange={(e) => setReportReason(e.target.value)} required placeholder="e.g. Book damaged, not returned on time…" /></label>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">Submit report</button>
                <button type="button" onClick={() => setReportingBorrow(null)} className="rounded-xl border px-4 py-2.5 text-sm hover:bg-gray-50">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
