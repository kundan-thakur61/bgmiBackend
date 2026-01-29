'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export default function ReferralsPage() {
    const { user, loading: authLoading } = useAuth();
    const [referralData, setReferralData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!authLoading && user) {
            fetchReferralData();
        }
    }, [user, authLoading]);

    const fetchReferralData = async () => {
        try {
            const data = await api.getReferralStats();
            setReferralData(data.referral);
        } catch (err) {
            console.error('Failed to fetch referral data:', err);
        } finally {
            setLoading(false);
        }
    };

    const copyReferralCode = () => {
        if (referralData?.code) {
            navigator.clipboard.writeText(referralData.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const copyReferralLink = () => {
        if (referralData?.code) {
            const link = `${window.location.origin}/register?ref=${referralData.code}`;
            navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const shareOnWhatsApp = () => {
        const link = `${window.location.origin}/register?ref=${referralData.code}`;
        const message = `🎮 Join me on BattleZone and get ₹50 bonus! Use my referral code: ${referralData.code}\n\n${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const shareOnTelegram = () => {
        const link = `${window.location.origin}/register?ref=${referralData.code}`;
        const message = `🎮 Join me on BattleZone and get ₹50 bonus! Use my referral code: ${referralData.code}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`, '_blank');
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
                        <p className="text-gray-400 mb-6">Please login to view your referrals</p>
                        <Link href="/login" className="btn-primary px-6 py-3">
                            Login
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold mb-4">
                            <span className="text-white">REFER & </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">EARN</span>
                        </h1>
                        <p className="text-gray-400 text-lg max-w-xl mx-auto">
                            Invite your friends to BattleZone and earn ₹50 for each friend who plays their first match!
                        </p>
                    </div>

                    {loading ? (
                        <div className="space-y-6 animate-pulse">
                            <div className="h-48 bg-gray-800 rounded-2xl" />
                            <div className="h-32 bg-gray-800 rounded-2xl" />
                        </div>
                    ) : referralData ? (
                        <>
                            {/* Referral Code Card */}
                            <div className="bg-gradient-to-r from-cyan-900/30 to-purple-900/30 rounded-2xl p-8 border border-cyan-500/30 mb-8">
                                <div className="text-center mb-6">
                                    <h2 className="text-lg text-gray-400 mb-2">Your Referral Code</h2>
                                    <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-widest">
                                        {referralData.code}
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center gap-4">
                                    <button
                                        onClick={copyReferralCode}
                                        className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                                    >
                                        {copied ? '✓ Copied!' : '📋 Copy Code'}
                                    </button>
                                    <button
                                        onClick={copyReferralLink}
                                        className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                                    >
                                        🔗 Copy Link
                                    </button>
                                </div>

                                {/* Share Buttons */}
                                <div className="flex justify-center gap-4 mt-6">
                                    <button
                                        onClick={shareOnWhatsApp}
                                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                                    >
                                        <span className="text-xl">📱</span> WhatsApp
                                    </button>
                                    <button
                                        onClick={shareOnTelegram}
                                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2"
                                    >
                                        <span className="text-xl">✈️</span> Telegram
                                    </button>
                                </div>
                            </div>

                            {/* Stats Cards */}
                            <div className="grid md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 text-center">
                                    <div className="text-4xl font-bold text-cyan-400 mb-2">
                                        {referralData.totalReferrals || 0}
                                    </div>
                                    <div className="text-gray-400">Friends Invited</div>
                                </div>
                                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 text-center">
                                    <div className="text-4xl font-bold text-green-400 mb-2">
                                        ₹{referralData.totalEarnings || 0}
                                    </div>
                                    <div className="text-gray-400">Total Earned</div>
                                </div>
                                <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 text-center">
                                    <div className="text-4xl font-bold text-purple-400 mb-2">₹50</div>
                                    <div className="text-gray-400">Per Referral</div>
                                </div>
                            </div>

                            {/* How It Works */}
                            <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 mb-8">
                                <h2 className="text-2xl font-bold text-white mb-6 text-center">How It Works</h2>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                                            1
                                        </div>
                                        <h3 className="font-bold text-white mb-2">Share Your Code</h3>
                                        <p className="text-gray-400 text-sm">Send your referral code to friends</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                                            2
                                        </div>
                                        <h3 className="font-bold text-white mb-2">Friend Signs Up</h3>
                                        <p className="text-gray-400 text-sm">They register using your code</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white">
                                            3
                                        </div>
                                        <h3 className="font-bold text-white mb-2">Both Get Rewarded</h3>
                                        <p className="text-gray-400 text-sm">You get ₹50, they get ₹25 bonus!</p>
                                    </div>
                                </div>
                            </div>

                            {/* Referred Users */}
                            {referralData.referredUsers && referralData.referredUsers.length > 0 && (
                                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800">
                                    <h2 className="text-2xl font-bold text-white mb-6">Your Referrals</h2>
                                    <div className="space-y-4">
                                        {referralData.referredUsers.map((referredUser, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {(referredUser.name || 'U')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-white">{referredUser.name || 'Player'}</div>
                                                        <div className="text-sm text-gray-400">
                                                            Joined {formatDate(referredUser.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm text-gray-400">Matches</div>
                                                    <div className="font-bold text-cyan-400">{referredUser.matchesPlayed || 0}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Earnings */}
                            {referralData.recentEarnings && referralData.recentEarnings.length > 0 && (
                                <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 mt-8">
                                    <h2 className="text-2xl font-bold text-white mb-6">Recent Earnings</h2>
                                    <div className="space-y-3">
                                        {referralData.recentEarnings.map((earning, index) => (
                                            <div key={index} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-green-400 text-xl">💰</span>
                                                    <div>
                                                        <div className="text-white">{earning.description}</div>
                                                        <div className="text-sm text-gray-400">{formatDate(earning.createdAt)}</div>
                                                    </div>
                                                </div>
                                                <div className="text-lg font-bold text-green-400">+₹{earning.amount}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-16">
                            <p className="text-gray-400">Failed to load referral data</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
