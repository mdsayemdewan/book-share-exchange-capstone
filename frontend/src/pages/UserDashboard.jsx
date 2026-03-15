import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../lib/api';

const CONDITION_COLORS = { new: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30', good: 'bg-sky-500/20 text-sky-300 border-sky-400/30', used: 'bg-amber-500/20 text-amber-300 border-amber-400/30' };
const CATEGORIES = ['Fiction', 'Non-fiction', 'Academic', 'Science', 'History', 'Self-help', 'Children', 'Thriller', 'Horror', 'Comics', 'Fantasy', 'Other'];
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
  const loc = useLocation();
  const [section, setSection] = useState(loc.state?.section || 'share');

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
  const [exTab, setExTab] = useState(loc.state?.exTab || 'create');

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

  useEffect(() => {
    if (loc.state?.section) setSection(loc.state.section);
    if (loc.state?.exTab) setExTab(loc.state.exTab);
    // Replace state so it doesn't persistently stay after unmounting and remounting without arguments
    window.history.replaceState({}, document.title);
  }, [loc.state]);

  // Edit exchange offer
  const [editingOffer, setEditingOffer] = useState(null);
  const [editBookName, setEditBookName] = useState('');
  const [editCondition, setEditCondition] = useState('good');
  const [editCategory, setEditCategory] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWantedBook, setEditWantedBook] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  const [rejectingExReq, setRejectingExReq] = useState(null);
  const [rejectExReason, setRejectExReason] = useState('');

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
  const submitRejectEx = async (e) => {
    e.preventDefault(); setError('');
    if (!rejectingExReq) return;
    try { 
      await api(`/api/exchange/requests/${rejectingExReq._id}/reject`, { 
        method: 'POST', 
        body: rejectExReason ? { message: rejectExReason } : {} 
      }); 
      setRejectingExReq(null); setRejectExReason(''); await load(); 
      if (selectedOffer) await loadOfferRequests(selectedOffer); 
    }
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
      pending: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      approved: 'bg-primary-500/20 text-primary-300 border-primary-400/30',
      rejected: 'bg-red-500/20 text-red-300 border-red-400/30',
      returned: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      overdue: 'bg-red-500/30 text-red-200 border-red-400 font-bold',
      available: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      borrowed: 'bg-primary-500/20 text-primary-300 border-primary-400/30',
    };
    return `inline-flex items-center rounded-lg border px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold shadow-sm ${map[st] || 'bg-white/10 text-gray-300 border-white/20'}`;
  };

  const inputClass = "w-full rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:bg-white/15 transition-all";
  const selectClass = "w-full rounded-2xl border border-white/20 bg-slate-800 px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all";

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 pb-12">
      {(sCreating || creating) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
          <div className="flex flex-col items-center p-8 rounded-3xl bg-slate-800 border border-white/10 shadow-2xl">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mb-4"></div>
            <h3 className="font-bold text-white text-lg">Uploading...</h3>
            <p className="text-sm text-slate-400 mt-1">Saving your book details.</p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="relative border-b border-white/10 overflow-hidden bg-slate-800/50 backdrop-blur-lg">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl mix-blend-screen opacity-60"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl mix-blend-screen opacity-60"></div>

        <div className="relative z-10 mx-auto max-w-5xl px-4 pt-12 pb-0">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 border border-primary-400/30 text-primary-300 text-xs font-bold uppercase tracking-widest mb-3">
                Overview
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">My Dashboard</h1>
              <p className="mt-2 text-sm text-slate-400 font-medium">Manage your shared books, offers, and borrows.</p>
            </div>
            <button onClick={load} className="self-start md:self-auto flex items-center gap-2 rounded-xl bg-white/10 border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 shadow-lg transition-all active:scale-95">
              <span>↻</span> Refresh
            </button>
          </div>

          <div className="flex gap-6 border-b border-white/10 overflow-x-auto no-scrollbar">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => setSection(s.id)}
                className={`flex items-center gap-2 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${section === s.id ? 'border-primary-400 text-primary-400' : 'border-transparent text-slate-400 hover:text-white hover:border-white/30'}`}>
                {s.label}
                {s.count > 0 && <span className={`inline-flex items-center justify-center rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${section === s.id ? 'bg-primary-500/20 text-primary-300' : 'bg-white/10 text-slate-300'}`}>{s.count}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {error && <div className="mb-6 rounded-2xl bg-red-500/20 border border-red-400/30 p-4 text-sm font-medium text-red-200">{error}</div>}

        {/* ══════════════════════════════════════ SHARE TAB ══════════════════════════════════════ */}
        {section === 'share' && (
          <div className="space-y-8">
            <div className="flex gap-2 flex-wrap bg-white/5 p-1.5 rounded-2xl w-fit border border-white/10">
              {[
                { id: 'create', label: 'Share a Book' },
                { id: 'listings', label: `My Listings (${myShareBooks.length})` },
                { id: 'borrows', label: `My Borrows (${myBorrows.length})` },
                { id: 'active', label: `Active (${activeBorrows.length})` },
              ].map((t) => (
                <button key={t.id} onClick={() => setShareTab(t.id)}
                  className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${shareTab === t.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >{t.label}</button>
              ))}
            </div>

            {/* Create Share */}
            {shareTab === 'create' && (
              <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-7 shadow-xl backdrop-blur-sm">
                <h3 className="font-bold text-white text-xl">Share a book for borrowing</h3>
                <p className="text-sm text-slate-400 mt-1 mb-5">List a book you'd like to lend to the community.</p>
                <form onSubmit={createShareBook} className="grid gap-4">
                  <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Book title</span>
                    <input className={inputClass} value={sBookName} onChange={(e) => setSBookName(e.target.value)} required /></label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Condition</span>
                      <select className={selectClass} value={sCondition} onChange={(e) => setSCondition(e.target.value)}>
                        <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                      </select></label>
                    <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Category</span>
                      <select className={selectClass} value={sCategory} onChange={(e) => setSCategory(e.target.value)} required>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></label>
                  </div>
                  <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Location</span>
                    <input className={inputClass} placeholder="e.g. Dhanmondi, Dhaka" value={sLocation} onChange={(e) => setSLocation(e.target.value)} required /></label>
                  <div className="grid grid-cols-5 gap-3 items-end">
                    <label className="col-span-2 grid gap-1.5"><span className="text-xs font-semibold text-slate-400">Latitude</span><input className={inputClass} style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }} value={sLat} onChange={(e) => setSLat(e.target.value)} placeholder="auto" /></label>
                    <label className="col-span-2 grid gap-1.5"><span className="text-xs font-semibold text-slate-400">Longitude</span><input className={inputClass} style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }} value={sLng} onChange={(e) => setSLng(e.target.value)} placeholder="auto" /></label>
                    <button type="button" onClick={useGeo(setSLat, setSLng)} className="rounded-xl border border-primary-500/30 bg-primary-500/10 h-[34px] text-[11px] font-bold text-primary-300 hover:bg-primary-500/20 transition-colors">Detect</button>
                  </div>
                  <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Borrow duration</span>
                    <select className={selectClass} value={sDuration} onChange={(e) => setSDuration(Number(e.target.value))}>
                      {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                    </select></label>
                  <div className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-300">Book images</span>
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFiles(setSFiles)(e.dataTransfer.files); }}
                      className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-400 hover:bg-white/10 transition-colors">
                      <div>Drop images here or <label className="cursor-pointer font-bold text-primary-400 hover:text-primary-300">browse<input type="file" className="hidden" multiple accept="image/*" onChange={(e) => pickFiles(setSFiles)(e.target.files)} /></label></div>
                    </div>
                    {sPreviews.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{sPreviews.map((p) => (
                      <div key={p.name} className="relative rounded-xl border border-white/20 overflow-hidden"><img src={p.url} alt="" className="h-20 w-full object-cover" />
                        <button type="button" onClick={() => setSFiles((prev) => prev.filter((f) => f.name !== p.name))} className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold opacity-0 hover:opacity-100 transition">&times;</button></div>
                    ))}</div>}
                  </div>
                  <button disabled={sCreating} className="mt-2 rounded-2xl bg-gradient-to-r from-primary-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-lg hover:shadow-primary-500/30 disabled:opacity-60 transition-all active:scale-95">{sCreating ? 'Uploading…' : 'Publish Book'}</button>
                </form>
              </div>
            )}

            {/* My Listings */}
            {shareTab === 'listings' && (
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5"><h3 className="font-bold text-white">Your shared book listings</h3></div>
                {myShareBooks.length === 0 ? <div className="p-10 text-center text-slate-400">No listings yet.</div> : (
                  <div className="divide-y divide-white/10">{myShareBooks.map((b) => (
                    <div key={b._id} className="p-5 space-y-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`shrink-0 border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[b.condition]}`}>{b.condition}</span>
                          <span className="font-bold text-white text-base">{b.bookName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-slate-300 font-medium">{b.category}</span>
                          <span className={statusBadge(b.status)}>{b.status}</span>
                          <span className="text-xs font-semibold text-slate-500">⏱ {b.borrowDuration} days</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {b.status === 'available' && (
                            <>
                              <button type="button" onClick={() => startEditShare(b)} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors">Edit</button>
                              <button type="button" onClick={() => deleteShareBook(b)} className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                            </>
                          )}
                          <button type="button" onClick={() => selectedShareBook?._id === b._id ? setSelectedShareBook(null) : loadShareRequests(b)} className="rounded-xl border border-primary-500/30 bg-primary-500/10 px-4 py-1.5 text-xs font-bold text-primary-300 hover:bg-primary-500/20 transition-colors">
                            {selectedShareBook?._id === b._id ? 'Hide Requests' : 'View Requests'}
                          </button>
                        </div>
                      </div>
                      {selectedShareBook?._id === b._id && (
                        <div className="ml-5 rounded-2xl border border-white/10 bg-slate-800/80 overflow-hidden shadow-inner mt-3">
                          {shareBookRequests.length === 0 ? <div className="p-4 text-sm text-slate-400">No requests yet.</div> : (
                            <div className="divide-y divide-white/5">{shareBookRequests.map((r) => (
                              <div key={r._id} className="p-4 text-sm space-y-2">
                                <div><span className="font-bold text-white">{r.borrower?.name || 'A user'}</span> wants to borrow</div>
                                {r.message && <div className="text-slate-300 italic border-l-2 border-primary-500/50 pl-2 py-0.5 mt-1 text-xs">"{r.message}"</div>}
                                <div className="flex items-center justify-between gap-3 pt-2">
                                  <span className={statusBadge(r.status)}>{r.status}</span>
                                  {r.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => approveRequest(r)} className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity flex items-center gap-1"><span className="text-sm">✓</span> Approve</button>
                                      <button type="button" onClick={() => rejectShareReq(r)} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors">Reject</button>
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

            {/* My Borrows */}
            {shareTab === 'borrows' && (
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5"><h3 className="font-bold text-white">Borrow requests you sent</h3></div>
                {myBorrows.length === 0 ? <div className="p-10 text-center text-slate-400">No borrow requests sent yet.</div> : (
                  <div className="divide-y divide-white/10">{myBorrows.map((r) => (
                    <div key={r._id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                      <div className="space-y-1">
                        <div className="text-base font-bold text-white">{r.shareBook?.bookName}</div>
                        <div className="flex gap-2 items-center text-xs text-slate-400 font-medium">
                          <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300">{r.shareBook?.category}</span>
                          <span className="bg-white/10 px-2 py-0.5 rounded text-slate-300">{r.shareBook?.condition}</span>
                          <span>⏱ {r.shareBook?.borrowDuration} days</span>
                        </div>
                        {r.message && <div className="text-xs text-slate-400 italic">" {r.message} "</div>}
                        {r.dueDate && <div className="text-xs mt-1 text-primary-300 font-semibold">Due: {fmtDate(r.dueDate)}</div>}
                        {r.owner && r.status === 'approved' && <div className="text-xs text-emerald-300 font-medium mt-1">Owner: {r.owner.name} · 📞 {r.owner.phone}</div>}
                      </div>
                      <span className={statusBadge(r.status)}>{r.status}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {/* Active Borrows */}
            {shareTab === 'active' && (
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                  <h3 className="font-bold text-white">Active borrows</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Track your items and items you've borrowed.</p>
                </div>
                {activeBorrows.length === 0 ? <div className="p-10 text-center text-slate-400">No active borrows right now.</div> : (
                  <div className="divide-y divide-white/10">{activeBorrows.map((a) => {
                    const dl = daysLeft(a.dueDate);
                    const isOverdue = a.status === 'overdue' || (dl !== null && dl < 0 && a.status !== 'returned');
                    return (
                      <div key={a.id} className="p-5 hover:bg-white/5 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white text-lg">{a.bookName}</span>
                              <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-semibold text-slate-300">{a.category}</span>
                              <span className={statusBadge(a.status)}>{a.status}</span>
                            </div>
                            <div className="text-sm font-medium">
                              {a.isOwner ? (
                                <span className="text-slate-300">Lent to: <span className="text-white font-bold">{a.borrowerName}</span> · 📞 {a.borrowerPhone}</span>
                              ) : (
                                <span className="text-slate-300">Borrowed from: <span className="text-white font-bold">{a.ownerName}</span> · 📞 {a.ownerPhone}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-white/5 p-2.5 rounded-xl border border-white/5 w-fit">
                              <span className="text-slate-400">📅 Borrowed: {fmtDate(a.borrowedAt)}</span>
                              <span className={isOverdue ? 'text-red-400 border border-red-500/30 bg-red-500/10 px-2 py-0.5 rounded-lg' : 'text-primary-300'}>
                                ⏰ Due: {fmtDate(a.dueDate)}
                                {dl !== null && a.status !== 'returned' && (
                                  <span className="ml-1 opacity-80">({dl > 0 ? `${dl}d left` : dl === 0 ? 'today' : `${Math.abs(dl)}d overdue`})</span>
                                )}
                              </span>
                              {a.returnConfirmedAt && <span className="text-emerald-400">✅ Returned: {fmtDate(a.returnConfirmedAt)}</span>}
                            </div>
                            {a.reportReason && (
                              <div className="mt-2 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300 font-medium">
                                ⚠️ Reported: {a.reportReason} ({fmtDate(a.reportedAt)})
                              </div>
                            )}
                          </div>
                        </div>
                        {(a.status === 'approved' || a.status === 'overdue') && (
                          <div className="flex gap-2 pt-4 mt-2 border-t border-white/5">
                            <button type="button" onClick={() => confirmReturn(a.id)} className="rounded-xl bg-emerald-500 hover:bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors shadow-lg shadow-emerald-500/20">
                              ✅ Confirm Returned
                            </button>
                            {!a.reportReason && (
                              <button type="button" onClick={() => { setReportingBorrow(a.id); setReportReason(''); }} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors">
                                ⚠️ Report Issue
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
          <div className="space-y-8">
            <div className="flex gap-2 flex-wrap bg-white/5 p-1.5 rounded-2xl w-fit border border-white/10">
              {[{ id: 'create', label: 'New Offer' }, { id: 'offers', label: `My Offers (${myOffers.length})` }, { id: 'sent', label: `Sent Requests (${myExRequests.length})` }, { id: 'done', label: `Completed (${myExchanges.length})` }].map((t) => (
                <button key={t.id} onClick={() => setExTab(t.id)}
                  className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${exTab === t.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
                >{t.label}</button>
              ))}
            </div>

            {exTab === 'create' && (
              <div className="max-w-lg rounded-3xl border border-white/10 bg-white/5 p-7 shadow-xl backdrop-blur-sm">
                <h3 className="font-bold text-white text-xl">Post an exchange offer</h3>
                <p className="text-sm text-slate-400 mt-1 mb-5">Share a book you have and what you want.</p>
                <form onSubmit={createOffer} className="grid gap-4">
                  <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Book you have</span>
                    <input className={inputClass} value={bookName} onChange={(e) => setBookName(e.target.value)} required /></label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Condition</span>
                      <select className={selectClass} value={condition} onChange={(e) => setCondition(e.target.value)}>
                        <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                      </select></label>
                    <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Category</span>
                      <select className={selectClass} value={category} onChange={(e) => setCategory(e.target.value)} required>
                        <option value="">Select category</option>
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select></label>
                  </div>
                  <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Location</span>
                    <input className={inputClass} placeholder="e.g. Dhanmondi, Dhaka" value={location} onChange={(e) => setLocation(e.target.value)} required /></label>
                  <div className="grid grid-cols-5 gap-3 items-end">
                    <label className="col-span-2 grid gap-1.5"><span className="text-xs font-semibold text-slate-400">Lat</span><input className={inputClass} style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="auto" /></label>
                    <label className="col-span-2 grid gap-1.5"><span className="text-xs font-semibold text-slate-400">Lng</span><input className={inputClass} style={{ padding: '0.4rem 0.8rem', fontSize: '12px' }} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="auto" /></label>
                    <button type="button" onClick={useGeo(setLat, setLng)} className="rounded-xl border border-violet-500/30 bg-violet-500/10 h-[34px] text-[11px] font-bold text-violet-300 hover:bg-violet-500/20 transition-colors">Detect</button>
                  </div>
                  <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Book you want <span className="opacity-60 font-normal">(optional)</span></span>
                    <input className={inputClass} value={wantedBook} onChange={(e) => setWantedBook(e.target.value)} /></label>
                  <div className="grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-300">Book images</span>
                    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); pickFiles(setFiles)(e.dataTransfer.files); }}
                      className="rounded-2xl border-2 border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-400 hover:bg-white/10 transition-colors">
                      <div>Drop images here or <label className="cursor-pointer font-bold text-violet-400 hover:text-violet-300">browse<input type="file" className="hidden" multiple accept="image/*" onChange={(e) => pickFiles(setFiles)(e.target.files)} /></label></div>
                    </div>
                    {previews.length > 0 && <div className="mt-2 grid grid-cols-4 gap-2">{previews.map((p) => (
                      <div key={p.name} className="relative rounded-xl border border-white/20 overflow-hidden"><img src={p.url} alt="" className="h-20 w-full object-cover" />
                        <button type="button" onClick={() => setFiles((prev) => prev.filter((f) => f.name !== p.name))} className="absolute inset-0 flex items-center justify-center bg-black/60 text-white font-bold opacity-0 hover:opacity-100 transition">&times;</button></div>
                    ))}</div>}
                  </div>
                  <button disabled={creating} className="mt-2 rounded-2xl bg-gradient-to-r from-violet-500 to-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 disabled:opacity-60 transition-all active:scale-95">{creating ? 'Uploading…' : 'Post Offer'}</button>
                </form>
              </div>
            )}

            {exTab === 'offers' && (
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5"><h3 className="font-bold text-white">Your offers &amp; incoming requests</h3></div>
                {myOffers.length === 0 ? <div className="p-10 text-center text-slate-400">No offers yet.</div> : (
                  <div className="divide-y divide-white/10">{myOffers.map((o) => (
                    <div key={o._id} className="p-5 space-y-3 hover:bg-white/5 transition-colors">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className={`shrink-0 border rounded-full px-2.5 py-0.5 text-[10px] font-bold ${CONDITION_COLORS[o.condition]}`}>{o.condition}</span>
                          <span className="font-bold text-white text-base">{o.bookName}</span>
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-slate-300 font-medium">{o.category}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${o.status === 'closed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>
                            {o.status === 'closed' ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {o.status === 'open' && (
                            <>
                              <button type="button" onClick={() => startEditOffer(o)} className="rounded-xl border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors">Edit</button>
                              <button type="button" onClick={() => deleteOffer(o)} className="rounded-xl border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors">Delete</button>
                            </>
                          )}
                          <button type="button" onClick={() => selectedOffer?._id === o._id ? setSelectedOffer(null) : loadOfferRequests(o)} className="rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-bold text-violet-300 hover:bg-violet-500/20 transition-colors">
                            {selectedOffer?._id === o._id ? 'Hide Requests' : 'View Requests'}
                          </button>
                        </div>
                      </div>
                      {selectedOffer?._id === o._id && (
                        <div className="ml-5 rounded-2xl border border-white/10 bg-slate-800/80 overflow-hidden shadow-inner mt-3">
                          {offerRequests.length === 0 ? <div className="p-4 text-sm text-slate-400">No requests yet.</div> : (
                            <div className="divide-y divide-white/5">{offerRequests.map((r) => (
                              <div key={r._id} className="p-4 text-sm space-y-2">
                                <div><span className="font-bold text-white">{r.fromUser?.name || 'A user'}</span> offers in exchange: <span className="font-bold text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-md">{r.offeredBook}</span></div>
                                {r.message && <div className="text-slate-300 italic border-l-2 border-violet-500/50 pl-2 py-0.5 mt-1 text-xs">"{r.message}"</div>}
                                <div className="flex items-center justify-between gap-3 pt-2">
                                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold border ${r.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : r.status === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>{r.status}</span>
                                  {r.status === 'pending' && (
                                    <div className="flex gap-2">
                                      <button type="button" onClick={() => acceptIncoming(r)} className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-1.5 text-xs font-bold text-white hover:opacity-90 transition-opacity">Accept</button>
                                      <button type="button" onClick={() => { setRejectingExReq(r); setRejectExReason(''); }} className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-300 hover:bg-red-500/20 transition-colors">Reject</button>
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
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5"><h3 className="font-bold text-white">Exchange requests you sent</h3></div>
                {myExRequests.length === 0 ? <div className="p-10 text-center text-slate-400">No requests sent yet.</div> : (
                  <div className="divide-y divide-white/10">{myExRequests.map((r) => (
                    <div key={r._id} className="p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-slate-300">You requested: <span className="font-bold text-white">{r.offer?.bookName}</span></div>
                        <div className="text-sm font-medium text-slate-300">You offered: <span className="font-bold text-violet-300">{r.offeredBook}</span></div>
                        {r.message && <div className="mt-1 text-xs text-slate-400 italic">"{r.message}"</div>}
                        {r.status === 'rejected' && r.rejectMessage && (
                          <div className="mt-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                            <span className="font-semibold">Reason:</span> {r.rejectMessage}
                          </div>
                        )}
                      </div>
                      <span className={`shrink-0 border rounded-full px-3 py-1 text-[10px] font-bold ${r.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : r.status === 'rejected' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'}`}>{r.status}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            )}

            {exTab === 'done' && (
              <div className="rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-white/10 bg-white/5">
                  <h3 className="font-bold text-white">Completed exchanges</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Records of successful book trades.</p>
                </div>
                {myExchanges.length === 0 ? <div className="p-10 text-center text-slate-400">No completed exchanges yet.</div> : (
                  <div className="divide-y divide-white/10">{myExchanges.map((e) => (
                    <div key={e.id} className="p-5 space-y-2 hover:bg-white/5 transition-colors">
                      <div className="text-sm font-bold text-white bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 w-fit flex items-center gap-1.5 flex-wrap">
                        👤 {e.ownerName} <span className="opacity-60 text-xs font-normal">📞 {e.ownerPhone || 'N/A'}</span>
                        <span className="mx-1 text-violet-400">↔</span>
                        👤 {e.requesterName} <span className="opacity-60 text-xs font-normal">📞 {e.requesterPhone || 'N/A'}</span>
                      </div>
                      {e.offerBook === e.finalOwnerBook && e.requesterBook === e.finalFromUserBook ? (
                        <div className="text-sm text-slate-300 px-1">Exchanged: <span className="font-bold text-violet-300">{e.offerBook}</span> <span className="mx-1 text-slate-500">↔</span> <span className="font-bold text-primary-300">{e.requesterBook}</span></div>
                      ) : (
                        <>
                          <div className="text-xs text-slate-400 px-1">Original Offer: <span className="text-slate-300">{e.offerBook}</span> <span className="mx-1">↔</span> <span className="text-slate-300">{e.requesterBook}</span></div>
                          <div className="text-sm text-slate-300 px-1">Final Agreed: <span className="font-bold text-violet-300">{e.finalOwnerBook}</span> <span className="mx-1 text-slate-500">↔</span> <span className="font-bold text-primary-300">{e.finalFromUserBook}</span></div>
                        </>
                      )}
                    </div>
                  ))}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════ Modals ══════════════ */}
      {/* Edit Share Modal */}
      {editingShare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/10 shadow-2xl p-7">
            <h3 className="font-bold text-white text-lg">Edit Listing</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">Update your shared book details.</p>
            <form onSubmit={saveEditShare} className="grid gap-4">
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Book title</span>
                <input className={inputClass} value={esBookName} onChange={(e) => setEsBookName(e.target.value)} required /></label>
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Condition</span>
                  <select className={selectClass} value={esCondition} onChange={(e) => setEsCondition(e.target.value)}>
                    <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                  </select></label>
                <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Category</span>
                  <select className={selectClass} value={esCategory} onChange={(e) => setEsCategory(e.target.value)} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></label>
              </div>
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Location</span>
                <input className={inputClass} value={esLocation} onChange={(e) => setEsLocation(e.target.value)} required /></label>
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Borrow duration</span>
                <select className={selectClass} value={esDuration} onChange={(e) => setEsDuration(Number(e.target.value))}>
                  {DURATION_OPTIONS.map((d) => <option key={d} value={d}>{d} days</option>)}
                </select></label>
              <div className="flex gap-3 pt-2">
                <button disabled={esSaving} className="flex-1 rounded-2xl bg-primary-500 py-3 text-sm font-bold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-colors disabled:opacity-60">{esSaving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditingShare(null)} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Offer Modal */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/10 shadow-2xl p-7">
            <h3 className="font-bold text-white text-lg">Edit Offer</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">Update your exchange offer details.</p>
            <form onSubmit={saveEditOffer} className="grid gap-4">
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Book you have</span>
                <input className={inputClass} value={editBookName} onChange={(e) => setEditBookName(e.target.value)} required /></label>
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Condition</span>
                  <select className={selectClass} value={editCondition} onChange={(e) => setEditCondition(e.target.value)}>
                    <option value="new">New</option><option value="good">Good</option><option value="used">Used</option>
                  </select></label>
                <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Category</span>
                  <select className={selectClass} value={editCategory} onChange={(e) => setEditCategory(e.target.value)} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></label>
              </div>
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Location</span>
                <input className={inputClass} value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required /></label>
              <label className="grid gap-1.5"><span className="text-sm font-semibold text-slate-300">Book you want (optional)</span>
                <input className={inputClass} value={editWantedBook} onChange={(e) => setEditWantedBook(e.target.value)} /></label>
              <div className="flex gap-3 pt-2">
                <button disabled={editSaving} className="flex-1 rounded-2xl bg-violet-500 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/30 hover:bg-violet-600 transition-colors disabled:opacity-60">{editSaving ? 'Saving…' : 'Save Changes'}</button>
                <button type="button" onClick={() => setEditingOffer(null)} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Exchange Modal */}
      {rejectingExReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/10 shadow-2xl p-7">
            <h3 className="font-bold text-white text-lg">Reject Exchange Request</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">Are you sure? You can provide an optional reason.</p>
            <form onSubmit={submitRejectEx} className="grid gap-4">
              <label className="grid gap-1.5">
                <textarea className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 min-h-32 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none transition-all"
                  value={rejectExReason} onChange={(e) => setRejectExReason(e.target.value)} placeholder="Optional reason for rejection..." />
              </label>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors">Confirm Reject</button>
                <button type="button" onClick={() => { setRejectingExReq(null); setRejectExReason(''); }} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportingBorrow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-800 border border-white/10 shadow-2xl p-7">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">⚠️ Report an issue</h3>
            <p className="text-sm text-slate-400 mt-1 mb-5">Describe the problem with this borrow (e.g. damaged, late).</p>
            <form onSubmit={submitReport} className="grid gap-4">
              <label className="grid gap-1.5">
                <textarea className="w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-500 min-h-32 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none transition-all"
                  value={reportReason} onChange={(e) => setReportReason(e.target.value)} required placeholder="Describe the issue in detail..." />
              </label>
              <div className="flex gap-3 pt-2">
                <button className="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition-colors">Submit Report</button>
                <button type="button" onClick={() => setReportingBorrow(null)} className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
