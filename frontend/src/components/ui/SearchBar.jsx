'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function SearchBar({ className = '' }) {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ matches: [], tournaments: [], players: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (searchQuery) => {
        if (!searchQuery || searchQuery.length < 2) {
            setResults({ matches: [], tournaments: [], players: [] });
            setIsOpen(false);
            return;
        }

        setLoading(true);
        try {
            const data = await api.search(searchQuery, 'all');
            setResults(data.results || { matches: [], tournaments: [], players: [] });
            setIsOpen(true);
        } catch (err) {
            console.error('Search failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const debouncedSearch = (value) => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }
        debounceRef.current = setTimeout(() => {
            handleSearch(value);
        }, 300);
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        debouncedSearch(value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.length >= 2) {
            setIsOpen(false);
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    const handleResultClick = () => {
        setIsOpen(false);
        setQuery('');
    };

    const hasResults = results.matches?.length > 0 || results.tournaments?.length > 0 || results.players?.length > 0;

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <form onSubmit={handleSubmit}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                        placeholder="Search..."
                        className="w-full px-4 py-2 pl-10 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                    <svg
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {loading && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                </div>
            </form>

            {/* Dropdown Results */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                    {!hasResults ? (
                        <div className="p-4 text-center text-gray-400">
                            No results found
                        </div>
                    ) : (
                        <>
                            {/* Matches */}
                            {results.matches?.slice(0, 3).map((match) => (
                                <Link
                                    key={match._id}
                                    href={`/matches/${match._id}`}
                                    onClick={handleResultClick}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800"
                                >
                                    <span className="text-xl">🎮</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">{match.title}</div>
                                        <div className="text-xs text-gray-400 capitalize">{match.gameType?.replace('_', ' ')} • {match.matchType}</div>
                                    </div>
                                    <span className="text-green-400 text-sm font-medium">₹{match.prizePool}</span>
                                </Link>
                            ))}

                            {/* Tournaments */}
                            {results.tournaments?.slice(0, 3).map((tournament) => (
                                <Link
                                    key={tournament._id}
                                    href={`/tournaments/${tournament._id}`}
                                    onClick={handleResultClick}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800"
                                >
                                    <span className="text-xl">🏆</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">{tournament.title}</div>
                                        <div className="text-xs text-gray-400 capitalize">{tournament.format?.replace('_', ' ')}</div>
                                    </div>
                                    <span className="text-green-400 text-sm font-medium">₹{tournament.prizePool}</span>
                                </Link>
                            ))}

                            {/* Players */}
                            {results.players?.slice(0, 3).map((player) => (
                                <div
                                    key={player._id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {(player.name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-white font-medium truncate">{player.name}</div>
                                        <div className="text-xs text-gray-400 capitalize">{player.level}</div>
                                    </div>
                                </div>
                            ))}

                            {/* View All */}
                            <Link
                                href={`/search?q=${encodeURIComponent(query)}`}
                                onClick={handleResultClick}
                                className="block px-4 py-3 text-center text-cyan-400 hover:bg-gray-800 transition-colors font-medium"
                            >
                                View all results →
                            </Link>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
