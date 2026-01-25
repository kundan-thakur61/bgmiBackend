'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar, Footer } from '@/components/layout';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

export default function TeamsPage() {
    const { user, loading: authLoading } = useAuth();
    const [teams, setTeams] = useState([]);
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', tag: '', description: '', gameType: 'all', maxMembers: 4 });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        } else if (!authLoading) {
            setLoading(false);
        }
    }, [user, authLoading]);

    const fetchData = async () => {
        try {
            const [teamsData, invitesData] = await Promise.all([
                api.getMyTeams(),
                api.getTeamInvites()
            ]);
            setTeams(teamsData.teams || []);
            setInvites(invitesData.invites || []);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        setCreating(true);
        setError('');

        try {
            await api.createTeam(createForm);
            setShowCreateModal(false);
            setCreateForm({ name: '', tag: '', description: '', gameType: 'all', maxMembers: 4 });
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create team');
        } finally {
            setCreating(false);
        }
    };

    const handleAcceptInvite = async (teamId) => {
        try {
            await api.acceptTeamInvite(teamId);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to accept invite');
        }
    };

    const handleDeclineInvite = async (teamId) => {
        try {
            await api.declineTeamInvite(teamId);
            fetchData();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to decline invite');
        }
    };

    if (!user && !authLoading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen pt-20 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-5xl mb-4">👥</div>
                        <h2 className="text-2xl font-bold text-white mb-4">Login Required</h2>
                        <p className="text-gray-400 mb-6">Please login to manage your teams</p>
                        <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold">
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
                <div className="max-w-6xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">My Teams</h1>
                            <p className="text-gray-400">Create and manage your squads</p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2"
                        >
                            <span className="text-xl">+</span>
                            Create Team
                        </button>
                    </div>

                    {/* Pending Invites */}
                    {invites.length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <span className="text-yellow-400">📩</span>
                                Pending Invites
                                <span className="bg-yellow-500 text-black text-xs px-2 py-0.5 rounded-full">{invites.length}</span>
                            </h2>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {invites.map((invite) => (
                                    <div key={invite.teamId} className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-yellow-500/30">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-xl font-bold text-white">
                                                {invite.teamTag?.[0] || 'T'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{invite.teamName}</h3>
                                                <p className="text-sm text-gray-400">[{invite.teamTag}]</p>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-400 mb-4">
                                            <p>Captain: {invite.captain?.name || 'Unknown'}</p>
                                            <p>{invite.memberCount} members • Expires {formatDate(invite.expiresAt)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAcceptInvite(invite.teamId)}
                                                className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDeclineInvite(invite.teamId)}
                                                className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Teams List */}
                    {loading ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-gray-900/50 rounded-xl p-6 border border-gray-800 animate-pulse">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-16 h-16 bg-gray-700 rounded-xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-5 bg-gray-700 rounded w-3/4" />
                                            <div className="h-4 bg-gray-700 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : teams.length === 0 ? (
                        <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800">
                            <div className="text-5xl mb-4">👥</div>
                            <h3 className="text-xl font-bold text-white mb-2">No Teams Yet</h3>
                            <p className="text-gray-400 mb-6">Create your first team or wait for an invite!</p>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold"
                            >
                                Create Your First Team
                            </button>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {teams.map((team) => (
                                <Link
                                    key={team._id}
                                    href={`/teams/${team._id}`}
                                    className="block bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                                >
                                    <div className="flex items-center gap-4 mb-4">
                                        {team.logo?.url ? (
                                            <img src={team.logo.url} alt={team.name} className="w-16 h-16 rounded-xl object-cover" />
                                        ) : (
                                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center text-2xl font-bold text-white">
                                                {team.tag?.[0] || team.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="text-lg font-bold text-white">{team.name}</h3>
                                            <p className="text-cyan-400 font-semibold">[{team.tag}]</p>
                                        </div>
                                    </div>

                                    {/* Team Stats */}
                                    <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-800/50 rounded-lg">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-white">{team.members?.length || 0}</div>
                                            <div className="text-xs text-gray-400">Members</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-green-400">{team.stats?.matchesWon || 0}</div>
                                            <div className="text-xs text-gray-400">Wins</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-yellow-400">₹{team.stats?.totalEarnings || 0}</div>
                                            <div className="text-xs text-gray-400">Earned</div>
                                        </div>
                                    </div>

                                    {/* Role Badge */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs px-3 py-1 rounded-full ${team.captain?._id === user?._id || team.captain === user?._id
                                                ? 'bg-yellow-500/20 text-yellow-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {team.captain?._id === user?._id || team.captain === user?._id ? '👑 Captain' : 'Member'}
                                        </span>
                                        <span className="text-sm text-gray-400 capitalize">{team.gameType?.replace('_', ' ')}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full border border-gray-800">
                        <h2 className="text-2xl font-bold text-white mb-6">Create Team</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="e.g., Phoenix Warriors"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    maxLength={30}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Team Tag (2-5 chars)</label>
                                <input
                                    type="text"
                                    value={createForm.tag}
                                    onChange={(e) => setCreateForm({ ...createForm, tag: e.target.value.toUpperCase() })}
                                    placeholder="e.g., PHX"
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 uppercase"
                                    maxLength={5}
                                    minLength={2}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Description (optional)</label>
                                <textarea
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Tell others about your team..."
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 resize-none"
                                    rows={3}
                                    maxLength={200}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Game</label>
                                    <select
                                        value={createForm.gameType}
                                        onChange={(e) => setCreateForm({ ...createForm, gameType: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value="all">All Games</option>
                                        <option value="pubg_mobile">PUBG Mobile</option>
                                        <option value="free_fire">Free Fire</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Max Members</label>
                                    <select
                                        value={createForm.maxMembers}
                                        onChange={(e) => setCreateForm({ ...createForm, maxMembers: parseInt(e.target.value) })}
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                                    >
                                        <option value={2}>2 (Duo)</option>
                                        <option value={4}>4 (Squad)</option>
                                        <option value={6}>6</option>
                                        <option value={10}>10</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}
