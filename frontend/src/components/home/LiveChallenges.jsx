'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getMatches } from '@/lib/api';

export default function LiveChallenges() {
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Only fetch on client mount to avoid hydration mismatch and improve TBT
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            const data = await getMatches({ isChallenge: 'true', status: 'upcoming,registration_open', limit: 6 });
            setChallenges(data.matches || []);
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="py-20 px-4 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/10 via-purple-900/10 to-transparent" />

            <div className="relative max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-gaming-purple/20 to-gaming-orange/20 rounded-full border border-gaming-purple/30 mb-4">
                            <span className="w-2 h-2 bg-gaming-orange rounded-full mr-2 live-indicator" />
                            <span className="text-sm font-semibold text-gaming-orange uppercase tracking-wider">Live Challenges</span>
                        </div>
                        <h2 className="hero-title text-3xl sm:text-4xl md:text-5xl">
                            <span className="text-white">PLAYER VS PLAYER </span>
                            <span className="neon-text">CHALLENGES</span>
                        </h2>
                        <p className="text-gray-400 mt-3 max-w-xl">
                            Accept a challenge, defeat your opponent, and win the entire prize pool!
                        </p>
                    </div>
                    <Link
                        href="/matches?isChallenge=true"
                        className="hidden sm:flex items-center text-cyan-400 hover:text-cyan-300 transition-colors font-semibold"
                    >
                        View All Challenges
                        <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 animate-pulse">
                                <div className="h-6 bg-gray-700 rounded w-3/4 mb-4" />
                                <div className="h-4 bg-gray-700 rounded w-1/2 mb-3" />
                                <div className="h-4 bg-gray-700 rounded w-2/3" />
                            </div>
                        ))}
                    </div>
                ) : challenges.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map((challenge, index) => (
                            <Link
                                key={challenge._id}
                                href={`/matches/${challenge._id}`}
                                className="group relative"
                                style={{ animation: `fadeInUp 0.5s ease-out ${index * 0.1}s backwards` }}
                            >
                                <div className="bg-gray-900/60 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 hover:border-cyan-400/50 transition-all duration-300 hover:transform hover:scale-[1.02] hover:shadow-lg hover:shadow-cyan-500/20 will-change-transform translate-z-0">
                                    {/* Challenge Badge */}
                                    <div className="absolute top-0 right-0 bg-gradient-to-r from-gaming-purple to-gaming-orange text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl">
                                        🎯 CHALLENGE
                                    </div>

                                    {/* Header */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-3xl">
                                            {challenge.gameType === 'pubg_mobile' ? '🎯' : challenge.gameType === 'free_fire' ? '🔥' : '🎮'}
                                        </span>
                                        <div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-cyan-400 transition-colors line-clamp-1">
                                                {challenge.title}
                                            </h3>
                                            <p className="text-sm text-gray-400 capitalize">{challenge.gameType?.replace('_', ' ')}</p>
                                        </div>
                                    </div>

                                    {/* Prize & Entry */}
                                    <div className="flex justify-between items-center mb-4 p-3 bg-black/30 rounded-xl">
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 uppercase">Prize Pool</p>
                                            <p className="text-xl font-bold text-gaming-green">₹{challenge.prizePool}</p>
                                        </div>
                                        <div className="w-px h-10 bg-gray-700" />
                                        <div className="text-center">
                                            <p className="text-xs text-gray-400 uppercase">Entry Fee</p>
                                            <p className="text-xl font-bold text-gaming-orange">₹{challenge.entryFee}</p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex justify-between text-sm text-gray-400 mb-4">
                                        <span className="capitalize">{challenge.matchType} • {challenge.mode}</span>
                                        <span>{challenge.filledSlots || challenge.joinedUsers?.length || 0}/{challenge.maxSlots} joined</span>
                                    </div>

                                    {/* CTA */}
                                    <div className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/20 group-hover:border-cyan-400/50 transition-colors">
                                        <span className="text-cyan-400 font-semibold">Accept Challenge</span>
                                        <svg className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                        <div className="text-5xl mb-4">🎯</div>
                        <h3 className="text-xl font-bold text-white mb-2">No Active Challenges</h3>
                        <p className="text-gray-400 mb-6">Be the first to create a challenge and find opponents!</p>
                        <Link
                            href="/create-match"
                            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gaming-purple to-gaming-orange text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                        >
                            Create a Challenge
                            <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </Link>
                    </div>
                )}

                {/* Mobile View All Link */}
                <Link
                    href="/matches?isChallenge=true"
                    className="sm:hidden flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors font-semibold mt-8"
                >
                    View All Challenges
                    <svg className="w-5 h-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}
