'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states for each tab
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Modal states
  const [showModal, setShowModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin' && user?.role !== 'match_manager') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'admin' || user?.role === 'match_manager')) {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTabData(activeTab);
    }
  }, [activeTab, isAuthenticated]);

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats');
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'matches':
          const matchData = await api.getMatches({ limit: 50 });
          setMatches(matchData.matches || []);
          break;
        case 'tournaments':
          const tournamentData = await api.getTournaments({ limit: 50, status: 'upcoming,registration_open,ongoing,completed' });
          setTournaments(tournamentData.tournaments || []);
          break;
        case 'users':
          const userData = await api.getAdminUsers({ limit: 50 });
          setUsers(userData.users || []);
          break;
        case 'withdrawals':
          const withdrawalData = await api.getPendingWithdrawals();
          setWithdrawals(withdrawalData.withdrawals || []);
          break;
        case 'kyc':
          const kycData = await api.getPendingKYC();
          setKycRequests(kycData.kycs || []);
          break;
        case 'tickets':
          const ticketData = await api.getAllTickets({ limit: 50 });
          setTickets(ticketData.tickets || []);
          break;
        case 'announcements':
          const announcementData = await api.getAnnouncements();
          setAnnouncements(announcementData.announcements || []);
          break;
      }
    } catch (err) {
      console.error(`Failed to load ${tab} data:`, err);
    }
  };

  const handleAction = async (action, item) => {
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      switch (action) {
        // Match actions
        case 'startMatch':
          await api.startMatch(item._id);
          setSuccess('Match started successfully');
          loadTabData('matches');
          break;
        case 'cancelMatch':
          await api.cancelMatch(item._id, formData.reason);
          setSuccess('Match cancelled');
          setShowModal(null);
          loadTabData('matches');
          break;
        case 'setRoomCredentials':
        case 'roomCredentials':
          await api.setRoomCredentials(selectedItem._id, formData.roomId, formData.password);
          setSuccess('Room credentials set');
          setShowModal(null);
          loadTabData('matches');
          break;

        // Withdrawal actions
        case 'approveWithdrawal':
          await api.approveWithdrawal(item._id);
          setSuccess('Withdrawal approved');
          loadTabData('withdrawals');
          break;
        case 'rejectWithdrawal':
          await api.rejectWithdrawal(item._id, formData.reason);
          setSuccess('Withdrawal rejected');
          setShowModal(null);
          loadTabData('withdrawals');
          break;

        // KYC actions
        case 'approveKYC':
          await api.approveKYC(item._id);
          setSuccess('KYC approved');
          loadTabData('kyc');
          break;
        case 'rejectKYC':
          await api.rejectKYC(item._id, formData.reason);
          setSuccess('KYC rejected');
          setShowModal(null);
          loadTabData('kyc');
          break;

        // User actions
        case 'banUser':
          await api.banUser(item._id, formData.reason);
          setSuccess('User banned');
          setShowModal(null);
          loadTabData('users');
          break;
        case 'unbanUser':
          await api.unbanUser(item._id);
          setSuccess('User unbanned');
          loadTabData('users');
          break;

        // Ticket actions
        case 'resolveTicket':
          await api.resolveTicket(item._id, formData.resolution);
          setSuccess('Ticket resolved');
          setShowModal(null);
          loadTabData('tickets');
          break;
        case 'replyTicket':
          await api.addTicketMessage(item._id, formData.message);
          setSuccess('Reply sent');
          setShowModal(null);
          loadTabData('tickets');
          break;

        // Announcement actions
        case 'createAnnouncement':
          await api.createAnnouncement(formData);
          setSuccess('Announcement created');
          setShowModal(null);
          loadTabData('announcements');
          break;
        case 'deleteAnnouncement':
          await api.deleteAnnouncement(item._id);
          setSuccess('Announcement deleted');
          loadTabData('announcements');
          break;

        // Match creation
        case 'createMatch':
          await api.createMatch(formData);
          setSuccess('Match created successfully');
          setShowModal(null);
          loadTabData('matches');
          break;

        // Tournament creation
        case 'createTournament':
          await api.createTournament(formData);
          setSuccess('Tournament created successfully');
          setShowModal(null);
          loadTabData('tournaments');
          break;
      }
      fetchStats();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'admin' && user.role !== 'match_manager')) {
    return null;
  }

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'matches', label: 'Matches', icon: '🎮' },
    { id: 'tournaments', label: 'Tournaments', icon: '🏆' },
    { id: 'users', label: 'Users', icon: '👥', adminOnly: true },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💸', adminOnly: true },
    { id: 'kyc', label: 'KYC Requests', icon: '📋', adminOnly: true },
    { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
    { id: 'announcements', label: 'Announcements', icon: '📢', adminOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || user.role === 'admin'
  );

  const getStatusBadge = (status) => {
    const colors = {
      upcoming: 'bg-blue-500/20 text-blue-400',
      live: 'bg-green-500/20 text-green-400',
      completed: 'bg-gray-500/20 text-gray-400',
      cancelled: 'bg-red-500/20 text-red-400',
      pending: 'bg-yellow-500/20 text-yellow-400',
      approved: 'bg-green-500/20 text-green-400',
      rejected: 'bg-red-500/20 text-red-400',
      open: 'bg-blue-500/20 text-blue-400',
      in_progress: 'bg-yellow-500/20 text-yellow-400',
      resolved: 'bg-green-500/20 text-green-400',
      registration_open: 'bg-green-500/20 text-green-400',
      ongoing: 'bg-purple-500/20 text-purple-400',
    };
    return colors[status] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-800 border-r border-dark-700 flex flex-col fixed h-full">
        <div className="p-4 border-b border-dark-700">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">B</span>
            </div>
            <span className="text-xl font-bold">Admin</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredMenuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary-600 text-white'
                      : 'text-dark-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-dark-700">
          <Link href="/" className="btn-secondary w-full text-center block">
            ← Back to Site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 overflow-auto">
        <header className="bg-dark-800 border-b border-dark-700 p-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold capitalize">{activeTab.replace('_', ' ')}</h1>
            <div className="flex items-center gap-4">
              <span className="text-dark-400">Welcome, {user?.name}</span>
              <span className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm capitalize">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-6">
                  <div className="text-dark-400 text-sm mb-1">Total Users</div>
                  <div className="text-3xl font-bold">{stats?.users?.total || 0}</div>
                  <div className="text-green-400 text-sm">+{stats?.users?.today || 0} today</div>
                </div>
                <div className="card p-6">
                  <div className="text-dark-400 text-sm mb-1">Active Matches</div>
                  <div className="text-3xl font-bold">{stats?.matches?.active || 0}</div>
                  <div className="text-dark-400 text-sm">{stats?.matches?.total || 0} total</div>
                </div>
                <div className="card p-6">
                  <div className="text-dark-400 text-sm mb-1">Revenue</div>
                  <div className="text-3xl font-bold text-gaming-green">₹{stats?.revenue?.total || 0}</div>
                  <div className="text-green-400 text-sm">+₹{stats?.revenue?.today || 0} today</div>
                </div>
                <div className="card p-6">
                  <div className="text-dark-400 text-sm mb-1">Pending Withdrawals</div>
                  <div className="text-3xl font-bold text-yellow-400">{stats?.withdrawals?.pending || 0}</div>
                  <div className="text-dark-400 text-sm">₹{stats?.withdrawals?.pendingAmount || 0}</div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button onClick={() => { setActiveTab('matches'); setShowModal('createMatch'); setFormData({}); }} className="btn-secondary py-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">➕</span>
                    <span>Create Match</span>
                  </button>
                  <button onClick={() => setActiveTab('tournaments')} className="btn-secondary py-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span>Tournaments</span>
                  </button>
                  <button onClick={() => setActiveTab('withdrawals')} className="btn-secondary py-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">💸</span>
                    <span>Withdrawals ({stats?.withdrawals?.pending || 0})</span>
                  </button>
                  <button onClick={() => setActiveTab('kyc')} className="btn-secondary py-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">📋</span>
                    <span>KYC Review</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Manage Matches ({matches.length})</h2>
                <button onClick={() => { setShowModal('createMatch'); setFormData({ gameType: 'pubg_mobile', matchType: 'match_win', mode: 'solo', map: 'erangel', entryFee: 50, prizePool: 400, maxSlots: 100 }); }} className="btn-primary">
                  + Create Match
                </button>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="text-left p-4">Title</th>
                      <th className="text-left p-4">Type</th>
                      <th className="text-left p-4">Entry/Prize</th>
                      <th className="text-left p-4">Slots</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((match) => (
                      <tr key={match._id} className="border-t border-dark-700 hover:bg-dark-700/50">
                        <td className="p-4">
                          <div className="font-medium">{match.title}</div>
                          <div className="text-dark-400 text-sm">{formatDateTime(match.scheduledAt)}</div>
                        </td>
                        <td className="p-4 capitalize">{match.gameType?.replace('_', ' ')} - {match.matchType}</td>
                        <td className="p-4">₹{match.entryFee} / ₹{match.prizePool}</td>
                        <td className="p-4">{match.participants?.length || 0}/{match.maxSlots}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(match.status)}`}>
                            {match.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            {match.status === 'upcoming' && (
                              <>
                                {/* Room Credentials Status */}
                                <div className="flex items-center gap-1 text-xs mb-1">
                                  {match.roomCredentialsVisible ? (
                                    <span className="text-gaming-green">✓ Room set</span>
                                  ) : (
                                    <span className="text-yellow-400">⚠ Room not set</span>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => { setSelectedItem(match); setShowModal('roomCredentials'); setFormData({}); }} className="text-blue-400 hover:text-blue-300 text-sm">
                                    {match.roomCredentialsVisible ? 'Edit Room' : '1. Set Room'}
                                  </button>
                                  <button 
                                    onClick={() => handleAction('startMatch', match)} 
                                    disabled={!match.roomCredentialsVisible}
                                    className={`text-sm ${match.roomCredentialsVisible ? 'text-green-400 hover:text-green-300' : 'text-dark-500 cursor-not-allowed'}`}
                                    title={!match.roomCredentialsVisible ? 'Set room credentials first' : 'Start the match'}
                                  >
                                    2. Start
                                  </button>
                                  <button onClick={() => { setSelectedItem(match); setShowModal('cancelMatch'); setFormData({}); }} className="text-red-400 hover:text-red-300 text-sm">
                                    Cancel
                                  </button>
                                </div>
                              </>
                            )}
                            {match.status === 'live' && (
                              <button onClick={() => { setSelectedItem(match); setShowModal('completeMatch'); }} className="text-green-400 hover:text-green-300 text-sm">
                                Complete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {matches.length === 0 && (
                  <div className="p-8 text-center text-dark-400">No matches found</div>
                )}
              </div>
            </div>
          )}

          {/* Tournaments Tab */}
          {activeTab === 'tournaments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Manage Tournaments ({tournaments.length})</h2>
                <button onClick={() => { setShowModal('createTournament'); setFormData({ gameType: 'pubg_mobile', format: 'battle_royale', mode: 'squad', entryFee: 100, prizePool: 10000, maxTeams: 100 }); }} className="btn-primary">+ Create Tournament</button>
              </div>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="text-left p-4">Title</th>
                      <th className="text-left p-4">Format</th>
                      <th className="text-left p-4">Prize Pool</th>
                      <th className="text-left p-4">Teams</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournaments.map((tournament) => (
                      <tr key={tournament._id} className="border-t border-dark-700 hover:bg-dark-700/50">
                        <td className="p-4">
                          <div className="font-medium">{tournament.title}</div>
                          <div className="text-dark-400 text-sm">{formatDateTime(tournament.startAt)}</div>
                        </td>
                        <td className="p-4 capitalize">{tournament.format?.replace('_', ' ')}</td>
                        <td className="p-4">{formatCurrency(tournament.prizePool)}</td>
                        <td className="p-4">{tournament.registeredTeams || 0}/{tournament.maxTeams}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(tournament.status)}`}>
                            {tournament.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link href={`/tournaments/${tournament._id}`} className="text-primary-400 hover:text-primary-300 text-sm">
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tournaments.length === 0 && (
                  <div className="p-8 text-center text-dark-400">No tournaments found</div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">User Management ({users.length})</h2>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Phone</th>
                      <th className="text-left p-4">Balance</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Joined</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-dark-700 hover:bg-dark-700/50">
                        <td className="p-4">
                          <div className="font-medium">{u.name}</div>
                          <div className="text-dark-400 text-sm">{u.email}</div>
                        </td>
                        <td className="p-4">{u.phone}</td>
                        <td className="p-4">{formatCurrency(u.walletBalance || 0)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {u.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-dark-400 text-sm">{formatDateTime(u.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            {u.isBanned ? (
                              <button onClick={() => handleAction('unbanUser', u)} className="text-green-400 hover:text-green-300 text-sm">
                                Unban
                              </button>
                            ) : (
                              <button onClick={() => { setSelectedItem(u); setShowModal('banUser'); setFormData({}); }} className="text-red-400 hover:text-red-300 text-sm">
                                Ban
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="p-8 text-center text-dark-400">No users found</div>
                )}
              </div>
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === 'withdrawals' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Pending Withdrawals ({withdrawals.length})</h2>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Amount</th>
                      <th className="text-left p-4">Method</th>
                      <th className="text-left p-4">Details</th>
                      <th className="text-left p-4">Requested</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w._id} className="border-t border-dark-700 hover:bg-dark-700/50">
                        <td className="p-4">
                          <div className="font-medium">{w.user?.name}</div>
                          <div className="text-dark-400 text-sm">{w.user?.phone}</div>
                        </td>
                        <td className="p-4 font-bold text-gaming-green">{formatCurrency(w.amount)}</td>
                        <td className="p-4 capitalize">{w.method}</td>
                        <td className="p-4 text-sm text-dark-400">{w.accountDetails?.upiId || w.accountDetails?.accountNumber}</td>
                        <td className="p-4 text-dark-400 text-sm">{formatDateTime(w.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => handleAction('approveWithdrawal', w)} className="text-green-400 hover:text-green-300 text-sm">
                              Approve
                            </button>
                            <button onClick={() => { setSelectedItem(w); setShowModal('rejectWithdrawal'); setFormData({}); }} className="text-red-400 hover:text-red-300 text-sm">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {withdrawals.length === 0 && (
                  <div className="p-8 text-center text-dark-400">No pending withdrawals</div>
                )}
              </div>
            </div>
          )}

          {/* KYC Tab */}
          {activeTab === 'kyc' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Pending KYC Requests ({kycRequests.length})</h2>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kycRequests.map((kyc) => (
                  <div key={kyc._id} className="card p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-medium">{kyc.name}</div>
                        <div className="text-dark-400 text-sm">{kyc.user?.phone}</div>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-yellow-500/20 text-yellow-400">
                        Pending
                      </span>
                    </div>
                    <div className="text-sm space-y-1 text-dark-300 mb-4">
                      <div>Document: {kyc.documentType}</div>
                      <div>Number: {kyc.documentNumber}</div>
                      <div>DOB: {kyc.dateOfBirth}</div>
                    </div>
                    {kyc.documents?.documentFront && (
                      <div className="mb-4">
                        <img src={kyc.documents.documentFront.url} alt="Document" className="w-full h-32 object-cover rounded" />
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('approveKYC', kyc)} className="btn-primary flex-1 text-sm py-2">
                        Approve
                      </button>
                      <button onClick={() => { setSelectedItem(kyc); setShowModal('rejectKYC'); setFormData({}); }} className="btn-secondary flex-1 text-sm py-2">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {kycRequests.length === 0 && (
                <div className="card p-8 text-center text-dark-400">No pending KYC requests</div>
              )}
            </div>
          )}

          {/* Tickets Tab */}
          {activeTab === 'tickets' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Support Tickets ({tickets.length})</h2>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="text-left p-4">Subject</th>
                      <th className="text-left p-4">User</th>
                      <th className="text-left p-4">Category</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket._id} className="border-t border-dark-700 hover:bg-dark-700/50">
                        <td className="p-4">
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-dark-400 text-sm line-clamp-1">{ticket.message}</div>
                        </td>
                        <td className="p-4">{ticket.user?.name}</td>
                        <td className="p-4 capitalize">{ticket.category}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(ticket.status)}`}>
                            {ticket.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-dark-400 text-sm">{formatDateTime(ticket.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <button onClick={() => { setSelectedItem(ticket); setShowModal('replyTicket'); setFormData({}); }} className="text-primary-400 hover:text-primary-300 text-sm">
                              Reply
                            </button>
                            {ticket.status !== 'resolved' && (
                              <button onClick={() => { setSelectedItem(ticket); setShowModal('resolveTicket'); setFormData({}); }} className="text-green-400 hover:text-green-300 text-sm">
                                Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tickets.length === 0 && (
                  <div className="p-8 text-center text-dark-400">No tickets found</div>
                )}
              </div>
            </div>
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && user?.role === 'admin' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Announcements ({announcements.length})</h2>
                <button onClick={() => { setShowModal('createAnnouncement'); setFormData({ type: 'info', isActive: true }); }} className="btn-primary">
                  + New Announcement
                </button>
              </div>

              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement._id} className="card p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold">{announcement.title}</h3>
                        <p className="text-dark-400 mt-1">{announcement.message}</p>
                        <div className="text-dark-500 text-sm mt-2">
                          Created: {formatDateTime(announcement.createdAt)}
                        </div>
                      </div>
                      <button onClick={() => handleAction('deleteAnnouncement', announcement)} className="text-red-400 hover:text-red-300">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="card p-8 text-center text-dark-400">No announcements</div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Create Match Modal */}
            {showModal === 'createMatch' && (
              <>
                <h2 className="text-xl font-bold mb-4">Create Match</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="PUBG Mobile Solo Classic" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Game Type</label>
                      <select className="input" value={formData.gameType || 'pubg_mobile'} onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}>
                        <option value="pubg_mobile">PUBG Mobile</option>
                        <option value="free_fire">Free Fire</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Match Type</label>
                      <select className="input" value={formData.matchType || 'match_win'} onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}>
                        <option value="match_win">Match Win</option>
                        <option value="tournament">Tournament</option>
                        <option value="tdm">TDM</option>
                        <option value="wow">WoW</option>
                        <option value="special">Special</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Mode</label>
                    <select className="input" value={formData.mode || 'solo'} onChange={(e) => setFormData({ ...formData, mode: e.target.value })}>
                      <option value="solo">Solo</option>
                      <option value="duo">Duo</option>
                      <option value="squad">Squad</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Entry Fee (₹)</label>
                      <input type="number" className="input" value={formData.entryFee || ''} onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Prize Pool (₹)</label>
                      <input type="number" className="input" value={formData.prizePool || ''} onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Max Slots</label>
                      <input type="number" className="input" value={formData.maxSlots || ''} onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })} />
                    </div>
                    <div>
                      <label className="label">Map</label>
                      <select className="input" value={formData.map || 'erangel'} onChange={(e) => setFormData({ ...formData, map: e.target.value })}>
                        <option value="erangel">Erangel</option>
                        <option value="miramar">Miramar</option>
                        <option value="sanhok">Sanhok</option>
                        <option value="vikendi">Vikendi</option>
                        <option value="livik">Livik</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Scheduled At</label>
                    <input type="datetime-local" className="input" value={formData.scheduledAt || ''} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* Create Tournament Modal */}
            {showModal === 'createTournament' && (
              <>
                <h2 className="text-xl font-bold mb-4">Create Tournament</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="PUBG Mobile Squad Championship" />
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <textarea className="input min-h-[80px]" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tournament description..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Game Type</label>
                      <select className="input" value={formData.gameType || 'pubg_mobile'} onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}>
                        <option value="pubg_mobile">PUBG Mobile</option>
                        <option value="free_fire">Free Fire</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Format</label>
                      <select className="input" value={formData.format || 'battle_royale'} onChange={(e) => setFormData({ ...formData, format: e.target.value })}>
                        <option value="battle_royale">Battle Royale</option>
                        <option value="single_elimination">Single Elimination</option>
                        <option value="double_elimination">Double Elimination</option>
                        <option value="round_robin">Round Robin</option>
                        <option value="swiss">Swiss</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="label">Mode</label>
                    <select className="input" value={formData.mode || 'squad'} onChange={(e) => setFormData({ ...formData, mode: e.target.value })}>
                      <option value="solo">Solo</option>
                      <option value="duo">Duo</option>
                      <option value="squad">Squad</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="label">Entry Fee (₹)</label>
                      <input type="number" className="input" value={formData.entryFee || ''} onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="label">Prize Pool (₹)</label>
                      <input type="number" className="input" value={formData.prizePool || ''} onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })} />
                    </div>
                    <div>
                      <label className="label">Max Teams</label>
                      <input type="number" className="input" value={formData.maxTeams || ''} onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 0 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Registration Start</label>
                      <input type="datetime-local" className="input" value={formData.registrationStartAt || ''} onChange={(e) => setFormData({ ...formData, registrationStartAt: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Registration End</label>
                      <input type="datetime-local" className="input" value={formData.registrationEndAt || ''} onChange={(e) => setFormData({ ...formData, registrationEndAt: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="label">Tournament Start</label>
                    <input type="datetime-local" className="input" value={formData.startAt || ''} onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} />
                  </div>
                </div>
              </>
            )}

            {/* Room Credentials Modal */}
            {showModal === 'roomCredentials' && (
              <>
                <h2 className="text-xl font-bold mb-4">Set Room Credentials</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Room ID</label>
                    <input type="text" className="input" value={formData.roomId || ''} onChange={(e) => setFormData({ ...formData, roomId: e.target.value })} placeholder="Enter room ID" />
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input type="text" className="input" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} placeholder="Enter password" />
                  </div>
                </div>
              </>
            )}

            {/* Reject/Cancel Modals with Reason */}
            {(showModal === 'cancelMatch' || showModal === 'rejectWithdrawal' || showModal === 'rejectKYC' || showModal === 'banUser') && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {showModal === 'cancelMatch' && 'Cancel Match'}
                  {showModal === 'rejectWithdrawal' && 'Reject Withdrawal'}
                  {showModal === 'rejectKYC' && 'Reject KYC'}
                  {showModal === 'banUser' && 'Ban User'}
                </h2>
                <div>
                  <label className="label">Reason</label>
                  <textarea className="input min-h-[100px]" value={formData.reason || ''} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Enter reason..." />
                </div>
              </>
            )}

            {/* Reply/Resolve Ticket Modal */}
            {(showModal === 'replyTicket' || showModal === 'resolveTicket') && (
              <>
                <h2 className="text-xl font-bold mb-4">
                  {showModal === 'replyTicket' ? 'Reply to Ticket' : 'Resolve Ticket'}
                </h2>
                <div>
                  <label className="label">{showModal === 'replyTicket' ? 'Message' : 'Resolution'}</label>
                  <textarea className="input min-h-[100px]" value={showModal === 'replyTicket' ? formData.message || '' : formData.resolution || ''} onChange={(e) => setFormData({ ...formData, [showModal === 'replyTicket' ? 'message' : 'resolution']: e.target.value })} placeholder="Enter your response..." />
                </div>
              </>
            )}

            {/* Create Announcement Modal */}
            {showModal === 'createAnnouncement' && (
              <>
                <h2 className="text-xl font-bold mb-4">Create Announcement</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Announcement title" />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea className="input min-h-[100px]" value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Announcement message..." />
                  </div>
                  <div>
                    <label className="label">Type</label>
                    <select className="input" value={formData.type || 'info'} onChange={(e) => setFormData({ ...formData, type: e.target.value })}>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="success">Success</option>
                      <option value="error">Error</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setShowModal(null); setSelectedItem(null); setFormData({}); setError(''); }} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={() => handleAction(showModal, selectedItem)} disabled={actionLoading} className="btn-primary flex-1">
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
