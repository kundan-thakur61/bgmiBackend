import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include Authorization header
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API
const getMe = async () => {
  const response = await axiosInstance.get('/auth/me');
  return response.data;
};

const logout = async () => {
  const response = await axiosInstance.post('/auth/logout');
  return response.data;
};

// Simple in-memory cache for reducing API calls
const cache = new Map();
const CACHE_TTL = 60000; // 1 minute cache

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// Chat API
const sendMessage = async (matchId, tournamentId, content) => {
  const response = await axiosInstance.post('/chat/send', { matchId, tournamentId, content });
  return response.data;
};

const getMatchMessages = async (matchId) => {
  const response = await axiosInstance.get(`/chat/match/${matchId}`);
  return response.data;
};

const getTournamentMessages = async (tournamentId) => {
  const response = await axiosInstance.get(`/chat/tournament/${tournamentId}`);
  return response.data;
};

// Match API with caching
const getMatches = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.keys(filters).forEach(key => {
    if (filters[key]) {
      params.append(key, filters[key]);
    }
  });

  const cacheKey = `matches:${params.toString()}`;
  const cached = getCachedData(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await axiosInstance.get(`/matches?${params.toString()}`);
  setCachedData(cacheKey, response.data);
  return response.data;
};

// Clear cache utility (useful after mutations)
const clearCache = () => {
  cache.clear();
};

// API object with all methods for admin and other pages
const api = {
  // Expose axios methods for direct use
  get: (url, config) => axiosInstance.get(url, config),
  post: (url, data, config) => axiosInstance.post(url, data, config),
  put: (url, data, config) => axiosInstance.put(url, data, config),
  delete: (url, config) => axiosInstance.delete(url, config),

  // Admin Stats
  getAdminStats: async () => {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
  },

  // Admin Users
  getAdminUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/admin/users?${query}`);
    return response.data;
  },

  banUser: async (userId, reason) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/ban`, { reason });
    return response.data;
  },

  unbanUser: async (userId) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/unban`);
    return response.data;
  },

  // Change user role
  changeUserRole: async (userId, role) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Adjust user wallet
  adjustUserWallet: async (userId, amount, type, reason) => {
    const response = await axiosInstance.post(`/admin/users/${userId}/wallet`, { amount, type, reason });
    return response.data;
  },

  // Reports
  getRevenueReport: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/admin/reports/revenue?${query}`);
    return response.data;
  },

  getUsersReport: async () => {
    const response = await axiosInstance.get('/admin/reports/users');
    return response.data;
  },

  getMatchesReport: async () => {
    const response = await axiosInstance.get('/admin/reports/matches');
    return response.data;
  },

  getReferralsReport: async () => {
    const response = await axiosInstance.get('/admin/reports/referrals');
    return response.data;
  },

  // Disputes (Admin)
  getDisputeStats: async () => {
    const response = await axiosInstance.get('/admin/disputes/stats');
    return response.data;
  },

  assignDispute: async (disputeId, adminId) => {
    const response = await axiosInstance.post(`/disputes/${disputeId}/assign`, { adminId });
    return response.data;
  },

  addDisputeNote: async (disputeId, note) => {
    const response = await axiosInstance.post(`/disputes/${disputeId}/note`, { note });
    return response.data;
  },

  addDisputeMessage: async (disputeId, message) => {
    const response = await axiosInstance.post(`/disputes/${disputeId}/message`, { message });
    return response.data;
  },

  // Broadcast Notifications
  broadcastNotification: async (data) => {
    const response = await axiosInstance.post('/admin/broadcast', data);
    return response.data;
  },

  // Matches
  getMatch: async (matchId) => {
    const response = await axiosInstance.get(`/matches/${matchId}`);
    return response.data;
  },

  getMyMatchStatus: async (matchId) => {
    const response = await axiosInstance.get(`/matches/${matchId}/my-status`);
    return response.data;
  },

  joinMatch: async (matchId, inGameId, inGameName) => {
    const response = await axiosInstance.post(`/matches/${matchId}/join`, { inGameId, inGameName });
    clearCache();
    return response.data;
  },

  leaveMatch: async (matchId) => {
    const response = await axiosInstance.post(`/matches/${matchId}/leave`);
    clearCache();
    return response.data;
  },

  getRoomCredentials: async (matchId) => {
    const response = await axiosInstance.get(`/matches/${matchId}/room`);
    return response.data;
  },

  cancelUserMatch: async (matchId) => {
    const response = await axiosInstance.post(`/matches/${matchId}/user-cancel`);
    clearCache();
    return response.data;
  },

  createMatch: async (data) => {
    const response = await axiosInstance.post('/matches', data);
    clearCache();
    return response.data;
  },

  // User create their own challenge match
  createUserMatch: async (data) => {
    const response = await axiosInstance.post('/matches/user-create', data);
    clearCache();
    return response.data;
  },

  updateMatch: async (matchId, data) => {
    const response = await axiosInstance.put(`/matches/${matchId}`, data);
    clearCache();
    return response.data;
  },

  // User update their own challenge match
  updateUserMatch: async (matchId, data) => {
    const response = await axiosInstance.put(`/matches/${matchId}/user-update`, data);
    clearCache();
    return response.data;
  },

  deleteMatch: async (matchId) => {
    const response = await axiosInstance.delete(`/matches/${matchId}`);
    clearCache();
    return response.data;
  },

  startMatch: async (matchId) => {
    const response = await axiosInstance.post(`/matches/${matchId}/start`);
    clearCache();
    return response.data;
  },

  completeMatch: async (matchId) => {
    const response = await axiosInstance.post(`/matches/${matchId}/complete`);
    clearCache();
    return response.data;
  },

  cancelMatch: async (matchId, reason) => {
    const response = await axiosInstance.post(`/matches/${matchId}/cancel`, { reason });
    clearCache();
    return response.data;
  },

  setRoomCredentials: async (matchId, roomId, password) => {
    const response = await axiosInstance.post(`/matches/${matchId}/room-credentials`, { roomId, password });
    clearCache();
    return response.data;
  },

  declareWinners: async (matchId, winners) => {
    const response = await axiosInstance.post(`/matches/${matchId}/declare-winners`, { winners });
    clearCache();
    return response.data;
  },

  // Tournaments
  getTournaments: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/tournaments?${query}`);
    return response.data;
  },

  getTournament: async (tournamentId) => {
    const response = await axiosInstance.get(`/tournaments/${tournamentId}`);
    return response.data;
  },

  registerForTournament: async (tournamentId, data) => {
    const response = await axiosInstance.post(`/tournaments/${tournamentId}/register`, data);
    return response.data;
  },

  leaveTournament: async (tournamentId) => {
    const response = await axiosInstance.post(`/tournaments/${tournamentId}/leave`);
    return response.data;
  },

  getMyTournamentStatus: async (tournamentId) => {
    const response = await axiosInstance.get(`/tournaments/${tournamentId}/my-status`);
    return response.data;
  },

  createTournament: async (data) => {
    const response = await axiosInstance.post('/tournaments', data);
    return response.data;
  },

  updateTournament: async (tournamentId, data) => {
    const response = await axiosInstance.put(`/tournaments/${tournamentId}`, data);
    return response.data;
  },

  deleteTournament: async (tournamentId) => {
    const response = await axiosInstance.delete(`/tournaments/${tournamentId}`);
    return response.data;
  },

  completeTournament: async (tournamentId) => {
    const response = await axiosInstance.post(`/tournaments/${tournamentId}/complete`);
    return response.data;
  },

  cancelTournament: async (tournamentId, reason) => {
    const response = await axiosInstance.post(`/tournaments/${tournamentId}/cancel`, { reason });
    return response.data;
  },

  // Withdrawals
  getPendingWithdrawals: async () => {
    const response = await axiosInstance.get('/withdrawals/pending');
    return response.data;
  },

  approveWithdrawal: async (withdrawalId) => {
    const response = await axiosInstance.post(`/withdrawals/${withdrawalId}/approve`);
    return response.data;
  },

  rejectWithdrawal: async (withdrawalId, reason) => {
    const response = await axiosInstance.post(`/withdrawals/${withdrawalId}/reject`, { reason });
    return response.data;
  },

  // KYC
  getPendingKYC: async () => {
    const response = await axiosInstance.get('/kyc/pending');
    return response.data;
  },

  approveKYC: async (kycId) => {
    const response = await axiosInstance.post(`/kyc/${kycId}/approve`);
    return response.data;
  },

  rejectKYC: async (kycId, reason) => {
    const response = await axiosInstance.post(`/kyc/${kycId}/reject`, { reason });
    return response.data;
  },

  // Tickets
  getAllTickets: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/tickets/admin/all?${query}`);
    return response.data;
  },

  resolveTicket: async (ticketId, resolution) => {
    const response = await axiosInstance.post(`/tickets/${ticketId}/resolve`, { resolution });
    return response.data;
  },

  addTicketMessage: async (ticketId, message) => {
    const response = await axiosInstance.post(`/tickets/${ticketId}/message`, { message });
    return response.data;
  },

  // Announcements
  getAnnouncements: async () => {
    const response = await axiosInstance.get('/admin/announcements');
    return response.data;
  },

  createAnnouncement: async (data) => {
    const response = await axiosInstance.post('/admin/announcements', data);
    return response.data;
  },

  deleteAnnouncement: async (announcementId) => {
    const response = await axiosInstance.delete(`/admin/announcements/${announcementId}`);
    return response.data;
  },

  // Wallet
  getTransactions: async () => {
    const response = await axiosInstance.get('/wallet/transactions');
    return response.data;
  },

  getWithdrawals: async () => {
    const response = await axiosInstance.get('/withdrawals');
    return response.data;
  },

  requestWithdrawal: async (amount, method, details) => {
    const data = {
      amount,
      method,
      ...details
    };
    const response = await axiosInstance.post('/withdrawals', data);
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async (type = 'global', params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = type === 'global' ? '/leaderboard' : `/leaderboard/${type}`;
    const response = await axiosInstance.get(`${endpoint}?${query}`);
    return response.data;
  },

  getTopEarners: async (limit = 10) => {
    const response = await axiosInstance.get(`/leaderboard/top-earners?limit=${limit}`);
    return response.data;
  },

  // Match History
  getMatchHistory: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/users/match-history?${query}`);
    return response.data;
  },

  // Referrals
  getReferralStats: async () => {
    const response = await axiosInstance.get('/users/referral-stats');
    return response.data;
  },

  getReferredUsers: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/users/referrals?${query}`);
    return response.data;
  },

  // Profile
  updateProfile: async (data) => {
    const response = await axiosInstance.put('/users/profile', data);
    return response.data;
  },

  // Achievements
  getAchievements: async () => {
    const response = await axiosInstance.get('/achievements');
    return response.data;
  },

  getUserAchievements: async () => {
    const response = await axiosInstance.get('/achievements/my');
    return response.data;
  },

  // Teams
  getMyTeams: async () => {
    const response = await axiosInstance.get('/teams/my');
    return response.data;
  },

  getTeam: async (teamId) => {
    const response = await axiosInstance.get(`/teams/${teamId}`);
    return response.data;
  },

  createTeam: async (data) => {
    const response = await axiosInstance.post('/teams', data);
    return response.data;
  },

  inviteToTeam: async (teamId, userId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/invite`, { userId });
    return response.data;
  },

  acceptTeamInvite: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/accept`);
    return response.data;
  },

  declineTeamInvite: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/decline`);
    return response.data;
  },

  leaveTeam: async (teamId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/leave`);
    return response.data;
  },

  removeTeamMember: async (teamId, userId) => {
    const response = await axiosInstance.post(`/teams/${teamId}/remove`, { userId });
    return response.data;
  },

  disbandTeam: async (teamId) => {
    const response = await axiosInstance.delete(`/teams/${teamId}`);
    return response.data;
  },

  getTeamInvites: async () => {
    const response = await axiosInstance.get('/teams/invites');
    return response.data;
  },

  // Disputes
  createDispute: async (matchId, data) => {
    const response = await axiosInstance.post(`/disputes`, { matchId, ...data });
    return response.data;
  },

  getMyDisputes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/disputes/my?${query}`);
    return response.data;
  },

  getDispute: async (disputeId) => {
    const response = await axiosInstance.get(`/disputes/${disputeId}`);
    return response.data;
  },

  // Admin disputes
  getAllDisputes: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await axiosInstance.get(`/disputes/admin/all?${query}`);
    return response.data;
  },

  resolveDispute: async (disputeId, data) => {
    const response = await axiosInstance.post(`/disputes/${disputeId}/resolve`, data);
    return response.data;
  },

  // Global Search
  search: async (query, type = 'all') => {
    const response = await axiosInstance.get(`/search?q=${encodeURIComponent(query)}&type=${type}`);
    return response.data;
  },

  // Push Notifications
  subscribeToPush: async (subscription) => {
    const response = await axiosInstance.post('/users/push-subscribe', { subscription });
    return response.data;
  },

  unsubscribeFromPush: async () => {
    const response = await axiosInstance.post('/users/push-unsubscribe');
    return response.data;
  },

  // User search (for team invites)
  searchUsers: async (query) => {
    const response = await axiosInstance.get(`/users/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },
};

export {
  api,
  getMe,
  logout,
  sendMessage,
  getMatchMessages,
  getTournamentMessages,
  getMatches,
  clearCache,
};
