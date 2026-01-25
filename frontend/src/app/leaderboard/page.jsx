'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const TABS = [
    { id: 'global', label: 'All Time', icon: '🏆' },
    { id: 'weekly', label: 'This Week', icon: '📅' },
    { id: 'monthly', label: 'This Month', icon: '📆' },
    { id: 'kills', label: 'Top Kills', icon: '🎯' },
];

const GAME_FILTERS = [
    { id: '', label: 'All Games' },
    { id: 'pubg_mobile', label: 'PUBG Mobile' },
    { id: 'free_fire', label: 'Free Fire' },
];

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('global');
    const [gameFilter, setGameFilter] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [userRank, setUserRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0 });

    useEffect(() => {
        fetchLeaderboard();
    }, [activeTab, gameFilter]);

    const fetchLeaderboard = async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.page,
                limit: pagination.limit,
                ...(gameFilter && { gameType: gameFilter }),
            };

            const data = await api.getLeaderboard(activeTab, params);
            setLeaderboard(data.leaderboard || []);
            setUserRank(data.userRank);
            setPagination(prev => ({ ...prev, total: data.pagination?.total || 0 }));
        } catch (err) {
            console.error('Failed to fetch leaderboard:', err);
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank) => {
        if (rank === 1) return { emoji: '🥇', color: 'from-yellow-400 to-yellow-600', text: 'text-yellow-400' };
        if (rank === 2) return { emoji: '🥈', color: 'from-gray-300 to-gray-500', text: 'text-gray-300' };
        if (rank === 3) return { emoji: '🥉', color: 'from-orange-400 to-orange-600', text: 'text-orange-400' };
        return { emoji: '', color: 'from-cyan-500/20 to-purple-500/20', text: 'text-gray-400' };
    };

    const getLevelBadge = (level) => {
        const levels = {
            bronze: { color: 'bg-orange-900/50 text-orange-400', icon: '🔶' },
            silver: { color: 'bg-gray-700/50 text-gray-300', icon: '⬜' },
            gold: { color: 'bg-yellow-900/50 text-yellow-400', icon: '🔸' },
            platinum: { color: 'bg-cyan-900/50 text-cyan-400', icon: '💎' },
            diamond: { color: 'bg-purple-900/50 text-purple-400', icon: '👑' },
        };
        return levels[level] || levels.bronze;
    };

    return (
        <>
            <Navbar />

            <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="text-white">BATTLE</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">ZONE</span>
                            <span className="text-white"> RANKINGS</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            See how you stack up against the best players
                        </p>
                    </div>

                    {/* User's Rank Card (if logged in) */}
                    {user && userRank && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-2xl border border-cyan-500/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold">
                                        {(user.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{user.name || 'Player'}</h3>
                                        <p className="text-gray-400">Your Current Rank</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                                        #{userRank}
                                    </div>
                                    <p className="text-gray-400 text-sm">{activeTab === 'global' ? 'All Time' : activeTab}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/30'
                                        : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50 hover:text-white'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Game Filter */}
                    <div className="flex gap-2 mb-8">
                        {GAME_FILTERS.map((filter) => (
                            <button
                                key={filter.id}
                                onClick={() => setGameFilter(filter.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${gameFilter === filter.id
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                        : 'bg-gray-800/30 text-gray-400 hover:text-white border border-transparent'
                                    }`}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    {/* Leaderboard Table */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800 overflow-hidden">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-800/50 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-5">Player</div>
                            <div className="col-span-2 text-center">Matches</div>
                            <div className="col-span-2 text-center">Win Rate</div>
                            <div className="col-span-2 text-right">
                                {activeTab === 'kills' ? 'Total Kills' : 'Earnings'}
                            </div>
                        </div>

                        {/* Loading State */}
                        {loading ? (
                            <div className="p-8">
                                {[...Array(10)].map((_, i) => (
                                    <div key={i} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-800 animate-pulse">
                                        <div className="col-span-1">
                                            <div className="h-8 w-8 bg-gray-700 rounded-full mx-auto" />
                                        </div>
                                        <div className="col-span-5 flex items-center gap-3">
                                            <div className="h-10 w-10 bg-gray-700 rounded-full" />
                                            <div className="h-4 w-32 bg-gray-700 rounded" />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="h-4 w-16 bg-gray-700 rounded mx-auto" />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="h-4 w-16 bg-gray-700 rounded mx-auto" />
                                        </div>
                                        <div className="col-span-2">
                                            <div className="h-4 w-20 bg-gray-700 rounded ml-auto" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : leaderboard.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="text-5xl mb-4">🎮</div>
                                <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
                                <p className="text-gray-400">Play matches to appear on the leaderboard!</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-800">
                                {leaderboard.map((entry) => {
                                    const rankBadge = getRankBadge(entry.rank);
                                    const userData = entry.user || entry;
                                    const levelBadge = getLevelBadge(userData.level);

                                    return (
                                        <div
                                            key={entry.rank}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-800/30 transition-colors ${entry.rank <= 3 ? 'bg-gradient-to-r ' + rankBadge.color + ' bg-opacity-10' : ''
                                                }`}
                                        >
                                            {/* Rank */}
                                            <div className="col-span-1 flex items-center justify-center">
                                                {entry.rank <= 3 ? (
                                                    <span className="text-2xl">{rankBadge.emoji}</span>
                                                ) : (
                                                    <span className={`text-lg font-bold ${rankBadge.text}`}>
                                                        #{entry.rank}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Player */}
                                            <div className="col-span-5 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                    {(userData.name || 'U')[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white flex items-center gap-2">
                                                        {userData.name || 'Unknown Player'}
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${levelBadge.color}`}>
                                                            {levelBadge.icon} {userData.level}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Matches */}
                                            <div className="col-span-2 flex items-center justify-center">
                                                <span className="text-gray-300">
                                                    {entry.matchesPlayed || userData.matchesPlayed || 0}
                                                </span>
                                            </div>

                                            {/* Win Rate */}
                                            <div className="col-span-2 flex items-center justify-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-cyan-400 to-green-400"
                                                            style={{ width: `${entry.winRate || 0}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-gray-300 text-sm">
                                                        {entry.winRate || 0}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Earnings/Kills */}
                                            <div className="col-span-2 flex items-center justify-end">
                                                <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400">
                                                    {activeTab === 'kills'
                                                        ? entry.totalKills || 0
                                                        : `₹${(entry.totalEarnings || userData.totalEarnings || 0).toLocaleString()}`
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Load More */}
                    {leaderboard.length > 0 && leaderboard.length < pagination.total && (
                        <div className="text-center mt-8">
                            <button
                                onClick={() => {
                                    setPagination(prev => ({ ...prev, page: prev.page + 1 }));
                                    fetchLeaderboard();
                                }}
                                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
