'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const [team, setTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showShareModal, setShowShareModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchTeam();
    }, [params.id]);

    const fetchTeam = async () => {
        try {
            const data = await api.getTeam(params.id);
            setTeam(data.team);
        } catch (err) {
            console.error('Failed to fetch team:', err);
        } finally {
            setLoading(false);
        }
    };

    const isCaptain = team?.captain?._id === user?._id;
    const isMember = team?.members?.some(m => m.user?._id === user?._id);

    const getInviteLink = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/teams/join/${params.id}`;
        }
        return '';
    };

    const copyInviteLink = () => {
        const link = getInviteLink();
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareOnWhatsApp = () => {
        const link = getInviteLink();
        const message = `🎮 Join my team "${team.name}" [${team.tag}] on BattleZone!\n\n${link}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const shareOnTelegram = () => {
        const link = getInviteLink();
        const message = `🎮 Join my team "${team.name}" [${team.tag}] on BattleZone!`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(message)}`, '_blank');
    };

    const shareNative = async () => {
        const link = getInviteLink();
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join Team ${team.name}`,
                    text: `Join my team "${team.name}" [${team.tag}] on BattleZone!`,
                    url: link,
                });
            } catch (err) {
                // User cancelled or error
            }
        }
    };

    const handleRemoveMember = async (userId) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        setActionLoading(true);
        try {
            await api.removeTeamMember(params.id, userId);
            fetchTeam();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to remove member');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLeaveTeam = async () => {
        if (!confirm('Are you sure you want to leave this team?')) return;
        setActionLoading(true);
        try {
            await api.leaveTeam(params.id);
            router.push('/teams');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to leave team');
            setActionLoading(false);
        }
    };

    const handleDisbandTeam = async () => {
        if (!confirm('Are you sure you want to disband this team? This cannot be undone.')) return;
        setActionLoading(true);
        try {
            await api.disbandTeam(params.id);
            router.push('/teams');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to disband team');
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900">
                    <div className="max-w-4xl mx-auto px-4 py-8">
                        <div className="animate-pulse space-y-6">
                            <div className="h-32 bg-gray-800 rounded-2xl" />
                            <div className="h-48 bg-gray-800 rounded-2xl" />
                        </div>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    if (!team) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Team Not Found</h2>
                        <Link href="/teams" className="text-cyan-400 hover:underline">
                            ← Back to Teams
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
                    {/* Back Link */}
                    <Link href="/teams" className="inline-flex items-center text-gray-400 hover:text-white mb-6">
                        ← Back to Teams
                    </Link>

                    {/* Team Header */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-8 border border-gray-800 mb-8">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            {/* Logo */}
                            {team.logo?.url ? (
                                <img src={team.logo.url} alt={team.name} className="w-24 h-24 rounded-2xl object-cover" />
                            ) : (
                                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-2xl flex items-center justify-center text-4xl font-bold text-white">
                                    {team.tag?.[0] || team.name[0]}
                                </div>
                            )}

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-bold text-white">{team.name}</h1>
                                    <span className="text-xl text-cyan-400 font-semibold">[{team.tag}]</span>
                                </div>
                                {team.description && (
                                    <p className="text-gray-400 mb-4">{team.description}</p>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm">
                                    <span className="text-gray-400">
                                        Captain: <span className="text-white">{team.captain?.name || 'Unknown'}</span>
                                    </span>
                                    <span className="text-gray-400">
                                        Game: <span className="text-white capitalize">{team.gameType?.replace('_', ' ')}</span>
                                    </span>
                                    <span className="text-gray-400">
                                        Members: <span className="text-white">{team.members?.length || 0}/{team.maxMembers}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                {isCaptain && (
                                    <button
                                        onClick={() => setShowShareModal(true)}
                                        className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold flex items-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                        </svg>
                                        Share Invite Link
                                    </button>
                                )}
                                {isMember && !isCaptain && (
                                    <button
                                        onClick={handleLeaveTeam}
                                        disabled={actionLoading}
                                        className="px-6 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded-lg font-semibold hover:bg-red-500/30"
                                    >
                                        Leave Team
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Team Stats */}
                        <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-800">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-cyan-400">{team.stats?.matchesPlayed || 0}</div>
                                <div className="text-sm text-gray-400">Matches</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-400">{team.stats?.matchesWon || 0}</div>
                                <div className="text-sm text-gray-400">Wins</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-400">{team.stats?.totalKills || 0}</div>
                                <div className="text-sm text-gray-400">Total Kills</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-400">₹{team.stats?.totalEarnings || 0}</div>
                                <div className="text-sm text-gray-400">Earnings</div>
                            </div>
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="bg-gray-900/50 backdrop-blur-xl rounded-2xl p-6 border border-gray-800 mb-8">
                        <h2 className="text-xl font-bold text-white mb-6">Team Members</h2>
                        <div className="space-y-4">
                            {team.members?.map((member) => (
                                <div key={member.user?._id} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {(member.user?.name || 'U')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-white flex items-center gap-2">
                                                {member.user?.name || 'Unknown'}
                                                {member.role === 'captain' && (
                                                    <span className="text-yellow-400 text-sm">👑 Captain</span>
                                                )}
                                                {member.role === 'co-captain' && (
                                                    <span className="text-purple-400 text-sm">⭐ Co-Captain</span>
                                                )}
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {member.user?.level && (
                                                    <span className="capitalize">{member.user.level}</span>
                                                )}
                                                <span className="mx-2">•</span>
                                                Joined {formatDate(member.joinedAt)}
                                            </div>
                                        </div>
                                    </div>

                                    {isCaptain && member.user?._id !== user?._id && (
                                        <button
                                            onClick={() => handleRemoveMember(member.user?._id)}
                                            disabled={actionLoading}
                                            className="px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Danger Zone (Captain only) */}
                    {isCaptain && (
                        <div className="bg-red-900/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
                            <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
                            <p className="text-gray-400 mb-4">Once you disband the team, there is no going back.</p>
                            <button
                                onClick={handleDisbandTeam}
                                disabled={actionLoading}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                            >
                                Disband Team
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Share Link Modal */}
            {showShareModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800">
                        <h2 className="text-2xl font-bold text-white mb-2">Share Team Invite</h2>
                        <p className="text-gray-400 mb-6">Share this link with friends to invite them to your team</p>

                        {/* Invite Link */}
                        <div className="mb-6">
                            <label className="block text-sm text-gray-400 mb-2">Invite Link</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={getInviteLink()}
                                    readOnly
                                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm"
                                />
                                <button
                                    onClick={copyInviteLink}
                                    className={`px-4 py-3 rounded-lg font-semibold transition-all ${copied
                                            ? 'bg-green-500 text-white'
                                            : 'bg-cyan-500 text-white hover:bg-cyan-600'
                                        }`}
                                >
                                    {copied ? '✓ Copied!' : 'Copy'}
                                </button>
                            </div>
                        </div>

                        {/* Share Buttons */}
                        <div className="space-y-3 mb-6">
                            <button
                                onClick={shareOnWhatsApp}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                                Share on WhatsApp
                            </button>

                            <button
                                onClick={shareOnTelegram}
                                className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-3"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                                </svg>
                                Share on Telegram
                            </button>

                            {typeof navigator !== 'undefined' && navigator.share && (
                                <button
                                    onClick={shareNative}
                                    className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-3"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    More Options
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setShowShareModal(false)}
                            className="w-full py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
