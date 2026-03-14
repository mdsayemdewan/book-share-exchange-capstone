import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { getAuth } from '../lib/auth';

export default function RatingRanking() {
    const [users, setUsers] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resetMsg, setResetMsg] = useState('');

    const auth = getAuth();
    const isAdmin = auth?.user?.role === 'admin';

    useEffect(() => {
        loadRanking(page);
    }, [page]);

    const loadRanking = async (p) => {
        setLoading(true);
        try {
            const data = await api(`/api/users/ranking?page=${p}&limit=10`);
            setUsers(data.users || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPoints = async () => {
        setResetting(true);
        setResetMsg('');
        try {
            const data = await api('/api/admin/reset-points', { method: 'PATCH' });
            setResetMsg(`✅ ${data.message} (${data.usersReset} users reset)`);
            setShowConfirm(false);
            // Reload ranking to reflect zeroed points
            setPage(1);
            loadRanking(1);
        } catch (err) {
            setResetMsg(`❌ ${err.message || 'Failed to reset points.'}`);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-200 py-12 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
            <div className="fixed bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>

            <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8 relative z-10">
                {/* ── Header ── */}
                <div className="relative mb-8 text-center bg-white/5 border border-white/10 p-10 md:p-14 rounded-[2.5rem] shadow-2xl backdrop-blur-xl overflow-hidden pointer-events-none">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500"></div>
                    <div className="relative z-10 pointer-events-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
                            Leaderboard
                        </div>
                        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 mb-4 tracking-tight drop-shadow-sm">
                            Top Book Traders
                        </h1>
                        <p className="text-slate-400 font-medium text-lg max-w-lg mx-auto">Discover the most active members based on their successful book exchanges.</p>

                        {/* ── Admin reset button ── */}
                        {isAdmin && (
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <button
                                    onClick={() => { setResetMsg(''); setShowConfirm(true); }}
                                    className="inline-flex items-center gap-2 rounded-2xl bg-red-600/90 border border-red-500 hover:bg-red-500  px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                >
                                    🔄 Reset All Points
                                </button>
                                {resetMsg && (
                                    <p className={`mt-4 text-sm font-bold px-4 py-2 rounded-xl inline-block bg-white/5 border border-white/10 ${resetMsg.startsWith('✅') ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {resetMsg}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Confirmation Modal ── */}
                {showConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-md"
                            onClick={() => !resetting && setShowConfirm(false)}
                        />
                        {/* Dialog */}
                        <div className="relative z-10 w-full max-w-sm rounded-[2rem] bg-slate-800 border border-white/10 shadow-2xl p-8 flex flex-col gap-5">
                            <div className="flex items-center gap-4">
                                <div className="h-14 w-14 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center text-2xl shrink-0">
                                    ⚠️
                                </div>
                                <div>
                                    <h2 className="text-lg font-extrabold text-white">Reset All Points?</h2>
                                    <p className="text-sm text-slate-400 mt-1">This will set everyone's points to <strong className="text-white">0</strong>. Cannot be undone.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-white/5">
                                <button
                                    onClick={handleResetPoints}
                                    disabled={resetting}
                                    className="flex-1 rounded-2xl bg-red-500 hover:bg-red-600 py-3 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/30"
                                >
                                    {resetting ? 'Resetting…' : 'Yes, Reset'}
                                </button>
                                <button
                                    onClick={() => setShowConfirm(false)}
                                    disabled={resetting}
                                    className="rounded-2xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-slate-300 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Ranking list ── */}
                <div className="bg-white/5 rounded-3xl border border-white/10 shadow-xl overflow-hidden backdrop-blur-md">
                    {loading && users.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 font-medium flex flex-col items-center gap-4">
                            <div className="w-8 h-8 rounded-full border-4 border-amber-500 border-t-transparent animate-spin"></div>
                            Loading Leaderboard...
                        </div>
                    ) : users.length === 0 ? (
                        <div className="p-16 text-center text-slate-400 font-medium">No users ranked yet.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {users.map((user, index) => {
                                const rank = (page - 1) * 10 + index + 1;
                                const isTop3 = rank <= 3;
                                const rankColors = {
                                    1: 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]',
                                    2: 'text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]',
                                    3: 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.6)]',
                                };
                                const rankColor = rankColors[rank] || 'text-slate-500';

                                return (
                                    <div key={user.id} className={`flex items-center p-5 sm:p-6 hover:bg-white/5 transition-colors ${isTop3 ? 'bg-white/[0.02]' : ''}`}>
                                        <div className="flex-shrink-0 w-12 text-center">
                                            <span className={`text-2xl font-black italic tracking-tighter ${rankColor}`}>
                                                #{rank}
                                            </span>
                                        </div>
                                        <div className="flex-shrink-0 ml-4 sm:ml-6">
                                            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full overflow-hidden bg-slate-800 border-2 border-white/10 shadow-lg">
                                                {user.imageUrls && user.imageUrls.length > 0 ? (
                                                    <img src={user.imageUrls[0]} alt={user.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-slate-700 to-slate-600 text-white text-2xl font-extrabold">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="ml-5 sm:ml-6 flex-1 min-w-0">
                                            <p className="text-lg sm:text-xl font-bold text-white truncate drop-shadow-sm">
                                                {user.name}
                                            </p>
                                            <p className="text-sm font-medium text-slate-400 truncate mt-0.5">
                                                Community Member
                                            </p>
                                        </div>
                                        <div className="ml-4 flex-shrink-0 flex items-center bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-4 py-2 rounded-2xl border border-amber-500/30">
                                            <span className="text-amber-400 text-xl mr-2 drop-shadow-sm">⭐</span>
                                            <span className="font-extrabold text-amber-100 text-base sm:text-lg">{user.points} <span className="text-amber-400/80 text-sm font-bold">pts</span></span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* ── Pagination ── */}
                {!loading && totalPages > 1 && (
                    <div className="mt-10 flex justify-center gap-3">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-colors"
                        >
                            Previous
                        </button>
                        <div className="px-6 py-3 bg-slate-800/50 rounded-2xl border border-white/5 text-slate-300 font-semibold flex items-center backdrop-blur-sm">
                            <span className="text-white mx-1">{page}</span> / <span className="ml-1">{totalPages}</span>
                        </div>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 hover:border-white/20 transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
