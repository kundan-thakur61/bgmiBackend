'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api, getMatches } from '@/lib/api';
import { formatCurrency, formatDateTime, debounce } from '@/lib/utils';

// ─── Reusable Components ───────────────────────────────────────

function StatCard({ label, value, sub, icon, trend, color = 'text-white', onClick }) {
  return (
    <button onClick={onClick} className={`card p-5 text-left transition-all hover:ring-1 hover:ring-primary-500/40 ${onClick ? 'cursor-pointer' : 'cursor-default'}`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-dark-400 text-xs font-medium uppercase tracking-wider">{label}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          {sub && <p className="text-dark-400 text-xs mt-1 truncate">{sub}</p>}
        </div>
        {icon && <span className="text-2xl flex-shrink-0 ml-2">{icon}</span>}
      </div>
      {trend !== undefined && trend !== null && (
        <div className={`text-xs mt-2 font-medium ${parseFloat(trend) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {parseFloat(trend) >= 0 ? '↑' : '↓'} {Math.abs(parseFloat(trend))}% vs yesterday
        </div>
      )}
    </button>
  );
}

function Badge({ status }) {
  const colors = {
    upcoming: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    registration_open: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    live: 'bg-green-500/20 text-green-400 border-green-500/30 animate-pulse',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    result_pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    under_review: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    processing: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    in_progress: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
    closed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    ongoing: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    waiting_for_user: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide border ${colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
      {status?.replace(/_/g, ' ')}
    </span>
  );
}

function RoleBadge({ role }) {
  const colors = {
    super_admin: 'bg-red-500/20 text-red-400',
    admin: 'bg-purple-500/20 text-purple-400',
    match_manager: 'bg-blue-500/20 text-blue-400',
    finance_manager: 'bg-emerald-500/20 text-emerald-400',
    support: 'bg-cyan-500/20 text-cyan-400',
    host: 'bg-amber-500/20 text-amber-400',
    user: 'bg-gray-500/20 text-gray-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${colors[role] || colors.user}`}>
      {role?.replace(/_/g, ' ')}
    </span>
  );
}

function Pagination({ page, pages, total, onPageChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-dark-400 text-sm">{total} total results</p>
      <div className="flex gap-1">
        <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="px-3 py-1 rounded bg-dark-700 text-sm disabled:opacity-30 hover:bg-dark-600 transition-colors">←</button>
        {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
          const p = page <= 3 ? i + 1 : page + i - 2;
          if (p < 1 || p > pages) return null;
          return <button key={p} onClick={() => onPageChange(p)} className={`px-3 py-1 rounded text-sm transition-colors ${p === page ? 'bg-primary-600 text-white' : 'bg-dark-700 hover:bg-dark-600'}`}>{p}</button>;
        })}
        <button onClick={() => onPageChange(page + 1)} disabled={page >= pages} className="px-3 py-1 rounded bg-dark-700 text-sm disabled:opacity-30 hover:bg-dark-600 transition-colors">→</button>
      </div>
    </div>
  );
}

function SearchBar({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400 text-sm">🔍</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="input pl-9 bg-dark-800 border-dark-600 h-9 text-sm" />
    </div>
  );
}

function EmptyState({ icon = '📭', message = 'No data found' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-dark-400">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

function MiniBar({ data = [], maxVal, color = 'bg-primary-500' }) {
  const max = maxVal || Math.max(...data.map(d => d.value || d.count || d.total || 0), 1);
  return (
    <div className="flex items-end gap-[2px] h-8">
      {data.slice(-14).map((d, i) => {
        const val = d.value || d.count || d.total || 0;
        const h = Math.max((val / max) * 100, 4);
        return <div key={i} className={`w-2 rounded-t ${color} opacity-70 hover:opacity-100 transition-opacity`} style={{ height: `${h}%` }} title={`${d._id || d.label}: ${val}`} />;
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // UI state
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});

  // Data states
  const [dashboard, setDashboard] = useState(null);
  const [matches, setMatches] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [kycRequests, setKycRequests] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [disputeStats, setDisputeStats] = useState(null);
  const [reports, setReports] = useState({ revenue: null, users: null, matches: null, referrals: null });
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [matchParticipants, setMatchParticipants] = useState([]);

  // New enhanced states
  const [systemHealth, setSystemHealth] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(null);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminStaff, setAdminStaff] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txnStats, setTxnStats] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [platformSettings, setPlatformSettings] = useState(null);
  const [notifStats, setNotifStats] = useState(null);

  // Pagination / filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [filterStatus, setFilterStatus] = useState('');
  const [period, setPeriod] = useState('7d');

  // Auto dismiss alerts
  useEffect(() => {
    if (success) { const t = setTimeout(() => setSuccess(''), 4000); return () => clearTimeout(t); }
  }, [success]);
  useEffect(() => {
    if (error) { const t = setTimeout(() => setError(''), 6000); return () => clearTimeout(t); }
  }, [error]);

  // Auth guard
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) router.push('/login');
      else if (!['admin', 'super_admin', 'match_manager', 'finance_manager', 'support'].includes(user?.role)) router.push('/');
    }
  }, [authLoading, isAuthenticated, user, router]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && ['admin', 'super_admin', 'match_manager', 'finance_manager', 'support'].includes(user?.role)) {
      fetchDashboard();
    }
  }, [isAuthenticated, user]);

  // Tab data loading
  useEffect(() => {
    if (isAuthenticated) loadTabData(activeTab);
  }, [activeTab, isAuthenticated, pagination.page, filterStatus, period]);

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isFinance = isAdmin || user?.role === 'finance_manager';
  const isMatchMgr = isAdmin || user?.role === 'match_manager';
  const isSupport = isAdmin || user?.role === 'support';

  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboardEnhanced();
      setDashboard(data.dashboard);
    } catch {
      // Fallback to basic dashboard
      try {
        const data = await api.getAdminStats();
        setDashboard(data);
      } catch (err) {
        console.error('Dashboard load failed', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async (tab) => {
    try {
      switch (tab) {
        case 'matches': {
          const d = await getMatches({ limit: 50 });
          setMatches(d.matches || []);
          break;
        }
        case 'tournaments': {
          const d = await api.getTournaments({ limit: 50, status: 'upcoming,registration_open,ongoing,completed' });
          setTournaments(d.tournaments || []);
          break;
        }
        case 'users': {
          const d = await api.getAdminUsers({ limit: 30, page: pagination.page, search: searchQuery });
          setUsers(d.users || []);
          if (d.pagination) setPagination(d.pagination);
          break;
        }
        case 'withdrawals': {
          const d = await api.getPendingWithdrawals();
          setWithdrawals(d.withdrawals || []);
          break;
        }
        case 'kyc': {
          const d = await api.getPendingKYC();
          setKycRequests(d.kycs || []);
          break;
        }
        case 'tickets': {
          const d = await api.getAllTickets({ limit: 50 });
          setTickets(d.tickets || []);
          break;
        }
        case 'announcements': {
          const d = await api.getAnnouncements();
          setAnnouncements(d.announcements || []);
          break;
        }
        case 'disputes': {
          const [dd, ds] = await Promise.all([
            api.getAllDisputes({ limit: 50 }),
            api.getDisputeStats()
          ]);
          setDisputes(dd.disputes || []);
          setDisputeStats(ds.stats || null);
          break;
        }
        case 'reports': {
          const [rev, usr, mch, ref] = await Promise.all([
            api.getRevenueReport(),
            api.getUsersReport(),
            api.getMatchesReport(),
            api.getReferralsReport()
          ]);
          setReports({ revenue: rev.report, users: usr.report, matches: mch.report, referrals: ref.stats });
          break;
        }
        case 'system': {
          const [health, online, settings] = await Promise.all([
            api.getSystemHealth().catch(() => null),
            api.getOnlineUsers().catch(() => null),
            api.getPlatformSettings().catch(() => null)
          ]);
          if (health) setSystemHealth(health.health);
          if (online) setOnlineUsers(online);
          if (settings) setPlatformSettings(settings.settings);
          break;
        }
        case 'logs': {
          const d = await api.getAdminLogs({ page: pagination.page, limit: 50 });
          setAdminLogs(d.logs || []);
          if (d.pagination) setPagination(d.pagination);
          break;
        }
        case 'staff': {
          const d = await api.getAdminStaff();
          setAdminStaff(d.staff || []);
          break;
        }
        case 'transactions': {
          const d = await api.getAdminTransactions({ page: pagination.page, limit: 30, search: searchQuery, ...(filterStatus && { category: filterStatus }) });
          setTransactions(d.transactions || []);
          setTxnStats(d.stats || null);
          if (d.pagination) setPagination(d.pagination);
          break;
        }
        case 'analytics': {
          const [ua, ra, ns] = await Promise.all([
            api.getUserGrowthAnalytics({ period }).catch(() => null),
            api.getRevenueAnalytics({ period }).catch(() => null),
            api.getNotificationStats({ period }).catch(() => null)
          ]);
          if (ua) setUserAnalytics(ua.analytics);
          if (ra) setRevenueAnalytics(ra.analytics);
          if (ns) setNotifStats(ns.stats);
          break;
        }
      }
    } catch (err) {
      console.error(`Failed to load ${tab}:`, err);
    }
  };

  const handleAction = async (action, item) => {
    setError(''); setSuccess(''); setActionLoading(true);
    try {
      switch (action) {
        case 'startMatch': await api.startMatch(item._id); setSuccess('Match started'); loadTabData('matches'); break;
        case 'completeMatch': await api.completeMatch(item._id); setSuccess('Match completed'); setShowModal(null); loadTabData('matches'); break;
        case 'declareWinners': await api.declareWinners(item._id, formData.winners || []); setSuccess('Winners declared'); setShowModal(null); loadTabData('matches'); break;
        case 'cancelMatch': await api.cancelMatch(item._id, formData.reason); setSuccess('Match cancelled'); setShowModal(null); loadTabData('matches'); break;
        case 'setRoomCredentials':
        case 'roomCredentials':
          await api.setRoomCredentials(selectedItem._id, formData.roomId, formData.password); setSuccess('Room credentials set'); setShowModal(null); loadTabData('matches'); break;
        case 'deleteMatch': await api.deleteMatch(item._id); setSuccess('Match deleted'); setShowModal(null); loadTabData('matches'); break;
        case 'approveWithdrawal': await api.approveWithdrawal(item._id); setSuccess('Withdrawal approved'); loadTabData('withdrawals'); break;
        case 'rejectWithdrawal': await api.rejectWithdrawal(item._id, formData.reason); setSuccess('Withdrawal rejected'); setShowModal(null); loadTabData('withdrawals'); break;
        case 'approveKYC': await api.approveKYC(item._id); setSuccess('KYC approved'); loadTabData('kyc'); break;
        case 'rejectKYC': await api.rejectKYC(item._id, formData.reason); setSuccess('KYC rejected'); setShowModal(null); loadTabData('kyc'); break;
        case 'banUser': await api.banUser(item._id, formData.reason); setSuccess('User banned'); setShowModal(null); loadTabData('users'); break;
        case 'unbanUser': await api.unbanUser(item._id); setSuccess('User unbanned'); loadTabData('users'); break;
        case 'changeRole': await api.changeUserRole(selectedItem._id, formData.role); setSuccess(`Role changed to ${formData.role}`); setShowModal(null); loadTabData('users'); break;
        case 'adjustWallet': await api.adjustUserWallet(selectedItem._id, Math.abs(parseInt(formData.amount)), formData.adjustType, formData.reason); setSuccess('Wallet adjusted'); setShowModal(null); loadTabData('users'); break;
        case 'forceLogout': await api.forceLogoutUser(item._id); setSuccess('User force logged out'); break;
        case 'resolveTicket': await api.resolveTicket(item._id, formData.resolution); setSuccess('Ticket resolved'); setShowModal(null); loadTabData('tickets'); break;
        case 'replyTicket': await api.addTicketMessage(item._id, formData.message); setSuccess('Reply sent'); setShowModal(null); loadTabData('tickets'); break;
        case 'createAnnouncement': await api.createAnnouncement(formData); setSuccess('Announcement created'); setShowModal(null); loadTabData('announcements'); break;
        case 'deleteAnnouncement': await api.deleteAnnouncement(item._id); setSuccess('Announcement deleted'); loadTabData('announcements'); break;
        case 'resolveDispute': await api.resolveDispute(selectedItem._id, { resolution: formData.resolution, decision: formData.decision, compensation: formData.compensation ? parseInt(formData.compensation) : 0 }); setSuccess('Dispute resolved'); setShowModal(null); loadTabData('disputes'); break;
        case 'addDisputeNote': await api.addDisputeNote(selectedItem._id, formData.note); setSuccess('Note added'); setShowModal(null); loadTabData('disputes'); break;
        case 'assignDispute': await api.assignDispute(selectedItem._id, user._id); setSuccess('Dispute assigned to you'); loadTabData('disputes'); break;
        case 'createMatch': {
          if (!formData.title || formData.title.trim().length < 3) throw new Error('Title must be at least 3 characters');
          if (!formData.scheduledAt) throw new Error('Scheduled date is required');
          const md = { title: formData.title.trim(), gameType: formData.gameType || 'pubg_mobile', matchType: formData.matchType || 'match_win', mode: formData.mode || 'solo', map: formData.map || 'erangel', entryFee: parseInt(formData.entryFee) || 0, prizePool: parseInt(formData.prizePool) || 0, maxSlots: parseInt(formData.maxSlots) || 2, scheduledAt: new Date(formData.scheduledAt).toISOString() };
          if (new Date(md.scheduledAt) <= new Date()) throw new Error('Scheduled date must be in the future');
          await api.createMatch(md); setSuccess('Match created'); setShowModal(null); setFormData({}); loadTabData('matches'); break;
        }
        case 'createTournament': await api.createTournament(formData); setSuccess('Tournament created'); setShowModal(null); loadTabData('tournaments'); break;
        case 'deleteTournament': await api.deleteTournament(item._id); setSuccess('Tournament deleted'); loadTabData('tournaments'); break;
        case 'completeTournament': await api.completeTournament(item._id); setSuccess('Tournament completed'); setShowModal(null); loadTabData('tournaments'); break;
        case 'cancelTournament': await api.cancelTournament(item._id, formData.reason); setSuccess('Tournament cancelled'); setShowModal(null); loadTabData('tournaments'); break;
        case 'sendBroadcast': {
          const result = await api.broadcastNotification({ title: formData.title, message: formData.message, type: formData.notificationType || 'announcement', url: formData.url || '/', targetAudience: formData.targetAudience || 'all', level: formData.level });
          setBroadcastResult(result.results); setSuccess(`Broadcast sent to ${result.results.notificationsCreated} users`); setShowModal(null); break;
        }
      }
      fetchDashboard();
    } catch (err) {
      setError(err.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      setActionLoading(true);
      await api.exportAdminData(type);
      setSuccess(`${type} data exported successfully`);
    } catch {
      setError('Export failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openDeclareWinners = async (match) => {
    setSelectedItem(match);
    setFormData({ winners: [{ userId: '', position: 1, kills: 0 }] });
    setMatchParticipants([]);
    setShowModal('declareWinners');
    try {
      const data = await api.getMatch(match._id);
      setMatchParticipants(data?.match?.joinedUsers || []);
    } catch { setError('Failed to load participants'); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(debounce((q) => {
    setSearchQuery(q);
    setPagination(p => ({ ...p, page: 1 }));
  }, 400), []);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-dark-400 text-sm">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!user || !['admin', 'super_admin', 'match_manager', 'finance_manager', 'support'].includes(user?.role)) return null;

  // ─── Menu Items (role-aware) ─────────────────────

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'matches', label: 'Matches', icon: '🎮', show: isMatchMgr },
    { id: 'tournaments', label: 'Tournaments', icon: '🏆', show: isMatchMgr },
    { id: 'users', label: 'Users', icon: '👥', show: isAdmin },
    { id: 'transactions', label: 'Transactions', icon: '💳', show: isFinance },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💸', show: isFinance },
    { id: 'kyc', label: 'KYC Queue', icon: '📋', show: isSupport },
    { id: 'disputes', label: 'Disputes', icon: '⚖️', show: isSupport },
    { id: 'tickets', label: 'Tickets', icon: '🎫', show: isSupport },
    { id: 'analytics', label: 'Analytics', icon: '📈', show: isAdmin },
    { id: 'reports', label: 'Reports', icon: '📊', show: isAdmin },
    { id: 'broadcast', label: 'Broadcast', icon: '📣', show: isAdmin },
    { id: 'announcements', label: 'Announcements', icon: '📢', show: isAdmin },
    { id: 'staff', label: 'Staff', icon: '🛡️', show: isAdmin },
    { id: 'logs', label: 'Activity Logs', icon: '📜', show: isAdmin },
    { id: 'system', label: 'System', icon: '⚙️', show: isAdmin },
  ].filter(item => item.show === undefined || item.show);

  // ─── Render ──────────────────────────────────────

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* ── Sidebar ── */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-16'} bg-dark-800 border-r border-dark-700 flex flex-col fixed h-full transition-all duration-200 z-20`}>
        <div className="p-3 border-b border-dark-700 flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-gaming-purple rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            {sidebarOpen && <span className="text-lg font-bold truncate">Admin</span>}
          </Link>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="ml-auto text-dark-400 hover:text-white p-1">
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto scrollbar-thin">
          <ul className="space-y-0.5 px-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button onClick={() => { setActiveTab(item.id); setPagination({ page: 1, pages: 1, total: 0 }); setSearchQuery(''); setFilterStatus(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === item.id ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/20' : 'text-dark-300 hover:bg-dark-700 hover:text-white'}`}
                  title={item.label}>
                  <span className="text-base flex-shrink-0">{item.icon}</span>
                  {sidebarOpen && <span className="truncate">{item.label}</span>}
                  {/* Live badges */}
                  {sidebarOpen && item.id === 'withdrawals' && dashboard?.withdrawals?.pending > 0 && (
                    <span className="ml-auto bg-yellow-500 text-dark-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dashboard.withdrawals.pending}</span>
                  )}
                  {sidebarOpen && item.id === 'kyc' && dashboard?.support?.pendingKyc > 0 && (
                    <span className="ml-auto bg-yellow-500 text-dark-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dashboard.support.pendingKyc}</span>
                  )}
                  {sidebarOpen && item.id === 'disputes' && dashboard?.support?.pendingDisputes > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dashboard.support.pendingDisputes}</span>
                  )}
                  {sidebarOpen && item.id === 'tickets' && dashboard?.support?.urgentTickets > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dashboard.support.urgentTickets}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-2 border-t border-dark-700 space-y-1">
          {sidebarOpen && (
            <div className="px-3 py-2 text-xs text-dark-500 truncate">
              {user?.name} • <span className="capitalize">{user?.role?.replace(/_/g, ' ')}</span>
            </div>
          )}
          <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-400 hover:text-white hover:bg-dark-700 transition-colors">
            <span>←</span>
            {sidebarOpen && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-60' : 'ml-16'} transition-all duration-200 min-h-screen`}>
        {/* Header */}
        <header className="bg-dark-800/80 backdrop-blur-lg border-b border-dark-700 px-6 py-3 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold capitalize">{activeTab === 'overview' ? 'Dashboard' : activeTab.replace(/_/g, ' ')}</h1>
              {activeTab === 'system' && systemHealth && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${systemHealth.status === 'healthy' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {systemHealth.status?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => { fetchDashboard(); loadTabData(activeTab); }} className="text-dark-400 hover:text-white transition-colors text-sm" title="Refresh">🔄</button>
              <RoleBadge role={user?.role} />
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Alerts */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-center justify-between animate-in">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">✕</button>
            </div>
          )}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg flex items-center justify-between animate-in">
              <span>✓ {success}</span>
              <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-300">✕</button>
            </div>
          )}

          {/* ══════════════════ OVERVIEW TAB ══════════════════ */}
          {activeTab === 'overview' && dashboard && (
            <>
              {/* Primary stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard label="Total Users" value={dashboard.users?.total || 0} sub={`+${dashboard.users?.newToday || 0} today`} icon="👥" trend={dashboard.users?.growthPercent} onClick={() => setActiveTab('users')} />
                <StatCard label="Revenue Today" value={formatCurrency(dashboard.revenue?.today || 0)} sub={`${dashboard.revenue?.todayTransactions || 0} transactions`} icon="💰" color="text-gaming-green" trend={dashboard.revenue?.changePercent} onClick={() => setActiveTab('transactions')} />
                <StatCard label="Active Matches" value={dashboard.matches?.active || 0} sub={`${dashboard.matches?.live || 0} live now`} icon="🎮" color="text-blue-400" onClick={() => setActiveTab('matches')} />
                <StatCard label="Pending W/D" value={dashboard.withdrawals?.pending || 0} sub={formatCurrency(dashboard.withdrawals?.pendingAmount || 0)} icon="💸" color="text-yellow-400" onClick={() => setActiveTab('withdrawals')} />
                <StatCard label="Open Tickets" value={dashboard.support?.openTickets || 0} sub={`${dashboard.support?.urgentTickets || 0} urgent`} icon="🎫" color={dashboard.support?.urgentTickets > 0 ? 'text-orange-400' : 'text-white'} onClick={() => setActiveTab('tickets')} />
                <StatCard label="Disputes" value={dashboard.support?.pendingDisputes || 0} sub={`${dashboard.support?.pendingKyc || 0} KYC pending`} icon="⚖️" color="text-red-400" onClick={() => setActiveTab('disputes')} />
              </div>

              {/* Revenue week/month + deposits */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="card p-4">
                  <p className="text-dark-400 text-xs uppercase mb-1">Week Revenue</p>
                  <p className="text-xl font-bold text-gaming-green">{formatCurrency(dashboard.revenue?.thisWeek || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-dark-400 text-xs uppercase mb-1">Month Revenue</p>
                  <p className="text-xl font-bold text-gaming-green">{formatCurrency(dashboard.revenue?.thisMonth || 0)}</p>
                </div>
                <div className="card p-4">
                  <p className="text-dark-400 text-xs uppercase mb-1">Deposits Today</p>
                  <p className="text-xl font-bold text-blue-400">{formatCurrency(dashboard.deposits?.today || 0)}</p>
                  <p className="text-dark-500 text-xs">{dashboard.deposits?.todayCount || 0} deposits</p>
                </div>
                <div className="card p-4">
                  <p className="text-dark-400 text-xs uppercase mb-1">Active Today</p>
                  <p className="text-xl font-bold">{dashboard.users?.activeToday || 0}</p>
                  <p className="text-dark-500 text-xs">{dashboard.users?.kycVerified || 0} KYC verified</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card p-5">
                <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[
                    { icon: '➕', label: 'Create Match', action: () => { setActiveTab('matches'); setShowModal('createMatch'); setFormData({ gameType: 'pubg_mobile', matchType: 'match_win', mode: 'solo', map: 'erangel', entryFee: 50, prizePool: 400, maxSlots: 100 }); } },
                    { icon: '🏆', label: 'Tournaments', action: () => setActiveTab('tournaments') },
                    { icon: '💸', label: `Withdrawals (${dashboard?.withdrawals?.pending || 0})`, action: () => setActiveTab('withdrawals'), show: isFinance },
                    { icon: '📋', label: `KYC (${dashboard?.support?.pendingKyc || 0})`, action: () => setActiveTab('kyc'), show: isSupport },
                    { icon: '⚖️', label: `Disputes (${dashboard?.support?.pendingDisputes || 0})`, action: () => setActiveTab('disputes'), show: isSupport },
                    { icon: '📈', label: 'Analytics', action: () => setActiveTab('analytics'), show: isAdmin },
                    { icon: '📣', label: 'Broadcast', action: () => setActiveTab('broadcast'), show: isAdmin },
                    { icon: '📥', label: 'Export Data', action: () => handleExport('users'), show: isAdmin },
                  ].filter(a => a.show === undefined || a.show).map((a, i) => (
                    <button key={i} onClick={a.action} className="bg-dark-700 hover:bg-dark-600 rounded-lg p-3 text-center transition-colors group">
                      <span className="text-xl block group-hover:scale-110 transition-transform">{a.icon}</span>
                      <span className="text-[11px] text-dark-300 mt-1 block truncate">{a.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Activity + Recent Logins */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Recent Activity</h2>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {(dashboard.recentActivity || []).map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm py-1.5 border-b border-dark-700/50 last:border-0">
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${log.severity === 'high' || log.severity === 'critical' ? 'bg-red-400' : log.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'}`} />
                        <div className="min-w-0">
                          <p className="text-dark-200 truncate">{log.description}</p>
                          <p className="text-dark-500 text-xs">{log.admin?.name} • {formatDateTime(log.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {(!dashboard.recentActivity || dashboard.recentActivity.length === 0) && <p className="text-dark-500 text-sm">No recent activity</p>}
                  </div>
                </div>

                <div className="card p-5">
                  <h2 className="text-sm font-semibold text-dark-400 uppercase tracking-wider mb-3">Recent Logins Today</h2>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {(dashboard.recentLogins || []).map((u, i) => (
                      <div key={i} className="flex items-center gap-3 py-1.5 border-b border-dark-700/50 last:border-0">
                        <div className="w-7 h-7 rounded-full bg-dark-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm truncate">{u.name}</p>
                          <p className="text-dark-500 text-xs capitalize">{u.level} • {u.role?.replace(/_/g, ' ')}</p>
                        </div>
                        <span className="text-dark-500 text-xs flex-shrink-0">{formatDateTime(u.lastLoginAt)}</span>
                      </div>
                    ))}
                    {(!dashboard.recentLogins || dashboard.recentLogins.length === 0) && <p className="text-dark-500 text-sm">No logins today</p>}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══════════════════ MATCHES TAB ══════════════════ */}
          {activeTab === 'matches' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-bold">Matches ({matches.length})</h2>
                <button onClick={() => { setShowModal('createMatch'); setFormData({ gameType: 'pubg_mobile', matchType: 'match_win', mode: 'solo', map: 'erangel', entryFee: 50, prizePool: 400, maxSlots: 100 }); }} className="btn-primary text-sm h-9">+ Create Match</button>
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">Title</th>
                    <th className="text-left p-3 font-medium text-dark-400">Type</th>
                    <th className="text-left p-3 font-medium text-dark-400">Fee / Prize</th>
                    <th className="text-left p-3 font-medium text-dark-400">Slots</th>
                    <th className="text-left p-3 font-medium text-dark-400">Status</th>
                    <th className="text-left p-3 font-medium text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr key={m._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3"><div className="font-medium">{m.title}</div><div className="text-dark-500 text-xs">{formatDateTime(m.scheduledAt)}</div></td>
                        <td className="p-3 capitalize text-dark-300">{m.gameType?.replace('_', ' ')} • {m.matchType}</td>
                        <td className="p-3">₹{m.entryFee} / ₹{m.prizePool}</td>
                        <td className="p-3">{m.participants?.length || m.filledSlots || 0}/{m.maxSlots}</td>
                        <td className="p-3"><Badge status={m.status} /></td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {m.status === 'upcoming' && <>
                              <button onClick={() => { setSelectedItem(m); setShowModal('roomCredentials'); setFormData({}); }} className="text-blue-400 hover:text-blue-300 text-xs px-1.5 py-0.5 rounded bg-blue-500/10">{m.roomCredentialsVisible ? 'Edit Room' : 'Set Room'}</button>
                              <button onClick={() => handleAction('startMatch', m)} disabled={!m.roomCredentialsVisible} className={`text-xs px-1.5 py-0.5 rounded ${m.roomCredentialsVisible ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20' : 'text-dark-500 bg-dark-700 cursor-not-allowed'}`}>Start</button>
                              <button onClick={() => { setSelectedItem(m); setShowModal('cancelMatch'); setFormData({}); }} className="text-red-400 hover:text-red-300 text-xs px-1.5 py-0.5 rounded bg-red-500/10">Cancel</button>
                            </>}
                            {m.status === 'live' && <button onClick={() => { setSelectedItem(m); setShowModal('completeMatch'); }} className="text-green-400 text-xs px-1.5 py-0.5 rounded bg-green-500/10">Complete</button>}
                            {m.status === 'result_pending' && <button onClick={() => openDeclareWinners(m)} className="text-primary-400 text-xs px-1.5 py-0.5 rounded bg-primary-500/10">Declare Winners</button>}
                            <button onClick={() => { setSelectedItem(m); setShowModal('deleteMatch'); }} className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/10">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {matches.length === 0 && <EmptyState icon="🎮" message="No matches found" />}
              </div>
            </div>
          )}

          {/* ══════════════════ TOURNAMENTS TAB ══════════════════ */}
          {activeTab === 'tournaments' && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-bold">Tournaments ({tournaments.length})</h2>
                <button onClick={() => { setShowModal('createTournament'); setFormData({ gameType: 'pubg_mobile', format: 'battle_royale', mode: 'squad', entryFee: 100, prizePool: 10000, maxTeams: 100 }); }} className="btn-primary text-sm h-9">+ Create Tournament</button>
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">Title</th>
                    <th className="text-left p-3 font-medium text-dark-400">Format</th>
                    <th className="text-left p-3 font-medium text-dark-400">Prize Pool</th>
                    <th className="text-left p-3 font-medium text-dark-400">Teams</th>
                    <th className="text-left p-3 font-medium text-dark-400">Status</th>
                    <th className="text-left p-3 font-medium text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {tournaments.map((t) => (
                      <tr key={t._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3"><div className="font-medium">{t.title}</div><div className="text-dark-500 text-xs">{formatDateTime(t.startAt)}</div></td>
                        <td className="p-3 capitalize">{t.format?.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-gaming-green">{formatCurrency(t.prizePool)}</td>
                        <td className="p-3">{t.registeredTeams || 0}/{t.maxTeams}</td>
                        <td className="p-3"><Badge status={t.status} /></td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            <Link href={`/tournaments/${t._id}`} className="text-primary-400 text-xs px-1.5 py-0.5 rounded bg-primary-500/10">View</Link>
                            {t.status === 'ongoing' && <button onClick={() => { setSelectedItem(t); setShowModal('completeTournament'); }} className="text-green-400 text-xs px-1.5 py-0.5 rounded bg-green-500/10">Complete</button>}
                            {!['completed', 'cancelled'].includes(t.status) && <button onClick={() => { setSelectedItem(t); setShowModal('cancelTournament'); setFormData({}); }} className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/10">Cancel</button>}
                            <button onClick={() => { setSelectedItem(t); setShowModal('deleteTournament'); }} className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/10">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tournaments.length === 0 && <EmptyState icon="🏆" message="No tournaments found" />}
              </div>
            </div>
          )}

          {/* ══════════════════ USERS TAB ══════════════════ */}
          {activeTab === 'users' && isAdmin && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-bold">User Management</h2>
                <div className="flex gap-2">
                  <SearchBar value="" onChange={debouncedSearch} placeholder="Search users..." />
                  <button onClick={() => handleExport('users')} className="btn-secondary text-xs h-9 px-3">📥 Export</button>
                </div>
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">User</th>
                    <th className="text-left p-3 font-medium text-dark-400">Phone</th>
                    <th className="text-left p-3 font-medium text-dark-400">Role</th>
                    <th className="text-left p-3 font-medium text-dark-400">Level</th>
                    <th className="text-left p-3 font-medium text-dark-400">Balance</th>
                    <th className="text-left p-3 font-medium text-dark-400">Status</th>
                    <th className="text-left p-3 font-medium text-dark-400">Joined</th>
                    <th className="text-left p-3 font-medium text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3"><div className="font-medium">{u.name}</div><div className="text-dark-500 text-xs">{u.email}</div></td>
                        <td className="p-3 text-dark-300">{u.phone}</td>
                        <td className="p-3"><RoleBadge role={u.role} /></td>
                        <td className="p-3 capitalize text-dark-300">{u.level || 'bronze'}</td>
                        <td className="p-3 text-gaming-green font-medium">{formatCurrency(u.walletBalance || 0)}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-xs ${u.isBanned ? 'text-red-400' : 'text-green-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${u.isBanned ? 'bg-red-400' : 'bg-green-400'}`} />
                            {u.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-dark-500 text-xs">{formatDateTime(u.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            <button onClick={() => { setSelectedItem(u); setShowModal('adjustWallet'); setFormData({ adjustType: 'credit' }); }} className="text-primary-400 text-xs px-1.5 py-0.5 rounded bg-primary-500/10">Wallet</button>
                            <button onClick={() => { setSelectedItem(u); setShowModal('changeRole'); setFormData({ role: u.role }); }} className="text-blue-400 text-xs px-1.5 py-0.5 rounded bg-blue-500/10">Role</button>
                            {u.isBanned ? (
                              <button onClick={() => handleAction('unbanUser', u)} className="text-green-400 text-xs px-1.5 py-0.5 rounded bg-green-500/10">Unban</button>
                            ) : (
                              <button onClick={() => { setSelectedItem(u); setShowModal('banUser'); setFormData({}); }} className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-500/10">Ban</button>
                            )}
                            <button onClick={() => handleAction('forceLogout', u)} className="text-orange-400 text-xs px-1.5 py-0.5 rounded bg-orange-500/10" title="Force logout">⏏</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <EmptyState icon="👥" message="No users found" />}
              </div>
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} />
            </div>
          )}

          {/* ══════════════════ TRANSACTIONS TAB ══════════════════ */}
          {activeTab === 'transactions' && isFinance && (
            <div className="space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-lg font-bold">Transaction Explorer</h2>
                <div className="flex gap-2">
                  <SearchBar value="" onChange={debouncedSearch} placeholder="Search transactions..." />
                  <select className="input bg-dark-800 border-dark-600 h-9 text-sm w-36" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}>
                    <option value="">All Categories</option>
                    <option value="deposit">Deposits</option>
                    <option value="withdrawal">Withdrawals</option>
                    <option value="match_entry">Match Entry</option>
                    <option value="match_prize">Match Prize</option>
                    <option value="admin_credit">Admin Credit</option>
                    <option value="admin_debit">Admin Debit</option>
                    <option value="referral_bonus">Referral Bonus</option>
                  </select>
                  <button onClick={() => handleExport('transactions')} className="btn-secondary text-xs h-9 px-3">📥 Export</button>
                </div>
              </div>

              {txnStats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Total Volume" value={formatCurrency(txnStats.totalAmount || 0)} icon="💳" color="text-blue-400" />
                  <StatCard label="Avg Transaction" value={formatCurrency(txnStats.avgAmount || 0)} icon="📊" />
                  <StatCard label="Highest" value={formatCurrency(txnStats.maxAmount || 0)} icon="⬆️" color="text-gaming-green" />
                  <StatCard label="Lowest" value={formatCurrency(txnStats.minAmount || 0)} icon="⬇️" color="text-yellow-400" />
                </div>
              )}

              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">Date</th>
                    <th className="text-left p-3 font-medium text-dark-400">User</th>
                    <th className="text-left p-3 font-medium text-dark-400">Type</th>
                    <th className="text-left p-3 font-medium text-dark-400">Category</th>
                    <th className="text-right p-3 font-medium text-dark-400">Amount</th>
                    <th className="text-left p-3 font-medium text-dark-400">Status</th>
                    <th className="text-left p-3 font-medium text-dark-400">Description</th>
                  </tr></thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3 text-dark-400 text-xs whitespace-nowrap">{formatDateTime(t.createdAt)}</td>
                        <td className="p-3"><div className="font-medium text-xs">{t.user?.name}</div><div className="text-dark-500 text-xs">{t.user?.phone}</div></td>
                        <td className="p-3">
                          <span className={`text-xs font-medium ${t.type === 'credit' ? 'text-green-400' : 'text-red-400'}`}>
                            {t.type === 'credit' ? '↑ Credit' : '↓ Debit'}
                          </span>
                        </td>
                        <td className="p-3 text-xs capitalize text-dark-300">{t.category?.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-right font-medium">
                          <span className={t.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
                            {t.type === 'credit' ? '+' : '-'}{formatCurrency(t.amount)}
                          </span>
                        </td>
                        <td className="p-3"><Badge status={t.status} /></td>
                        <td className="p-3 text-dark-400 text-xs max-w-[200px] truncate">{t.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && <EmptyState icon="💳" message="No transactions found" />}
              </div>
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} />
            </div>
          )}

          {/* ══════════════════ WITHDRAWALS TAB ══════════════════ */}
          {activeTab === 'withdrawals' && isFinance && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Pending Withdrawals ({withdrawals.length})</h2>
                <button onClick={() => handleExport('withdrawals')} className="btn-secondary text-xs h-9 px-3">📥 Export</button>
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">User</th>
                    <th className="text-right p-3 font-medium text-dark-400">Amount</th>
                    <th className="text-left p-3 font-medium text-dark-400">Method</th>
                    <th className="text-left p-3 font-medium text-dark-400">Details</th>
                    <th className="text-left p-3 font-medium text-dark-400">Requested</th>
                    <th className="text-left p-3 font-medium text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {withdrawals.map((w) => (
                      <tr key={w._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3"><div className="font-medium">{w.user?.name}</div><div className="text-dark-500 text-xs">{w.user?.phone}</div></td>
                        <td className="p-3 text-right font-bold text-gaming-green">{formatCurrency(w.amount)}</td>
                        <td className="p-3 capitalize">{w.method}</td>
                        <td className="p-3 text-dark-400 text-xs">{w.upiId || w.accountDetails?.upiId || w.accountDetails?.accountNumber || w.bankDetails?.accountNumber || '—'}</td>
                        <td className="p-3 text-dark-500 text-xs">{formatDateTime(w.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleAction('approveWithdrawal', w)} className="text-green-400 text-xs px-2 py-1 rounded bg-green-500/10 hover:bg-green-500/20">✓ Approve</button>
                            <button onClick={() => { setSelectedItem(w); setShowModal('rejectWithdrawal'); setFormData({}); }} className="text-red-400 text-xs px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20">✕ Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {withdrawals.length === 0 && <EmptyState icon="💸" message="No pending withdrawals" />}
              </div>
            </div>
          )}

          {/* ══════════════════ KYC TAB ══════════════════ */}
          {activeTab === 'kyc' && isSupport && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">KYC Verification Queue ({kycRequests.length})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {kycRequests.map((kyc) => (
                  <div key={kyc._id} className="card p-4 hover:ring-1 hover:ring-dark-600 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div><div className="font-medium">{kyc.name || kyc.fullName}</div><div className="text-dark-500 text-xs">{kyc.user?.phone}</div></div>
                      <Badge status="pending" />
                    </div>
                    <div className="text-xs space-y-1 text-dark-300 mb-3">
                      <div>📄 {kyc.documentType?.replace(/_/g, ' ')?.toUpperCase()}</div>
                      <div>🔢 {kyc.maskedDocumentNumber || kyc.documentNumber}</div>
                      {kyc.dateOfBirth && <div>🎂 {formatDateTime(kyc.dateOfBirth)}</div>}
                    </div>
                    {kyc.documents?.documentFront?.url && (
                      <div className="mb-3"><img src={kyc.documents.documentFront.url} alt="Doc" className="w-full h-28 object-cover rounded border border-dark-700" /></div>
                    )}
                    <div className="flex gap-2">
                      <button onClick={() => handleAction('approveKYC', kyc)} className="btn-primary flex-1 text-xs py-2">✓ Approve</button>
                      <button onClick={() => { setSelectedItem(kyc); setShowModal('rejectKYC'); setFormData({}); }} className="btn-secondary flex-1 text-xs py-2">✕ Reject</button>
                    </div>
                  </div>
                ))}
              </div>
              {kycRequests.length === 0 && <EmptyState icon="📋" message="No pending KYC requests" />}
            </div>
          )}

          {/* ══════════════════ TICKETS TAB ══════════════════ */}
          {activeTab === 'tickets' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Support Tickets ({tickets.length})</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">Subject</th>
                    <th className="text-left p-3 font-medium text-dark-400">User</th>
                    <th className="text-left p-3 font-medium text-dark-400">Category</th>
                    <th className="text-left p-3 font-medium text-dark-400">Priority</th>
                    <th className="text-left p-3 font-medium text-dark-400">Status</th>
                    <th className="text-left p-3 font-medium text-dark-400">Created</th>
                    <th className="text-left p-3 font-medium text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {tickets.map((t) => (
                      <tr key={t._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3"><div className="font-medium">{t.subject}</div></td>
                        <td className="p-3 text-dark-300">{t.user?.name}</td>
                        <td className="p-3 capitalize text-dark-300 text-xs">{t.category}</td>
                        <td className="p-3">
                          <span className={`text-xs font-medium ${t.priority === 'urgent' ? 'text-red-400' : t.priority === 'high' ? 'text-orange-400' : t.priority === 'medium' ? 'text-yellow-400' : 'text-dark-400'}`}>
                            {t.priority === 'urgent' ? '🔴' : t.priority === 'high' ? '🟠' : t.priority === 'medium' ? '🟡' : '⚪'} {t.priority}
                          </span>
                        </td>
                        <td className="p-3"><Badge status={t.status} /></td>
                        <td className="p-3 text-dark-500 text-xs">{formatDateTime(t.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => { setSelectedItem(t); setShowModal('replyTicket'); setFormData({}); }} className="text-primary-400 text-xs px-1.5 py-0.5 rounded bg-primary-500/10">Reply</button>
                            {t.status !== 'resolved' && <button onClick={() => { setSelectedItem(t); setShowModal('resolveTicket'); setFormData({}); }} className="text-green-400 text-xs px-1.5 py-0.5 rounded bg-green-500/10">Resolve</button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tickets.length === 0 && <EmptyState icon="🎫" message="No tickets found" />}
              </div>
            </div>
          )}

          {/* ══════════════════ DISPUTES TAB ══════════════════ */}
          {activeTab === 'disputes' && isSupport && (
            <div className="space-y-4">
              {disputeStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <StatCard label="Total" value={disputeStats.total || 0} icon="📊" />
                  <StatCard label="Open" value={disputeStats.open || 0} icon="🔵" color="text-blue-400" />
                  <StatCard label="In Progress" value={disputeStats.in_progress || 0} icon="🟡" color="text-yellow-400" />
                  <StatCard label="Resolved" value={disputeStats.resolved || 0} icon="🟢" color="text-green-400" />
                  <StatCard label="Rejected" value={disputeStats.rejected || 0} icon="🔴" color="text-red-400" />
                </div>
              )}
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">Match</th>
                    <th className="text-left p-3 font-medium text-dark-400">User</th>
                    <th className="text-left p-3 font-medium text-dark-400">Reason</th>
                    <th className="text-left p-3 font-medium text-dark-400">Status</th>
                    <th className="text-left p-3 font-medium text-dark-400">Assigned</th>
                    <th className="text-left p-3 font-medium text-dark-400">Date</th>
                    <th className="text-left p-3 font-medium text-dark-400">Actions</th>
                  </tr></thead>
                  <tbody>
                    {disputes.map((d) => (
                      <tr key={d._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3 font-medium">{d.match?.title || 'N/A'}</td>
                        <td className="p-3"><div>{d.submittedBy?.name || 'Unknown'}</div><div className="text-dark-500 text-xs">{d.submittedBy?.phone}</div></td>
                        <td className="p-3 text-dark-300 text-xs capitalize max-w-[120px] truncate">{d.reason?.replace(/_/g, ' ')}</td>
                        <td className="p-3"><Badge status={d.status} /></td>
                        <td className="p-3 text-dark-400 text-xs">{d.assignedTo?.name || '—'}</td>
                        <td className="p-3 text-dark-500 text-xs">{formatDateTime(d.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {!d.assignedTo && (d.status === 'open' || d.status === 'pending') && <button onClick={() => handleAction('assignDispute', d)} className="text-blue-400 text-xs px-1.5 py-0.5 rounded bg-blue-500/10">Assign</button>}
                            {!['resolved', 'rejected', 'closed'].includes(d.status) && <button onClick={() => { setSelectedItem(d); setShowModal('resolveDispute'); setFormData({ decision: 'accepted' }); }} className="text-green-400 text-xs px-1.5 py-0.5 rounded bg-green-500/10">Resolve</button>}
                            <button onClick={() => { setSelectedItem(d); setShowModal('addDisputeNote'); setFormData({}); }} className="text-primary-400 text-xs px-1.5 py-0.5 rounded bg-primary-500/10">Note</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {disputes.length === 0 && <EmptyState icon="⚖️" message="No disputes found" />}
              </div>
            </div>
          )}

          {/* ══════════════════ ANALYTICS TAB ══════════════════ */}
          {activeTab === 'analytics' && isAdmin && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Analytics</h2>
                <div className="flex gap-1 bg-dark-800 rounded-lg p-0.5">
                  {['24h', '7d', '30d', '90d', '1y'].map(p => (
                    <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1 rounded text-xs font-medium transition-colors ${period === p ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-white'}`}>{p}</button>
                  ))}
                </div>
              </div>

              {/* User Analytics */}
              {userAnalytics && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">👥 User Growth</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">Match Retention</p>
                      <p className="text-xl font-bold text-green-400">{userAnalytics.retention?.matchRetentionRate || 0}%</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">KYC Conversion</p>
                      <p className="text-xl font-bold text-blue-400">{userAnalytics.retention?.kycConversionRate || 0}%</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">Deposit Rate</p>
                      <p className="text-xl font-bold text-yellow-400">{userAnalytics.retention?.depositRate || 0}%</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">New Users ({period})</p>
                      <p className="text-xl font-bold">{userAnalytics.retention?.totalNew || 0}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-dark-500 text-xs mb-1">Registrations</p>
                      <MiniBar data={userAnalytics.registrations || []} color="bg-primary-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-dark-500 text-xs mb-1">Active Users</p>
                      <MiniBar data={userAnalytics.activeUsers || []} color="bg-green-500" />
                    </div>
                  </div>
                  {/* Level + Role distribution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-dark-500 text-xs mb-2">Level Distribution</p>
                      <div className="space-y-1">
                        {(userAnalytics.levelDistribution || []).map(l => (
                          <div key={l._id} className="flex items-center gap-2 text-xs">
                            <span className="w-16 capitalize text-dark-300">{l._id}</span>
                            <div className="flex-1 bg-dark-700 rounded-full h-2">
                              <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((l.count / (userAnalytics.retention?.totalNew || users.length || 1)) * 100, 100)}%` }} />
                            </div>
                            <span className="text-dark-400 w-10 text-right">{l.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs mb-2">Role Distribution</p>
                      <div className="space-y-1">
                        {(userAnalytics.roleDistribution || []).map(r => (
                          <div key={r._id} className="flex items-center gap-2 text-xs">
                            <span className="w-20 capitalize text-dark-300">{r._id?.replace(/_/g, ' ')}</span>
                            <div className="flex-1 bg-dark-700 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min((r.count / (userAnalytics.retention?.totalNew || users.length || 1)) * 100, 100)}%` }} />
                            </div>
                            <span className="text-dark-400 w-10 text-right">{r.count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Revenue Analytics */}
              {revenueAnalytics && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">💰 Revenue Analytics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">Entry Revenue</p>
                      <p className="text-xl font-bold text-gaming-green">{formatCurrency(revenueAnalytics.platformProfit?.totalEntryRevenue || 0)}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">Prizes Paid</p>
                      <p className="text-xl font-bold text-red-400">{formatCurrency(revenueAnalytics.platformProfit?.totalPrizesPaid || 0)}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">Net Profit</p>
                      <p className={`text-xl font-bold ${(revenueAnalytics.platformProfit?.netProfit || 0) >= 0 ? 'text-gaming-green' : 'text-red-400'}`}>{formatCurrency(revenueAnalytics.platformProfit?.netProfit || 0)}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3">
                      <p className="text-dark-400 text-xs">Profit Margin</p>
                      <p className="text-xl font-bold text-blue-400">{revenueAnalytics.platformProfit?.profitMargin || 0}%</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-dark-500 text-xs mb-1">Revenue</p>
                      <MiniBar data={revenueAnalytics.revenueTimeline || []} color="bg-green-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-dark-500 text-xs mb-1">Deposits</p>
                      <MiniBar data={revenueAnalytics.depositTimeline || []} color="bg-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-dark-500 text-xs mb-1">Withdrawals</p>
                      <MiniBar data={revenueAnalytics.withdrawalTimeline || []} color="bg-red-500" />
                    </div>
                  </div>
                  {/* Top Spenders */}
                  {revenueAnalytics.topSpenders?.length > 0 && (
                    <div className="mt-4">
                      <p className="text-dark-500 text-xs mb-2">Top Spenders</p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {revenueAnalytics.topSpenders.slice(0, 5).map((s, i) => (
                          <div key={i} className="bg-dark-700 rounded-lg p-2 text-xs">
                            <div className="font-medium truncate">#{i + 1} {s.user?.name}</div>
                            <div className="text-gaming-green">{formatCurrency(s.totalSpent)}</div>
                            <div className="text-dark-500">{s.matchCount} matches</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Stats */}
              {notifStats && (
                <div className="card p-5">
                  <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">🔔 Notification Stats</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-dark-700 rounded-lg p-3"><p className="text-dark-400 text-xs">Total Sent</p><p className="text-xl font-bold">{notifStats.totalSent}</p></div>
                    <div className="bg-dark-700 rounded-lg p-3"><p className="text-dark-400 text-xs">Read Rate</p><p className="text-xl font-bold text-green-400">{notifStats.readRate}%</p></div>
                    <div className="bg-dark-700 rounded-lg p-3"><p className="text-dark-400 text-xs">Read</p><p className="text-xl font-bold text-blue-400">{notifStats.readCount}</p></div>
                    <div className="bg-dark-700 rounded-lg p-3"><p className="text-dark-400 text-xs">Unread</p><p className="text-xl font-bold text-yellow-400">{notifStats.unreadCount}</p></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════ REPORTS TAB ══════════════════ */}
          {activeTab === 'reports' && isAdmin && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Reports</h2>
              {/* Revenue */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">💰 Revenue</h3>
                {reports.revenue ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-dark-700 rounded-lg p-4">
                      <p className="text-dark-400 text-xs">Match Entry Revenue</p>
                      <p className="text-2xl font-bold text-gaming-green">{formatCurrency(reports.revenue.revenue?.find(r => r._id === 'match_entry')?.total || 0)}</p>
                      <p className="text-dark-500 text-xs">{reports.revenue.revenue?.find(r => r._id === 'match_entry')?.count || 0} transactions</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <p className="text-dark-400 text-xs">Deposits</p>
                      <p className="text-2xl font-bold text-blue-400">{formatCurrency(reports.revenue.deposits?.total || 0)}</p>
                      <p className="text-dark-500 text-xs">{reports.revenue.deposits?.count || 0} deposits</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-4">
                      <p className="text-dark-400 text-xs">Withdrawals</p>
                      <p className="text-2xl font-bold text-red-400">{formatCurrency(reports.revenue.withdrawals?.total || 0)}</p>
                      <p className="text-dark-500 text-xs">{reports.revenue.withdrawals?.count || 0} withdrawals</p>
                    </div>
                  </div>
                ) : <p className="text-dark-500 text-sm">Loading...</p>}
              </div>
              {/* Users */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">👥 Users</h3>
                {reports.users ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-dark-700 rounded-lg p-4"><p className="text-dark-400 text-xs">Total</p><p className="text-2xl font-bold">{reports.users.total}</p></div>
                    <div className="bg-dark-700 rounded-lg p-4"><p className="text-dark-400 text-xs">Verified</p><p className="text-2xl font-bold text-green-400">{reports.users.verified}</p></div>
                    <div className="bg-dark-700 rounded-lg p-4"><p className="text-dark-400 text-xs">Banned</p><p className="text-2xl font-bold text-red-400">{reports.users.banned}</p></div>
                    <div className="bg-dark-700 rounded-lg p-4"><p className="text-dark-400 text-xs">Verification %</p><p className="text-2xl font-bold text-blue-400">{reports.users.total > 0 ? Math.round((reports.users.verified / reports.users.total) * 100) : 0}%</p></div>
                  </div>
                ) : <p className="text-dark-500 text-sm">Loading...</p>}
              </div>
              {/* Matches */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">🎮 Matches</h3>
                {reports.matches ? (
                  <div>
                    <p className="text-dark-400 text-xs mb-2">Total: <span className="text-white font-bold">{reports.matches.total}</span></p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {reports.matches.byStatus?.map(s => (
                        <div key={s._id} className="bg-dark-700 rounded-lg p-3"><Badge status={s._id} /> <span className="text-lg font-bold ml-2">{s.count}</span></div>
                      ))}
                    </div>
                    {reports.matches.byGame?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {reports.matches.byGame.map(g => (
                          <div key={g._id} className="bg-dark-700 rounded-lg px-3 py-2 text-xs">
                            <span className="capitalize">{g._id?.replace('_', ' ')}</span>: {g.count} <span className="text-gaming-green ml-1">({formatCurrency(g.totalPrize)})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : <p className="text-dark-500 text-sm">Loading...</p>}
              </div>
              {/* Referrals */}
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-dark-400 uppercase mb-3">🤝 Referrals</h3>
                {reports.referrals ? (
                  <div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-dark-700 rounded-lg p-4"><p className="text-dark-400 text-xs">Total Referrals</p><p className="text-2xl font-bold">{reports.referrals.totalReferrals}</p></div>
                      <div className="bg-dark-700 rounded-lg p-4"><p className="text-dark-400 text-xs">Earnings Paid</p><p className="text-2xl font-bold text-gaming-green">{formatCurrency(reports.referrals.totalEarnings || 0)}</p></div>
                    </div>
                    {reports.referrals.topReferrers?.length > 0 && (
                      <div className="space-y-1">
                        {reports.referrals.topReferrers.slice(0, 5).map((r, i) => (
                          <div key={r._id} className="bg-dark-700 rounded-lg px-3 py-2 flex justify-between items-center text-sm">
                            <span>#{i + 1} {r.name}</span><span className="text-primary-400">{r.referralCount} referrals</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : <p className="text-dark-500 text-sm">Loading...</p>}
              </div>
            </div>
          )}

          {/* ══════════════════ BROADCAST TAB ══════════════════ */}
          {activeTab === 'broadcast' && isAdmin && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">📣 Push Notification Broadcast</h2>
              <div className="card p-5 max-w-2xl">
                <div className="space-y-4">
                  <div><label className="label">Title</label><input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., New Tournament Starting!" /></div>
                  <div><label className="label">Message</label><textarea className="input min-h-[100px]" value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder="Notification message..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="label">Target Audience</label><select className="input" value={formData.targetAudience || 'all'} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}><option value="all">All Users</option><option value="verified">KYC Verified</option><option value="level">Specific Level</option></select></div>
                    <div><label className="label">Type</label><select className="input" value={formData.notificationType || 'announcement'} onChange={(e) => setFormData({ ...formData, notificationType: e.target.value })}><option value="announcement">Announcement</option><option value="promotion">Promotion</option><option value="update">Update</option><option value="reminder">Reminder</option></select></div>
                  </div>
                  {formData.targetAudience === 'level' && (<div><label className="label">Level</label><input type="number" className="input" value={formData.level || ''} onChange={(e) => setFormData({ ...formData, level: e.target.value })} min="1" /></div>)}
                  <div><label className="label">URL (optional)</label><input type="text" className="input" value={formData.url || ''} onChange={(e) => setFormData({ ...formData, url: e.target.value })} placeholder="/tournaments" /></div>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3"><p className="text-yellow-400 text-xs">⚠️ This will send to all matching users. Double-check before sending.</p></div>
                  <button onClick={() => handleAction('sendBroadcast', null)} disabled={!formData.title || !formData.message || actionLoading} className="btn-primary w-full">{actionLoading ? 'Sending...' : '📤 Send Broadcast'}</button>
                  {broadcastResult && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                      <p className="text-green-400 font-medium text-sm mb-1">✅ Broadcast Sent!</p>
                      <div className="text-xs text-dark-300 space-y-0.5">
                        <p>Notifications: {broadcastResult.notificationsCreated}</p>
                        <p>Push sent: {broadcastResult.pushSent}</p>
                        {broadcastResult.pushFailed > 0 && <p className="text-red-400">Push failed: {broadcastResult.pushFailed}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ ANNOUNCEMENTS TAB ══════════════════ */}
          {activeTab === 'announcements' && isAdmin && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">Announcements ({announcements.length})</h2>
                <button onClick={() => { setShowModal('createAnnouncement'); setFormData({ type: 'info', isActive: true }); }} className="btn-primary text-sm h-9">+ New</button>
              </div>
              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a._id} className="card p-4 flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h3 className="font-bold">{a.title}</h3>
                      <p className="text-dark-400 text-sm mt-1">{a.message}</p>
                      <p className="text-dark-500 text-xs mt-2">{formatDateTime(a.createdAt)} • {a.createdBy?.name || 'System'}</p>
                    </div>
                    <button onClick={() => handleAction('deleteAnnouncement', a)} className="text-red-400 hover:text-red-300 text-sm flex-shrink-0">Delete</button>
                  </div>
                ))}
                {announcements.length === 0 && <EmptyState icon="📢" message="No announcements" />}
              </div>
            </div>
          )}

          {/* ══════════════════ STAFF TAB ══════════════════ */}
          {activeTab === 'staff' && isAdmin && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Admin Staff ({adminStaff.length})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {adminStaff.map((s) => (
                  <div key={s._id} className="card p-4 hover:ring-1 hover:ring-dark-600 transition-all">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-gaming-purple flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {s.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{s.name}</p>
                          <RoleBadge role={s.role} />
                        </div>
                        <p className="text-dark-500 text-xs">{s.email || s.phone}</p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-dark-400">
                          <span>🎯 {s.actionsThisWeek} actions this week</span>
                          <span className={`inline-flex items-center gap-1 ${s.isActive ? 'text-green-400' : 'text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                            {s.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        {s.lastAction && (
                          <p className="text-dark-500 text-xs mt-1 truncate">Last: {s.lastAction.description}</p>
                        )}
                        <p className="text-dark-500 text-xs mt-0.5">Last login: {formatDateTime(s.lastLoginAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {adminStaff.length === 0 && <EmptyState icon="🛡️" message="No staff members" />}
            </div>
          )}

          {/* ══════════════════ LOGS TAB ══════════════════ */}
          {activeTab === 'logs' && isAdmin && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold">Activity Logs</h2>
              <div className="card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-700/50"><tr>
                    <th className="text-left p-3 font-medium text-dark-400">Time</th>
                    <th className="text-left p-3 font-medium text-dark-400">Admin</th>
                    <th className="text-left p-3 font-medium text-dark-400">Action</th>
                    <th className="text-left p-3 font-medium text-dark-400">Description</th>
                    <th className="text-left p-3 font-medium text-dark-400">Severity</th>
                    <th className="text-left p-3 font-medium text-dark-400">IP</th>
                  </tr></thead>
                  <tbody>
                    {adminLogs.map((log) => (
                      <tr key={log._id} className="border-t border-dark-700/50 hover:bg-dark-700/30 transition-colors">
                        <td className="p-3 text-dark-400 text-xs whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                        <td className="p-3"><div className="font-medium text-xs">{log.admin?.name}</div><RoleBadge role={log.admin?.role} /></td>
                        <td className="p-3 text-xs capitalize text-dark-300">{log.action?.replace(/_/g, ' ')}</td>
                        <td className="p-3 text-dark-400 text-xs max-w-[300px] truncate">{log.description}</td>
                        <td className="p-3">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${log.severity === 'critical' ? 'bg-red-500/20 text-red-400' : log.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : log.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-3 text-dark-500 text-xs font-mono">{log.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {adminLogs.length === 0 && <EmptyState icon="📜" message="No logs found" />}
              </div>
              <Pagination page={pagination.page} pages={pagination.pages} total={pagination.total} onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))} />
            </div>
          )}

          {/* ══════════════════ SYSTEM TAB ══════════════════ */}
          {activeTab === 'system' && isAdmin && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold">System Health & Settings</h2>
                <button onClick={() => loadTabData('system')} className="btn-secondary text-xs h-8">🔄 Refresh</button>
              </div>

              {systemHealth && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="card p-4">
                    <h3 className="text-xs font-semibold text-dark-400 uppercase mb-2">🖥️ Server</h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-dark-400">Node.js</span><span className="font-mono text-xs">{systemHealth.server?.nodeVersion}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">Uptime</span><span className="text-green-400 text-xs">{systemHealth.server?.uptime?.formatted}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">CPUs</span><span>{systemHealth.server?.cpuCount}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">PID</span><span className="font-mono text-xs">{systemHealth.server?.pid}</span></div>
                    </div>
                  </div>
                  <div className="card p-4">
                    <h3 className="text-xs font-semibold text-dark-400 uppercase mb-2">💾 Memory</h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-dark-400">Heap Used</span><span className="text-yellow-400 text-xs">{systemHealth.memory?.process?.heapUsed}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">RSS</span><span className="text-xs">{systemHealth.memory?.process?.rss}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">System Free</span><span className="text-xs">{systemHealth.memory?.system?.free}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">System Usage</span><span className="text-xs">{systemHealth.memory?.system?.usagePercent}</span></div>
                    </div>
                  </div>
                  <div className="card p-4">
                    <h3 className="text-xs font-semibold text-dark-400 uppercase mb-2">🗄️ Database</h3>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-dark-400">Status</span><span className={`text-xs font-medium ${systemHealth.database?.state === 'connected' ? 'text-green-400' : 'text-red-400'}`}>{systemHealth.database?.state}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">Latency</span><span className="text-xs">{systemHealth.database?.latencyMs}ms</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">DB Name</span><span className="font-mono text-xs">{systemHealth.database?.name}</span></div>
                      <div className="flex justify-between"><span className="text-dark-400">Connections</span><span className="text-primary-400 font-bold">{systemHealth.realtime?.activeConnections || 0}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {onlineUsers && (
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-dark-400 uppercase mb-2">🟢 Online Users ({onlineUsers.count})</h3>
                  {onlineUsers.count > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {(onlineUsers.onlineUsers || []).slice(0, 12).map((u, i) => (
                        <div key={i} className="bg-dark-700 rounded-lg p-2 text-xs">
                          <div className="font-medium truncate">{u.name}</div>
                          <div className="text-dark-500 capitalize">{u.level} • {u.role?.replace(/_/g, ' ')}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-dark-500 text-sm">No users online</p>}
                </div>
              )}

              {platformSettings && (
                <div className="card p-4">
                  <h3 className="text-xs font-semibold text-dark-400 uppercase mb-2">⚙️ Platform Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-dark-500 text-xs mb-1.5 font-medium">Financial</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(platformSettings.financial || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between"><span className="text-dark-400 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</span><span className="text-xs">{typeof v === 'number' && k.includes('ercentage') ? `${v}%` : typeof v === 'number' ? `₹${v}` : String(v)}</span></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs mb-1.5 font-medium">Features</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(platformSettings.features || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between"><span className="text-dark-400 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</span><span className={`text-xs ${v ? 'text-green-400' : 'text-red-400'}`}>{v ? '✓ On' : '✕ Off'}</span></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-dark-500 text-xs mb-1.5 font-medium">Security</p>
                      <div className="space-y-1 text-sm">
                        {Object.entries(platformSettings.security || {}).map(([k, v]) => (
                          <div key={k} className="flex justify-between"><span className="text-dark-400 text-xs capitalize">{k.replace(/([A-Z])/g, ' $1')}</span><span className="text-xs">{v}</span></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data Export */}
              <div className="card p-4">
                <h3 className="text-xs font-semibold text-dark-400 uppercase mb-2">📥 Data Export</h3>
                <div className="flex flex-wrap gap-2">
                  {['users', 'transactions', 'withdrawals', 'matches'].map(t => (
                    <button key={t} onClick={() => handleExport(t)} disabled={actionLoading} className="btn-secondary text-xs px-4 py-2 capitalize">📥 {t}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ══════════════════ MODALS ══════════════════ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(null); setSelectedItem(null); setFormData({}); } }}>
          <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Create Match */}
            {showModal === 'createMatch' && (<>
              <h2 className="text-lg font-bold mb-4">Create Match</h2>
              <div className="space-y-3">
                <div><label className="label">Title</label><input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="PUBG Solo Classic" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Game</label><select className="input" value={formData.gameType || 'pubg_mobile'} onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}><option value="pubg_mobile">PUBG Mobile</option><option value="free_fire">Free Fire</option></select></div>
                  <div><label className="label">Type</label><select className="input" value={formData.matchType || 'match_win'} onChange={(e) => setFormData({ ...formData, matchType: e.target.value })}><option value="match_win">Match Win</option><option value="tournament">Tournament</option><option value="tdm">TDM</option><option value="wow">WoW</option><option value="special">Special</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Mode</label><select className="input" value={formData.mode || 'solo'} onChange={(e) => setFormData({ ...formData, mode: e.target.value })}><option value="solo">Solo</option><option value="duo">Duo</option><option value="squad">Squad</option></select></div>
                  <div><label className="label">Map</label><select className="input" value={formData.map || 'erangel'} onChange={(e) => setFormData({ ...formData, map: e.target.value })}><option value="erangel">Erangel</option><option value="miramar">Miramar</option><option value="sanhok">Sanhok</option><option value="vikendi">Vikendi</option><option value="livik">Livik</option></select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="label">Entry ₹</label><input type="number" className="input" value={formData.entryFee || ''} onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) })} /></div>
                  <div><label className="label">Prize ₹</label><input type="number" className="input" value={formData.prizePool || ''} onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) })} /></div>
                  <div><label className="label">Slots</label><input type="number" className="input" value={formData.maxSlots || ''} onChange={(e) => setFormData({ ...formData, maxSlots: parseInt(e.target.value) })} /></div>
                </div>
                <div><label className="label">Scheduled At</label><input type="datetime-local" className="input" value={formData.scheduledAt || ''} onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })} /></div>
              </div>
            </>)}

            {/* Create Tournament */}
            {showModal === 'createTournament' && (<>
              <h2 className="text-lg font-bold mb-4">Create Tournament</h2>
              <div className="space-y-3">
                <div><label className="label">Title</label><input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                <div><label className="label">Description</label><textarea className="input min-h-[60px]" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Game</label><select className="input" value={formData.gameType || 'pubg_mobile'} onChange={(e) => setFormData({ ...formData, gameType: e.target.value })}><option value="pubg_mobile">PUBG Mobile</option><option value="free_fire">Free Fire</option></select></div>
                  <div><label className="label">Format</label><select className="input" value={formData.format || 'battle_royale'} onChange={(e) => setFormData({ ...formData, format: e.target.value })}><option value="battle_royale">Battle Royale</option><option value="single_elimination">Single Elimination</option><option value="double_elimination">Double Elimination</option><option value="round_robin">Round Robin</option><option value="swiss">Swiss</option></select></div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="label">Entry ₹</label><input type="number" className="input" value={formData.entryFee || ''} onChange={(e) => setFormData({ ...formData, entryFee: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="label">Prize ₹</label><input type="number" className="input" value={formData.prizePool || ''} onChange={(e) => setFormData({ ...formData, prizePool: parseInt(e.target.value) || 0 })} /></div>
                  <div><label className="label">Max Teams</label><input type="number" className="input" value={formData.maxTeams || ''} onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) || 0 })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Reg Start</label><input type="datetime-local" className="input" value={formData.registrationStartAt || ''} onChange={(e) => setFormData({ ...formData, registrationStartAt: e.target.value })} /></div>
                  <div><label className="label">Reg End</label><input type="datetime-local" className="input" value={formData.registrationEndAt || ''} onChange={(e) => setFormData({ ...formData, registrationEndAt: e.target.value })} /></div>
                </div>
                <div><label className="label">Start</label><input type="datetime-local" className="input" value={formData.startAt || ''} onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} /></div>
              </div>
            </>)}

            {/* Room Credentials */}
            {showModal === 'roomCredentials' && (<>
              <h2 className="text-lg font-bold mb-4">Set Room Credentials</h2>
              <div className="space-y-3">
                <div><label className="label">Room ID</label><input type="text" className="input" value={formData.roomId || ''} onChange={(e) => setFormData({ ...formData, roomId: e.target.value })} /></div>
                <div><label className="label">Password</label><input type="text" className="input" value={formData.password || ''} onChange={(e) => setFormData({ ...formData, password: e.target.value })} /></div>
              </div>
            </>)}

            {/* Complete Match */}
            {showModal === 'completeMatch' && (<>
              <h2 className="text-lg font-bold mb-4">Complete Match</h2>
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg"><p className="text-yellow-400 text-sm">Mark &quot;{selectedItem?.title}&quot; as completed?</p></div>
            </>)}

            {/* Declare Winners */}
            {showModal === 'declareWinners' && (<>
              <h2 className="text-lg font-bold mb-4">Declare Winners</h2>
              <div className="space-y-3">
                {formData.winners?.map((w, i) => (
                  <div key={i} className="border border-dark-700 rounded-lg p-3 space-y-2">
                    <div><label className="label">Player</label><select className="input" value={w.userId || ''} onChange={(e) => { const u = [...formData.winners]; u[i] = { ...u[i], userId: e.target.value }; setFormData({ ...formData, winners: u }); }}><option value="">Select</option>{matchParticipants.map(s => <option key={s.user?._id || s.user} value={s.user?._id || s.user}>{s.user?.name || 'Player'} {s.inGameName ? `• ${s.inGameName}` : ''}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="label">Position</label><input type="number" className="input" value={w.position || ''} onChange={(e) => { const u = [...formData.winners]; u[i] = { ...u[i], position: parseInt(e.target.value) || 0 }; setFormData({ ...formData, winners: u }); }} min="1" /></div>
                      <div><label className="label">Kills</label><input type="number" className="input" value={w.kills || 0} onChange={(e) => { const u = [...formData.winners]; u[i] = { ...u[i], kills: parseInt(e.target.value) || 0 }; setFormData({ ...formData, winners: u }); }} min="0" /></div>
                    </div>
                    {formData.winners.length > 1 && <button onClick={() => setFormData({ ...formData, winners: formData.winners.filter((_, j) => j !== i) })} className="text-red-400 text-xs">Remove</button>}
                  </div>
                ))}
                <button onClick={() => setFormData({ ...formData, winners: [...(formData.winners || []), { userId: '', position: (formData.winners?.length || 0) + 1, kills: 0 }] })} className="btn-secondary w-full text-sm">+ Add Winner</button>
              </div>
            </>)}

            {/* Reason modals */}
            {['cancelMatch', 'rejectWithdrawal', 'rejectKYC', 'banUser', 'cancelTournament'].includes(showModal) && (<>
              <h2 className="text-lg font-bold mb-4">{showModal === 'cancelMatch' ? 'Cancel Match' : showModal === 'rejectWithdrawal' ? 'Reject Withdrawal' : showModal === 'rejectKYC' ? 'Reject KYC' : showModal === 'cancelTournament' ? 'Cancel Tournament' : 'Ban User'}</h2>
              <div><label className="label">Reason</label><textarea className="input min-h-[100px]" value={formData.reason || ''} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Enter reason..." /></div>
              {showModal === 'cancelTournament' && <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg mt-3"><p className="text-red-400 text-xs">⚠️ This will refund all entry fees.</p></div>}
            </>)}

            {/* Reply / Resolve Ticket */}
            {['replyTicket', 'resolveTicket'].includes(showModal) && (<>
              <h2 className="text-lg font-bold mb-4">{showModal === 'replyTicket' ? 'Reply' : 'Resolve Ticket'}</h2>
              <div><label className="label">{showModal === 'replyTicket' ? 'Message' : 'Resolution'}</label><textarea className="input min-h-[100px]" value={showModal === 'replyTicket' ? formData.message || '' : formData.resolution || ''} onChange={(e) => setFormData({ ...formData, [showModal === 'replyTicket' ? 'message' : 'resolution']: e.target.value })} /></div>
            </>)}

            {/* Create Announcement */}
            {showModal === 'createAnnouncement' && (<>
              <h2 className="text-lg font-bold mb-4">Create Announcement</h2>
              <div className="space-y-3">
                <div><label className="label">Title</label><input type="text" className="input" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} /></div>
                <div><label className="label">Message</label><textarea className="input min-h-[80px]" value={formData.message || ''} onChange={(e) => setFormData({ ...formData, message: e.target.value })} /></div>
                <div><label className="label">Type</label><select className="input" value={formData.type || 'info'} onChange={(e) => setFormData({ ...formData, type: e.target.value })}><option value="info">Info</option><option value="warning">Warning</option><option value="success">Success</option><option value="error">Error</option><option value="promotion">Promotion</option></select></div>
              </div>
            </>)}

            {/* Confirm modals */}
            {['deleteMatch', 'deleteTournament', 'completeTournament'].includes(showModal) && (<>
              <h2 className="text-lg font-bold mb-4">{showModal === 'deleteMatch' ? 'Delete Match' : showModal === 'deleteTournament' ? 'Delete Tournament' : 'Complete Tournament'}</h2>
              <div className={`p-3 rounded-lg border ${showModal.includes('delete') ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                <p className={`text-sm ${showModal.includes('delete') ? 'text-red-400' : 'text-green-400'}`}>
                  {showModal.includes('delete') ? `Permanently delete "${selectedItem?.title}"? This cannot be undone.` : `Complete "${selectedItem?.title}"? This will finalize standings.`}
                </p>
              </div>
            </>)}

            {/* Change Role */}
            {showModal === 'changeRole' && (<>
              <h2 className="text-lg font-bold mb-4">Change Role</h2>
              <div className="space-y-3">
                <div className="bg-dark-700 p-3 rounded-lg"><p className="font-medium">{selectedItem?.name}</p><p className="text-dark-400 text-xs">{selectedItem?.phone}</p></div>
                <div><label className="label">New Role</label><select className="input" value={formData.role || 'user'} onChange={(e) => setFormData({ ...formData, role: e.target.value })}><option value="user">User</option><option value="host">Host</option><option value="match_manager">Match Manager</option><option value="finance_manager">Finance Manager</option><option value="support">Support</option><option value="admin">Admin</option></select></div>
              </div>
            </>)}

            {/* Adjust Wallet */}
            {showModal === 'adjustWallet' && (<>
              <h2 className="text-lg font-bold mb-4">Adjust Wallet</h2>
              <div className="space-y-3">
                <div className="bg-dark-700 p-3 rounded-lg"><p className="font-medium">{selectedItem?.name}</p><p className="text-gaming-green text-sm">Balance: {formatCurrency(selectedItem?.walletBalance || 0)}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label">Type</label><select className="input" value={formData.adjustType || 'credit'} onChange={(e) => setFormData({ ...formData, adjustType: e.target.value })}><option value="credit">Credit (+)</option><option value="debit">Debit (-)</option></select></div>
                  <div><label className="label">Amount ₹</label><input type="number" className="input" value={formData.amount || ''} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} min="1" /></div>
                </div>
                <div><label className="label">Reason</label><textarea className="input min-h-[60px]" value={formData.reason || ''} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} placeholder="Reason (required)" /></div>
              </div>
            </>)}

            {/* Resolve Dispute */}
            {showModal === 'resolveDispute' && (<>
              <h2 className="text-lg font-bold mb-4">Resolve Dispute</h2>
              <div className="space-y-3">
                <div className="bg-dark-700 p-3 rounded-lg"><p className="font-medium">{selectedItem?.match?.title || 'N/A'}</p><p className="text-dark-400 text-xs">By: {selectedItem?.submittedBy?.name}</p></div>
                <div><label className="label">Decision</label><select className="input" value={formData.decision || 'accepted'} onChange={(e) => setFormData({ ...formData, decision: e.target.value })}><option value="accepted">Accept</option><option value="rejected">Reject</option><option value="partial">Partial</option></select></div>
                {formData.decision !== 'rejected' && <div><label className="label">Compensation ₹</label><input type="number" className="input" value={formData.compensation || ''} onChange={(e) => setFormData({ ...formData, compensation: e.target.value })} min="0" /></div>}
                <div><label className="label">Notes</label><textarea className="input min-h-[80px]" value={formData.resolution || ''} onChange={(e) => setFormData({ ...formData, resolution: e.target.value })} /></div>
              </div>
            </>)}

            {/* Add Dispute Note */}
            {showModal === 'addDisputeNote' && (<>
              <h2 className="text-lg font-bold mb-4">Add Note</h2>
              <div className="space-y-3">
                <div><label className="label">Internal Note</label><textarea className="input min-h-[100px]" value={formData.note || ''} onChange={(e) => setFormData({ ...formData, note: e.target.value })} placeholder="Internal note (admins only)..." /></div>
              </div>
            </>)}

            {/* Modal Actions */}
            <div className="flex gap-2 mt-5">
              <button onClick={() => { setShowModal(null); setSelectedItem(null); setFormData({}); setError(''); }} className="btn-secondary flex-1 text-sm">Cancel</button>
              <button onClick={() => handleAction(showModal, selectedItem)} disabled={actionLoading} className="btn-primary flex-1 text-sm">{actionLoading ? 'Processing...' : 'Confirm'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
