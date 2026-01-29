'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

const CATEGORY_LABELS = {
    matches: { name: 'Matches', icon: '🎮', color: 'from-blue-500 to-cyan-500' },
    kills: { name: 'Combat', icon: '🎯', color: 'from-red-500 to-orange-500' },
    earnings: { name: 'Earnings', icon: '💰', color: 'from-green-500 to-emerald-500' },
    social: { name: 'Social', icon: '🤝', color: 'from-purple-500 to-pink-500' },
    special: { name: 'Special', icon: '⭐', color: 'from-yellow-500 to-amber-500' },
};

const RARITY_COLORS = {
    common: 'border-gray-500 bg-gray-500/10',
    uncommon: 'border-green-500 bg-green-500/10',
    rare: 'border-blue-500 bg-blue-500/10',
    epic: 'border-purple-500 bg-purple-500/10',
    legendary: 'border-yellow-500 bg-yellow-500/10',
};

export default function AchievementsPage() {
    const { user, loading: authLoading } = useAuth();
    const [achievements, setAchievements] = useState({});
    const [summary, setSummary] = useState({ total: 0, unlocked: 0, totalXpEarned: 0 });
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('all');
    const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

    useEffect(() => {
        if (!authLoading) {
            fetchAchievements();
        }
    }, [authLoading, user]);

    const fetchAchievements = async () => {
        try {
            if (user) {
                const data = await api.getUserAchievements();
                setAchievements(data.achievements || {});
                setSummary(data.summary || { total: 0, unlocked: 0, totalXpEarned: 0 });
            } else {
                const data = await api.getAchievements();
                // Group by category for non-logged in users
                const grouped = (data.achievements || []).reduce((acc, ach) => {
                    if (!acc[ach.category]) acc[ach.category] = [];
                    acc[ach.category].push({ ...ach, isUnlocked: false, progress: 0, progressPercent: 0 });
                    return acc;
                }, {});
                setAchievements(grouped);
                setSummary({ total: data.achievements?.length || 0, unlocked: 0, totalXpEarned: 0 });
            }
        } catch (err) {
            console.error('Failed to fetch achievements:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAchievements = () => {
        let filtered = achievements;

        if (activeCategory !== 'all') {
            filtered = { [activeCategory]: achievements[activeCategory] || [] };
        }

        if (showUnlockedOnly) {
            filtered = Object.entries(filtered).reduce((acc, [category, achs]) => {
                const unlocked = achs.filter(a => a.isUnlocked);
                if (unlocked.length > 0) acc[category] = unlocked;
                return acc;
            }, {});
        }

        return filtered;
    };

    const filteredAchievements = getFilteredAchievements();

    return (
        <>
            <Navbar />

            <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                            <span className="text-white">YOUR </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">ACHIEVEMENTS</span>
                        </h1>
                        <p className="text-gray-400 text-lg">
                            Complete challenges to earn XP and unlock exclusive badges
                        </p>
                    </div>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 text-center">
                            <div className="text-4xl font-bold text-cyan-400">{summary.unlocked}</div>
                            <div className="text-gray-400">Unlocked</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 text-center">
                            <div className="text-4xl font-bold text-purple-400">{summary.total}</div>
                            <div className="text-gray-400">Total</div>
                        </div>
                        <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 text-center">
                            <div className="text-4xl font-bold text-yellow-400">{summary.totalXpEarned}</div>
                            <div className="text-gray-400">XP Earned</div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setActiveCategory('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeCategory === 'all'
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                        : 'bg-gray-800/50 text-gray-400 hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            {Object.entries(CATEGORY_LABELS).map(([key, { name, icon }]) => (
                                <button
                                    key={key}
                                    onClick={() => setActiveCategory(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeCategory === key
                                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                                            : 'bg-gray-800/50 text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <span>{icon}</span>
                                    <span>{name}</span>
                                </button>
                            ))}
                        </div>

                        {user && (
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showUnlockedOnly}
                                    onChange={(e) => setShowUnlockedOnly(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-cyan-500 focus:ring-cyan-500"
                                />
                                <span className="text-gray-400 text-sm">Show unlocked only</span>
                            </label>
                        )}
                    </div>

                    {/* Login prompt for guests */}
                    {!user && !authLoading && (
                        <div className="mb-8 p-6 bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-xl border border-cyan-500/30 text-center">
                            <p className="text-gray-300 mb-4">Login to track your progress and unlock achievements!</p>
                            <Link href="/login" className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold">
                                Login Now
                            </Link>
                        </div>
                    )}

                    {/* Achievements Grid */}
                    {loading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 animate-pulse">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gray-700 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 bg-gray-700 rounded w-3/4" />
                                            <div className="h-4 bg-gray-700 rounded w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : Object.keys(filteredAchievements).length === 0 ? (
                        <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                            <div className="text-5xl mb-4">🏆</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Achievements Found</h3>
                            <p className="text-gray-400">
                                {showUnlockedOnly ? "You haven't unlocked any achievements yet." : "No achievements in this category."}
                            </p>
                        </div>
                    ) : (
                        Object.entries(filteredAchievements).map(([category, categoryAchievements]) => (
                            <div key={category} className="mb-8">
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <span className="text-2xl">{CATEGORY_LABELS[category]?.icon || '🏆'}</span>
                                    <h2 className="text-xl font-bold text-white">{CATEGORY_LABELS[category]?.name || category}</h2>
                                    <span className="text-gray-400 text-sm">
                                        ({categoryAchievements.filter(a => a.isUnlocked).length}/{categoryAchievements.length})
                                    </span>
                                </div>

                                {/* Achievement Cards */}
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {categoryAchievements.map((achievement) => (
                                        <div
                                            key={achievement._id || achievement.code}
                                            className={`relative bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border-2 transition-all ${achievement.isUnlocked
                                                    ? RARITY_COLORS[achievement.rarity] || RARITY_COLORS.common
                                                    : 'border-gray-800 opacity-70'
                                                } ${achievement.isUnlocked ? 'hover:scale-[1.02]' : ''}`}
                                        >
                                            {/* Unlocked Badge */}
                                            {achievement.isUnlocked && (
                                                <div className="absolute top-2 right-2">
                                                    <span className="text-green-400 text-xl">✓</span>
                                                </div>
                                            )}

                                            <div className="flex items-start gap-4">
                                                {/* Icon */}
                                                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${achievement.isUnlocked
                                                        ? `bg-gradient-to-br ${CATEGORY_LABELS[category]?.color || 'from-gray-500 to-gray-600'}`
                                                        : 'bg-gray-800'
                                                    }`}>
                                                    {achievement.icon || '🏆'}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-white mb-1">{achievement.name}</h3>
                                                    <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>

                                                    {/* Rewards */}
                                                    {achievement.xpReward > 0 && (
                                                        <span className="text-xs text-yellow-400">+{achievement.xpReward} XP</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Progress Bar (for in-progress achievements) */}
                                            {user && !achievement.isUnlocked && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                                                        <span>Progress</span>
                                                        <span>{achievement.progress || 0}/{achievement.requirementValue}</span>
                                                    </div>
                                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full bg-gradient-to-r ${CATEGORY_LABELS[category]?.color || 'from-cyan-500 to-purple-500'}`}
                                                            style={{ width: `${achievement.progressPercent || 0}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rarity Badge */}
                                            <div className="mt-3">
                                                <span className={`text-xs px-2 py-1 rounded-full capitalize ${achievement.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' :
                                                        achievement.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' :
                                                            achievement.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' :
                                                                achievement.rarity === 'uncommon' ? 'bg-green-500/20 text-green-400' :
                                                                    'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {achievement.rarity}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
