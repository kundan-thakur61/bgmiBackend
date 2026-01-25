'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, getMatches } from '@/lib/api';
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
  const [matchParticipants, setMatchParticipants] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [disputeStats, setDisputeStats] = useState(null);
  const [reports, setReports] = useState({ revenue: null, users: null, matches: null, referrals: null });
  const [broadcastResult, setBroadcastResult] = useState(null);

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
      console.error('Failed to fetch stats', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'matches':
          const matchData = await getMatches({ limit: 50 });
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
        case 'disputes':
          const [disputeData, disputeStatsData] = await Promise.all([
            api.getAllDisputes({ limit: 50 }),
            api.getDisputeStats()
          ]);
          setDisputes(disputeData.disputes || []);
          setDisputeStats(disputeStatsData.stats || null);
          break;
        case 'reports':
          const [revenueData, usersData, matchesData, referralsData] = await Promise.all([
            api.getRevenueReport(),
            api.getUsersReport(),
            api.getMatchesReport(),
            api.getReferralsReport()
          ]);
          setReports({
            revenue: revenueData.report,
            users: usersData.report,
            matches: matchesData.report,
            referrals: referralsData.stats
          });
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
        case 'completeMatch':
          await api.completeMatch(item._id);
          setSuccess('Match marked as completed');
          setShowModal(null);
          loadTabData('matches');
          break;
        case 'declareWinners':
          await api.declareWinners(item._id, formData.winners || []);
          setSuccess('Winners declared and wallets updated');
          setShowModal(null);
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
          // Validate required fields before sending
          if (!formData.title || formData.title.trim().length < 3) {
            throw new Error('Title must be at least 3 characters');
          }
          if (!formData.scheduledAt) {
            throw new Error('Scheduled date is required');
          }

          // Ensure proper data formatting before sending
          const matchData = {
            title: formData.title.trim(),
            gameType: formData.gameType || 'pubg_mobile',
            matchType: formData.matchType || 'match_win',
            mode: formData.mode || 'solo',
            map: formData.map || 'erangel',
            entryFee: parseInt(formData.entryFee, 10) || 0,
            prizePool: parseInt(formData.prizePool, 10) || 0,
            maxSlots: parseInt(formData.maxSlots, 10) || 2,
            // Convert datetime-local format to proper ISO string
            scheduledAt: new Date(formData.scheduledAt).toISOString()
          };

          // Validate scheduledAt is in the future
          if (new Date(matchData.scheduledAt) <= new Date()) {
            throw new Error('Scheduled date must be in the future');
          }

          await api.createMatch(matchData);
          setSuccess('Match created successfully');
          setShowModal(null);
          setFormData({});
          loadTabData('matches');
          break;

        // Tournament creation
        case 'createTournament':
          await api.createTournament(formData);
          setSuccess('Tournament created successfully');
          setShowModal(null);
          loadTabData('tournaments');
          break;

        // Tournament deletion
        case 'deleteTournament':
          await api.deleteTournament(item._id);
          setSuccess('Tournament deleted successfully');
          loadTabData('tournaments');
          break;

        case 'completeTournament':
          await api.completeTournament(item._id);
          setSuccess('Tournament completed successfully');
          setShowModal(null);
          loadTabData('tournaments');
          break;

        case 'cancelTournament':
          await api.cancelTournament(item._id, formData.reason);
          setSuccess('Tournament cancelled successfully');
          setShowModal(null);
          loadTabData('tournaments');
          break;

        // Match deletion
        case 'deleteMatch':
          await api.deleteMatch(item._id);
          setSuccess('Match deleted successfully');
          loadTabData('matches');
          break;

        // User role change
        case 'changeRole':
          await api.changeUserRole(selectedItem._id, formData.role);
          setSuccess(`User role changed to ${formData.role}`);
          setShowModal(null);
          loadTabData('users');
          break;

        // Wallet adjustment
        case 'adjustWallet':
          await api.adjustUserWallet(
            selectedItem._id,
            Math.abs(parseInt(formData.amount)),
            formData.adjustType,
            formData.reason
          );
          setSuccess(`Wallet ${formData.adjustType === 'credit' ? 'credited' : 'debited'} successfully`);
          setShowModal(null);
          loadTabData('users');
          break;

        // Resolve dispute
        case 'resolveDispute':
          await api.resolveDispute(selectedItem._id, {
            resolution: formData.resolution,
            decision: formData.decision,
            compensation: formData.compensation ? parseInt(formData.compensation) : 0
          });
          setSuccess('Dispute resolved successfully');
          setShowModal(null);
          loadTabData('disputes');
          break;

        // Add dispute note
        case 'addDisputeNote':
          await api.addDisputeNote(selectedItem._id, formData.note);
          setSuccess('Note added successfully');
          setShowModal(null);
          loadTabData('disputes');
          break;

        // Assign dispute
        case 'assignDispute':
          await api.assignDispute(selectedItem._id, user._id);
          setSuccess('Dispute assigned to you');
          loadTabData('disputes');
          break;

        // Broadcast notification
        case 'sendBroadcast':
          const result = await api.broadcastNotification({
            title: formData.title,
            message: formData.message,
            type: formData.notificationType || 'announcement',
            url: formData.url || '/',
            targetAudience: formData.targetAudience || 'all',
            level: formData.level
          });
          setBroadcastResult(result.results);
          setSuccess(`Broadcast sent to ${result.results.notificationsCreated} users`);
          setShowModal(null);
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
    { id: 'disputes', label: 'Disputes', icon: '⚖️', adminOnly: true },
    { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
    { id: 'reports', label: 'Reports', icon: '📈', adminOnly: true },
    { id: 'broadcast', label: 'Broadcast', icon: '📣', adminOnly: true },
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
      result_pending: 'bg-yellow-500/20 text-yellow-400',
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

  const isClosed = (status) => {
    return status === 'completed' || status === 'cancelled';
  };

  const openDeclareWinners = async (match) => {
    setSelectedItem(match);
    setFormData({ winners: [{ userId: '', position: 1, kills: 0 }] });
    setMatchParticipants([]);
    setShowModal('declareWinners');

    try {
      const data = await api.getMatch(match._id);
      setMatchParticipants(data?.match?.joinedUsers || []);
    } catch (err) {
      setError('Failed to load match participants');
    }
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                <div className="card p-6">
                  <div className="text-dark-400 text-sm mb-1">Open Disputes</div>
                  <div className="text-3xl font-bold text-red-400">{disputeStats?.pending || 0}</div>
                  <div className="text-dark-400 text-sm">{disputeStats?.total || 0} total</div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                  <button onClick={() => setActiveTab('disputes')} className="btn-secondary py-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">⚖️</span>
                    <span>Disputes ({disputeStats?.pending || 0})</span>
                  </button>
                  <button onClick={() => setActiveTab('reports')} className="btn-secondary py-4 flex flex-col items-center gap-2">
                    <span className="text-2xl">📈</span>
                    <span>Reports</span>
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
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{match.title}</div>
                              <div className="text-dark-400 text-sm">{formatDateTime(match.scheduledAt)}</div>
                            </div>
                            {isClosed(match.status) && (
                              <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                                CLOSED
                              </span>
                            )}
                          </div>
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
                            {match.status === 'result_pending' && (
                              <button onClick={() => openDeclareWinners(match)} className="text-primary-400 hover:text-primary-300 text-sm">
                                Declare Winners
                              </button>
                            )}
                            <button onClick={() => { setSelectedItem(match); setShowModal('deleteMatch'); }} className="text-red-400 hover:text-red-300 text-sm">
                              Delete
                            </button>
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
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{tournament.title}</div>
                              <div className="text-dark-400 text-sm">{formatDateTime(tournament.startAt)}</div>
                            </div>
                            {isClosed(tournament.status) && (
                              <span className="ml-2 px-2 py-1 bg-red-500/20 text-red-400 rounded text-xs font-medium">
                                CLOSED
                              </span>
                            )}
                          </div>
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
                          <div className="flex flex-col gap-2">
                            <Link href={`/tournaments/${tournament._id}`} className="text-primary-400 hover:text-primary-300 text-sm">
                              View
                            </Link>
                            {tournament.status === 'ongoing' && (
                              <button onClick={() => { setSelectedItem(tournament); setShowModal('completeTournament'); }} className="text-green-400 hover:text-green-300 text-sm">
                                Complete
                              </button>
                            )}
                            {!isClosed(tournament.status) && (
                              <button onClick={() => { setSelectedItem(tournament); setShowModal('cancelTournament'); setFormData({}); }} className="text-red-400 hover:text-red-300 text-sm">
                                Cancel
                              </button>
                            )}
                            <button onClick={() => { setSelectedItem(tournament); setShowModal('deleteTournament'); }} className="text-red-400 hover:text-red-300 text-sm">
                              Delete
                            </button>
                          </div>
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
                      <th className="text-left p-4">Role</th>
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
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs capitalize ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                            u.role === 'match_manager' ? 'bg-blue-500/20 text-blue-400' :
                              u.role === 'host' ? 'bg-cyan-500/20 text-cyan-400' :
                                'bg-gray-500/20 text-gray-400'
                            }`}>
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-gaming-green font-medium">{formatCurrency(u.walletBalance || 0)}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${u.isBanned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {u.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="p-4 text-dark-400 text-sm">{formatDateTime(u.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex gap-2">
                              <button onClick={() => { setSelectedItem(u); setShowModal('adjustWallet'); setFormData({ adjustType: 'credit' }); }} className="text-primary-400 hover:text-primary-300 text-sm">
                                Wallet
                              </button>
                              <button onClick={() => { setSelectedItem(u); setShowModal('changeRole'); setFormData({ role: u.role }); }} className="text-blue-400 hover:text-blue-300 text-sm">
                                Role
                              </button>
                            </div>
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

          {/* Disputes Tab */}
          {activeTab === 'disputes' && user?.role === 'admin' && (
            <div className="space-y-6">
              {/* Dispute Stats */}
              {disputeStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold">{disputeStats.total || 0}</div>
                    <div className="text-dark-400 text-sm">Total</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-blue-400">{disputeStats.open || 0}</div>
                    <div className="text-dark-400 text-sm">Open</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400">{disputeStats.in_progress || 0}</div>
                    <div className="text-dark-400 text-sm">In Progress</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-green-400">{disputeStats.resolved || 0}</div>
                    <div className="text-dark-400 text-sm">Resolved</div>
                  </div>
                  <div className="card p-4 text-center">
                    <div className="text-2xl font-bold text-red-400">{disputeStats.rejected || 0}</div>
                    <div className="text-dark-400 text-sm">Rejected</div>
                  </div>
                </div>
              )}

              <h2 className="text-lg font-bold">Dispute Management ({disputes.length})</h2>

              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead className="bg-dark-700">
                    <tr>
                      <th className="text-left p-4">Match</th>
                      <th className="text-left p-4">Submitted By</th>
                      <th className="text-left p-4">Reason</th>
                      <th className="text-left p-4">Status</th>
                      <th className="text-left p-4">Assigned To</th>
                      <th className="text-left p-4">Created</th>
                      <th className="text-left p-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr key={dispute._id} className="border-t border-dark-700 hover:bg-dark-700/50">
                        <td className="p-4">
                          <div className="font-medium">{dispute.match?.title || 'N/A'}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium">{dispute.submittedBy?.name || 'Unknown'}</div>
                          <div className="text-dark-400 text-sm">{dispute.submittedBy?.phone}</div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm text-dark-300 max-w-xs truncate">{dispute.reason}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(dispute.status)}`}>
                            {dispute.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-dark-400 text-sm">
                          {dispute.assignedTo?.name || 'Unassigned'}
                        </td>
                        <td className="p-4 text-dark-400 text-sm">{formatDateTime(dispute.createdAt)}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {!dispute.assignedTo && dispute.status === 'open' && (
                              <button onClick={() => handleAction('assignDispute', dispute)} className="text-blue-400 hover:text-blue-300 text-sm">
                                Assign to Me
                              </button>
                            )}
                            {dispute.status !== 'resolved' && dispute.status !== 'rejected' && (
                              <button onClick={() => { setSelectedItem(dispute); setShowModal('resolveDispute'); setFormData({ decision: 'accepted' }); }} className="text-green-400 hover:text-green-300 text-sm">
                                Resolve
                              </button>
                            )}
                            <button onClick={() => { setSelectedItem(dispute); setShowModal('addDisputeNote'); setFormData({}); }} className="text-primary-400 hover:text-primary-300 text-sm">
                              Add Note
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {disputes.length === 0 && (
                  <div className="p-8 text-center text-dark-400">No disputes found</div>
                )}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">Analytics & Reports</h2>

              {/* Revenue Report */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">💰 Revenue Overview</h3>
                {reports.revenue ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">Match Entry Revenue</div>
                      <div className="text-2xl font-bold text-gaming-green">
                        {formatCurrency(reports.revenue.revenue?.find(r => r._id === 'match_entry')?.total || 0)}
                      </div>
                      <div className="text-dark-400 text-sm">
                        {reports.revenue.revenue?.find(r => r._id === 'match_entry')?.count || 0} transactions
                      </div>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">Total Deposits</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {formatCurrency(reports.revenue.deposits?.total || 0)}
                      </div>
                      <div className="text-dark-400 text-sm">
                        {reports.revenue.deposits?.count || 0} deposits
                      </div>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">Total Withdrawals</div>
                      <div className="text-2xl font-bold text-red-400">
                        {formatCurrency(reports.revenue.withdrawals?.total || 0)}
                      </div>
                      <div className="text-dark-400 text-sm">
                        {reports.revenue.withdrawals?.count || 0} withdrawals
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-dark-400">Loading revenue data...</div>
                )}
              </div>

              {/* User Report */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">👥 User Statistics</h3>
                {reports.users ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">Total Users</div>
                      <div className="text-2xl font-bold">{reports.users.total || 0}</div>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">KYC Verified</div>
                      <div className="text-2xl font-bold text-green-400">{reports.users.verified || 0}</div>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">Banned Users</div>
                      <div className="text-2xl font-bold text-red-400">{reports.users.banned || 0}</div>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <div className="text-dark-400 text-sm">Verification Rate</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {reports.users.total > 0 ? Math.round((reports.users.verified / reports.users.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-dark-400">Loading user data...</div>
                )}
              </div>

              {/* Match Report */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">🎮 Match Statistics</h3>
                {reports.matches ? (
                  <div>
                    <div className="mb-4">
                      <div className="text-dark-400 text-sm mb-1">Total Matches: <span className="text-white font-bold">{reports.matches.total || 0}</span></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {reports.matches.byStatus?.map(status => (
                        <div key={status._id} className="bg-dark-700 rounded-lg p-3">
                          <div className={`px-2 py-1 rounded text-xs inline-block mb-2 ${getStatusBadge(status._id)}`}>
                            {status._id?.replace('_', ' ')}
                          </div>
                          <div className="text-xl font-bold">{status.count}</div>
                        </div>
                      ))}
                    </div>
                    {reports.matches.byGame && reports.matches.byGame.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm text-dark-400 mb-2">By Game Type:</div>
                        <div className="flex gap-4 flex-wrap">
                          {reports.matches.byGame.map(game => (
                            <div key={game._id} className="bg-dark-700 rounded-lg px-4 py-2">
                              <span className="capitalize">{game._id?.replace('_', ' ')}</span>: {game.count} matches
                              <span className="text-gaming-green ml-2">({formatCurrency(game.totalPrize)} prize)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-dark-400">Loading match data...</div>
                )}
              </div>

              {/* Referral Report */}
              <div className="card p-6">
                <h3 className="text-lg font-bold mb-4">🤝 Referral Statistics</h3>
                {reports.referrals ? (
                  <div>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-dark-700 rounded-lg p-4">
                        <div className="text-dark-400 text-sm">Total Referrals</div>
                        <div className="text-2xl font-bold">{reports.referrals.totalReferrals || 0}</div>
                      </div>
                      <div className="bg-dark-700 rounded-lg p-4">
                        <div className="text-dark-400 text-sm">Total Earnings Paid</div>
                        <div className="text-2xl font-bold text-gaming-green">{formatCurrency(reports.referrals.totalEarnings || 0)}</div>
                      </div>
                    </div>
                    {reports.referrals.topReferrers?.length > 0 && (
                      <div>
                        <div className="text-sm text-dark-400 mb-2">Top Referrers:</div>
                        <div className="space-y-2">
                          {reports.referrals.topReferrers.slice(0, 5).map((referrer, index) => (
                            <div key={referrer._id} className="bg-dark-700 rounded-lg px-4 py-2 flex justify-between items-center">
                              <span>#{index + 1} {referrer.name}</span>
                              <span className="text-primary-400">{referrer.referralCount} referrals</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-dark-400">Loading referral data...</div>
                )}
              </div>
            </div>
          )}

          {/* Broadcast Tab */}
          {activeTab === 'broadcast' && user?.role === 'admin' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold">📣 Push Notification Broadcast</h2>

              <div className="card p-6">
                <div className="space-y-4">
                  <div>
                    <label className="label">Notification Title</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.title || ''}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., New Tournament Starting Soon!"
                    />
                  </div>

                  <div>
                    <label className="label">Message</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={formData.message || ''}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Enter your notification message..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Target Audience</label>
                      <select
                        className="input"
                        value={formData.targetAudience || 'all'}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      >
                        <option value="all">All Users</option>
                        <option value="verified">KYC Verified Only</option>
                        <option value="level">Specific Level</option>
                      </select>
                    </div>

                    {formData.targetAudience === 'level' && (
                      <div>
                        <label className="label">User Level</label>
                        <input
                          type="number"
                          className="input"
                          value={formData.level || ''}
                          onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                          placeholder="e.g., 5"
                          min="1"
                        />
                      </div>
                    )}

                    <div>
                      <label className="label">Notification Type</label>
                      <select
                        className="input"
                        value={formData.notificationType || 'announcement'}
                        onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}
                      >
                        <option value="announcement">Announcement</option>
                        <option value="promotion">Promotion</option>
                        <option value="update">Update</option>
                        <option value="reminder">Reminder</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="label">Action URL (optional)</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.url || ''}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="e.g., /tournaments"
                    />
                  </div>

                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400">⚠️</span>
                      <div className="text-yellow-400 text-sm">
                        This will send a notification to all matching users. Make sure your message is correct before sending.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleAction('sendBroadcast', null)}
                    disabled={!formData.title || !formData.message || actionLoading}
                    className="btn-primary w-full"
                  >
                    {actionLoading ? 'Sending...' : '📤 Send Broadcast'}
                  </button>

                  {broadcastResult && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                      <div className="text-green-400 font-medium mb-2">✅ Broadcast Sent Successfully!</div>
                      <div className="text-sm text-dark-300 space-y-1">
                        <div>In-app notifications created: <span className="text-white">{broadcastResult.notificationsCreated}</span></div>
                        <div>Push notifications sent: <span className="text-white">{broadcastResult.pushSent}</span></div>
                        {broadcastResult.pushFailed > 0 && (
                          <div>Push failed: <span className="text-red-400">{broadcastResult.pushFailed}</span></div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
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

            {/* Complete Match Modal */}
            {showModal === 'completeMatch' && (
              <>
                <h2 className="text-xl font-bold mb-4">Complete Match</h2>
                <div className="space-y-4">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      Mark match "{selectedItem?.title}" as completed? This will move it to result verification.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Declare Winners Modal */}
            {showModal === 'declareWinners' && (
              <>
                <h2 className="text-xl font-bold mb-4">Declare Winners</h2>
                <div className="space-y-4">
                  {formData.winners?.map((winner, index) => (
                    <div key={index} className="border border-dark-700 rounded-lg p-3 space-y-3">
                      <div>
                        <label className="label">Winner</label>
                        <select
                          className="input"
                          value={winner.userId || ''}
                          onChange={(e) => {
                            const updated = [...formData.winners];
                            updated[index] = { ...updated[index], userId: e.target.value };
                            setFormData({ ...formData, winners: updated });
                          }}
                        >
                          <option value="">Select player</option>
                          {matchParticipants.map((slot) => (
                            <option key={slot.user?._id || slot.user} value={slot.user?._id || slot.user}>
                              {slot.user?.name || 'Player'} {slot.inGameName ? `• ${slot.inGameName}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Position</label>
                          <input
                            type="number"
                            className="input"
                            value={winner.position || ''}
                            onChange={(e) => {
                              const updated = [...formData.winners];
                              updated[index] = { ...updated[index], position: parseInt(e.target.value, 10) || 0 };
                              setFormData({ ...formData, winners: updated });
                            }}
                            min="1"
                          />
                        </div>
                        <div>
                          <label className="label">Kills</label>
                          <input
                            type="number"
                            className="input"
                            value={winner.kills || 0}
                            onChange={(e) => {
                              const updated = [...formData.winners];
                              updated[index] = { ...updated[index], kills: parseInt(e.target.value, 10) || 0 };
                              setFormData({ ...formData, winners: updated });
                            }}
                            min="0"
                          />
                        </div>
                      </div>
                      {formData.winners.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formData.winners.filter((_, i) => i !== index);
                            setFormData({ ...formData, winners: updated });
                          }}
                          className="text-red-400 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      winners: [...(formData.winners || []), { userId: '', position: (formData.winners?.length || 0) + 1, kills: 0 }]
                    })}
                    className="btn-secondary w-full"
                  >
                    + Add Winner
                  </button>
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

            {/* Delete Tournament Modal */}
            {showModal === 'deleteTournament' && (
              <>
                <h2 className="text-xl font-bold mb-4">Delete Tournament</h2>
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                    <p className="text-red-400 text-sm">
                      Are you sure you want to delete the tournament "{selectedItem?.title}"?
                    </p>
                    <p className="text-red-400 text-sm mt-2">
                      This action cannot be undone and will permanently remove all tournament data.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Complete Tournament Modal */}
            {showModal === 'completeTournament' && (
              <>
                <h2 className="text-xl font-bold mb-4">Complete Tournament</h2>
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                    <p className="text-green-400 text-sm">
                      Mark tournament "{selectedItem?.title}" as completed?
                    </p>
                    <p className="text-green-400 text-sm mt-2">
                      This will finalize standings and distribute prizes if defined.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Cancel Tournament Modal */}
            {showModal === 'cancelTournament' && (
              <>
                <h2 className="text-xl font-bold mb-4">Cancel Tournament</h2>
                <div className="space-y-4">
                  <div>
                    <label className="label">Reason</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason for cancellation..."
                    />
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                    <p className="text-red-400 text-sm">
                      ⚠️ This will cancel the tournament and refund all entry fees to participants.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Delete Match Modal */}
            {showModal === 'deleteMatch' && (
              <>
                <h2 className="text-xl font-bold mb-4">Delete Match</h2>
                <div className="space-y-4">
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg">
                    <p className="text-red-400 text-sm">
                      Are you sure you want to delete the match "{selectedItem?.title}"?
                    </p>
                    <p className="text-red-400 text-sm mt-2">
                      This action cannot be undone and will permanently remove all match data.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Change Role Modal */}
            {showModal === 'changeRole' && (
              <>
                <h2 className="text-xl font-bold mb-4">Change User Role</h2>
                <div className="space-y-4">
                  <div className="bg-dark-700 p-3 rounded-lg">
                    <div className="text-sm text-dark-400">User</div>
                    <div className="font-medium">{selectedItem?.name}</div>
                    <div className="text-sm text-dark-400">{selectedItem?.phone}</div>
                  </div>
                  <div>
                    <label className="label">New Role</label>
                    <select
                      className="input"
                      value={formData.role || 'user'}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="user">User</option>
                      <option value="host">Host</option>
                      <option value="match_manager">Match Manager</option>
                      <option value="support">Support</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
                    <p className="text-yellow-400 text-sm">
                      ⚠️ Changing roles grants different permissions. Admin has full access.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Adjust Wallet Modal */}
            {showModal === 'adjustWallet' && (
              <>
                <h2 className="text-xl font-bold mb-4">Adjust User Wallet</h2>
                <div className="space-y-4">
                  <div className="bg-dark-700 p-3 rounded-lg">
                    <div className="text-sm text-dark-400">User</div>
                    <div className="font-medium">{selectedItem?.name}</div>
                    <div className="text-gaming-green">Current Balance: {formatCurrency(selectedItem?.walletBalance || 0)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label">Type</label>
                      <select
                        className="input"
                        value={formData.adjustType || 'credit'}
                        onChange={(e) => setFormData({ ...formData, adjustType: e.target.value })}
                      >
                        <option value="credit">Credit (+)</option>
                        <option value="debit">Debit (-)</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Amount (₹)</label>
                      <input
                        type="number"
                        className="input"
                        value={formData.amount || ''}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        placeholder="Enter amount"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Reason</label>
                    <textarea
                      className="input min-h-[80px]"
                      value={formData.reason || ''}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="Enter reason for adjustment (required)"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Resolve Dispute Modal */}
            {showModal === 'resolveDispute' && (
              <>
                <h2 className="text-xl font-bold mb-4">Resolve Dispute</h2>
                <div className="space-y-4">
                  <div className="bg-dark-700 p-3 rounded-lg">
                    <div className="text-sm text-dark-400">Match</div>
                    <div className="font-medium">{selectedItem?.match?.title || 'N/A'}</div>
                    <div className="text-dark-400 text-sm mt-1">Submitted by: {selectedItem?.submittedBy?.name}</div>
                  </div>
                  <div>
                    <label className="label">Decision</label>
                    <select
                      className="input"
                      value={formData.decision || 'accepted'}
                      onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                    >
                      <option value="accepted">Accept (in favor of user)</option>
                      <option value="rejected">Reject (dismiss dispute)</option>
                      <option value="partial">Partial Resolution</option>
                    </select>
                  </div>
                  {(formData.decision === 'accepted' || formData.decision === 'partial') && (
                    <div>
                      <label className="label">Compensation Amount (₹)</label>
                      <input
                        type="number"
                        className="input"
                        value={formData.compensation || ''}
                        onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                        placeholder="Optional compensation"
                        min="0"
                      />
                    </div>
                  )}
                  <div>
                    <label className="label">Resolution Notes</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={formData.resolution || ''}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                      placeholder="Explain the resolution decision..."
                    />
                  </div>
                </div>
              </>
            )}

            {/* Add Dispute Note Modal */}
            {showModal === 'addDisputeNote' && (
              <>
                <h2 className="text-xl font-bold mb-4">Add Internal Note</h2>
                <div className="space-y-4">
                  <div className="bg-dark-700 p-3 rounded-lg">
                    <div className="text-sm text-dark-400">Dispute for Match</div>
                    <div className="font-medium">{selectedItem?.match?.title || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="label">Internal Note</label>
                    <textarea
                      className="input min-h-[100px]"
                      value={formData.note || ''}
                      onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                      placeholder="Add an internal note (only visible to admins)..."
                    />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      ℹ️ This note is for internal use only and won't be visible to the user.
                    </p>
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
