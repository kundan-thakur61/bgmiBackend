'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

const STATUS_COLORS = {
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    live: 'bg-red-500/20 text-red-400 border-red-500/30',
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    result_pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

const GAME_ICONS = {
    pubg_mobile: '🎯',
    free_fire: '🔥',
    bgmi: '🎮',
};

export default function MatchHistoryPage() {
    const { user, loading: authLoading } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

    useEffect(() => {
        if (!authLoading && user) {
            fetchMatchHistory();
        }
    }, [user, authLoading, filter, pagination.page]);

    const fetchMatchHistory = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(filter !== 'all' && { status: filter }),
            };
            const data = await api.getMatchHistory(params);
            setMatches(data.matches || []);
            setPagination(prev => ({
                ...prev,
                total: data.pagination?.total || 0,
                pages: data.pagination?.pages || 0,
            }));
        } catch (err) {
            console.error('Failed to fetch match history:', err);
        } finally {
            setLoading(false);
        }
    };

    const getPositionBadge = (position) => {
        if (!position) return null;
        if (position === 1) return { icon: '🥇', text: '1st', color: 'text-yellow-400' };
        if (position === 2) return { icon: '🥈', text: '2nd', color: 'text-gray-300' };
        if (position === 3) return { icon: '🥉', text: '3rd', color: 'text-orange-400' };
        return { icon: '', text: `#${position}`, color: 'text-gray-400' };
    };

    const calculateTotalStats = () => {
        const completed = matches.filter(m => m.status === 'completed');
        return {
            totalMatches: completed.length,
            totalKills: completed.reduce((sum, m) => sum + (m.userResult?.kills || 0), 0),
            totalWinnings: completed.reduce((sum, m) => sum + (m.userResult?.prizeWon || 0), 0),
            wins: completed.filter(m => m.userResult?.position === 1).length,
        };
    };

    if (authLoading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="text-xl text-gray-400">Loading...</div>
                </main>
                <Footer />
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
                        <p className="text-gray-400 mb-6">Please login to view your match history</p>
                        <Link href="/login" className="btn-primary px-6 py-3">
                            Login
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    const stats = calculateTotalStats();

    return (
        <>
            <Navbar />

            <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Match History</h1>
                            <p className="text-gray-400">Track all your matches and results</p>
                        </div>
                        <Link
                            href="/profile"
                            className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            ← Back to Profile
                        </Link>
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800">
                            <div className="text-3xl font-bold text-cyan-400">{stats.totalMatches}</div>
                            <div className="text-sm text-gray-400">Matches Played</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800">
                            <div className="text-3xl font-bold text-green-400">{stats.wins}</div>
                            <div className="text-sm text-gray-400">Wins</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800">
                            <div className="text-3xl font-bold text-orange-400">{stats.totalKills}</div>
                            <div className="text-sm text-gray-400">Total Kills</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-4 border border-gray-800">
                            <div className="text-3xl font-bold text-purple-400">₹{stats.totalWinnings}</div>
                            <div className="text-sm text-gray-400">Total Winnings</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                        {['all', 'completed', 'live', 'upcoming', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setFilter(status);
                                    setPagination(prev => ({ ...prev, page: 1 }));
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-all ${filter === status
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                        : 'bg-gray-800/30 text-gray-400 hover:text-white border border-transparent'
                                    }`}
                            >
                                {status === 'all' ? 'All Matches' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {/* Matches List */}
                    <div className="space-y-4">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 animate-pulse">
                                    <div className="flex justify-between">
                                        <div className="space-y-2">
                                            <div className="h-5 w-48 bg-gray-700 rounded" />
                                            <div className="h-4 w-32 bg-gray-700 rounded" />
                                        </div>
                                        <div className="h-8 w-24 bg-gray-700 rounded" />
                                    </div>
                                </div>
                            ))
                        ) : matches.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                                <div className="text-5xl mb-4">🎮</div>
                                <h3 className="text-xl font-bold text-white mb-2">No Matches Found</h3>
                                <p className="text-gray-400 mb-6">
                                    {filter === 'all'
                                        ? "You haven't played any matches yet"
                                        : `No ${filter.replace('_', ' ')} matches found`}
                                </p>
                                <Link
                                    href="/matches"
                                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-lg"
                                >
                                    Browse Matches
                                </Link>
                            </div>
                        ) : (
                            matches.map((match) => {
                                const positionBadge = getPositionBadge(match.userResult?.position);
                                const statusColor = STATUS_COLORS[match.status] || STATUS_COLORS.upcoming;

                                return (
                                    <Link
                                        key={match._id}
                                        href={`/matches/${match._id}`}
                                        className="block bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 hover:border-cyan-500/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                                    >
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            {/* Match Info */}
                                            <div className="flex items-start gap-4">
                                                <div className="text-3xl">
                                                    {GAME_ICONS[match.gameType] || '🎮'}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white mb-1">{match.title}</h3>
                                                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                                                        <span className="capitalize">{match.gameType?.replace('_', ' ')}</span>
                                                        <span>•</span>
                                                        <span className="capitalize">{match.matchType}</span>
                                                        <span>•</span>
                                                        <span>{formatDate(match.scheduledAt)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Results & Status */}
                                            <div className="flex items-center gap-4">
                                                {match.userResult && match.status === 'completed' && (
                                                    <div className="flex items-center gap-4 px-4 py-2 bg-gray-800/50 rounded-lg">
                                                        {positionBadge && (
                                                            <div className={`text-lg font-bold ${positionBadge.color}`}>
                                                                {positionBadge.icon} {positionBadge.text}
                                                            </div>
                                                        )}
                                                        <div className="text-center">
                                                            <div className="text-sm text-gray-400">Kills</div>
                                                            <div className="text-lg font-bold text-orange-400">
                                                                {match.userResult.kills || 0}
                                                            </div>
                                                        </div>
                                                        <div className="text-center">
                                                            <div className="text-sm text-gray-400">Won</div>
                                                            <div className="text-lg font-bold text-green-400">
                                                                ₹{match.userResult.prizeWon || 0}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColor}`}>
                                                    {match.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Entry Fee & Prize Pool */}
                                        <div className="flex gap-6 mt-4 pt-4 border-t border-gray-800">
                                            <div>
                                                <span className="text-sm text-gray-400">Entry Fee</span>
                                                <div className="text-lg font-semibold text-orange-400">₹{match.entryFee}</div>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-400">Prize Pool</span>
                                                <div className="text-lg font-semibold text-green-400">₹{match.prizePool}</div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-400">
                                Page {pagination.page} of {pagination.pages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
