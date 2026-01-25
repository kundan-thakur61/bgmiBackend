'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const GAME_ICONS = {
    pubg_mobile: '🎯',
    free_fire: '🔥',
    bgmi: '🎮',
};

const STATUS_COLORS = {
    upcoming: 'bg-blue-500/20 text-blue-400',
    registration_open: 'bg-green-500/20 text-green-400',
    live: 'bg-red-500/20 text-red-400',
    completed: 'bg-gray-500/20 text-gray-400',
};

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8 text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading search...</p>
                </div>
            </div>
        }>
            <SearchPageContent />
        </Suspense>
    );
}

function SearchPageContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || '';

    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState({ matches: [], tournaments: [], players: [] });
    const [counts, setCounts] = useState({ matches: 0, tournaments: 0, players: 0, total: 0 });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [searched, setSearched] = useState(false);

    // Debounced search
    useEffect(() => {
        if (initialQuery) {
            handleSearch(initialQuery);
        }
    }, [initialQuery]);

    const handleSearch = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults({ matches: [], tournaments: [], players: [] });
            setCounts({ matches: 0, tournaments: 0, players: 0, total: 0 });
            return;
        }

        setLoading(true);
        setSearched(true);
        try {
            const data = await api.search(searchQuery, activeTab === 'all' ? 'all' : activeTab);
            setResults(data.results || { matches: [], tournaments: [], players: [] });
            setCounts(data.counts || { matches: 0, tournaments: 0, players: 0, total: 0 });
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSearch(query);
    };

    const getLevelBadge = (level) => {
        const levels = {
            bronze: 'bg-orange-900/50 text-orange-400',
            silver: 'bg-gray-700/50 text-gray-300',
            gold: 'bg-yellow-900/50 text-yellow-400',
            platinum: 'bg-cyan-900/50 text-cyan-400',
            diamond: 'bg-purple-900/50 text-purple-400',
        };
        return levels[level] || levels.bronze;
    };

    return (
        <>
            <Navbar />

            <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-4">Search</h1>
                        <p className="text-gray-400">Find matches, tournaments, and players</p>
                    </div>

                    {/* Search Bar */}
                    <form onSubmit={handleSubmit} className="mb-8">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search for matches, tournaments, or players..."
                                className="w-full px-6 py-4 pl-14 bg-gray-900/50 backdrop-blur-xl border border-gray-700 rounded-2xl text-white text-lg focus:outline-none focus:border-cyan-500 transition-colors"
                            />
                            <svg
                                className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <button
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Tabs */}
                    {searched && (
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                            {[
                                { id: 'all', label: 'All', count: counts.total },
                                { id: 'matches', label: 'Matches', count: counts.matches },
                                { id: 'tournaments', label: 'Tournaments', count: counts.tournaments },
                                { id: 'players', label: 'Players', count: counts.players },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setActiveTab(tab.id);
                                        handleSearch(query);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === tab.id
                                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                                        : 'bg-gray-800/30 text-gray-400 hover:text-white border border-transparent'
                                        }`}
                                >
                                    {tab.label}
                                    <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">{tab.count}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Results */}
                    {loading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-700 rounded-lg" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 w-3/4 bg-gray-700 rounded" />
                                            <div className="h-4 w-1/2 bg-gray-700 rounded" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : !searched ? (
                        <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                            <div className="text-5xl mb-4">🔍</div>
                            <h3 className="text-xl font-bold text-white mb-2">Start Searching</h3>
                            <p className="text-gray-400">Enter at least 2 characters to search</p>
                        </div>
                    ) : counts.total === 0 ? (
                        <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                            <div className="text-5xl mb-4">😕</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
                            <p className="text-gray-400">Try a different search term</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Matches */}
                            {(activeTab === 'all' || activeTab === 'matches') && results.matches?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        🎮 Matches
                                        <span className="text-sm text-gray-400 font-normal">({results.matches.length})</span>
                                    </h2>
                                    <div className="space-y-3">
                                        {results.matches.map((match) => (
                                            <Link
                                                key={match._id}
                                                href={`/matches/${match._id}`}
                                                className="block bg-gray-900/50 backdrop-blur-xl rounded-xl p-5 border border-gray-800 hover:border-cyan-500/30 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl">{GAME_ICONS[match.gameType] || '🎮'}</span>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-white">{match.title}</h3>
                                                            {match.isChallenge && (
                                                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Challenge</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                                            <span className="capitalize">{match.gameType?.replace('_', ' ')}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{match.matchType}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(match.scheduledAt)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-bold">₹{match.prizePool}</div>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[match.status]}`}>
                                                            {match.status?.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tournaments */}
                            {(activeTab === 'all' || activeTab === 'tournaments') && results.tournaments?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        🏆 Tournaments
                                        <span className="text-sm text-gray-400 font-normal">({results.tournaments.length})</span>
                                    </h2>
                                    <div className="space-y-3">
                                        {results.tournaments.map((tournament) => (
                                            <Link
                                                key={tournament._id}
                                                href={`/tournaments/${tournament._id}`}
                                                className="block bg-gray-900/50 backdrop-blur-xl rounded-xl p-5 border border-gray-800 hover:border-cyan-500/30 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="text-3xl">🏆</span>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-white mb-1">{tournament.title}</h3>
                                                        <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                                                            <span className="capitalize">{tournament.gameType?.replace('_', ' ')}</span>
                                                            <span>•</span>
                                                            <span className="capitalize">{tournament.format?.replace('_', ' ')}</span>
                                                            <span>•</span>
                                                            <span>{formatDate(tournament.startAt)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-green-400 font-bold">₹{tournament.prizePool}</div>
                                                        <div className="text-sm text-gray-400">
                                                            {tournament.registeredTeams}/{tournament.maxTeams} teams
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Players */}
                            {(activeTab === 'all' || activeTab === 'players') && results.players?.length > 0 && (
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        👤 Players
                                        <span className="text-sm text-gray-400 font-normal">({results.players.length})</span>
                                    </h2>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        {results.players.map((player) => (
                                            <div
                                                key={player._id}
                                                className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-5 border border-gray-800"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                        {(player.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-bold text-white">{player.name}</h3>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getLevelBadge(player.level)}`}>
                                                                {player.level}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-4 text-sm text-gray-400">
                                                            <span>{player.matchesPlayed || 0} matches</span>
                                                            <span className="text-green-400">₹{player.totalEarnings || 0} earned</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
