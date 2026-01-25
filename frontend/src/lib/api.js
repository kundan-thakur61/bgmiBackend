const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints - OTP based
  async sendOtp(phone) {
    return this.request('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
  }

  async verifyOtp(phone, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    });
  }

  async register(userData) {
    // userData: { name, phone, referralCode?, dateOfBirth? }
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async checkPhone(phone) {
    return this.request(`/auth/check-phone/${phone}`);
  }

  async verifyReferralCode(code) {
    return this.request(`/auth/verify-referral/${code}`);
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Match endpoints
  async getMatches(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/matches${queryString ? `?${queryString}` : ''}`);
  }

  async getMatch(id) {
    return this.request(`/matches/${id}`);
  }

  async joinMatch(matchId, inGameId, inGameName) {
    return this.request(`/matches/${matchId}/join`, {
      method: 'POST',
      body: JSON.stringify({ inGameId, inGameName }),
    });
  }

  async submitMatchResult(matchId, data) {
    return this.request(`/matches/${matchId}/result`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Tournament endpoints
  async getTournaments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tournaments${queryString ? `?${queryString}` : ''}`);
  }

  async getTournament(id) {
    return this.request(`/tournaments/${id}`);
  }

  async joinTournament(tournamentId) {
    return this.request(`/tournaments/${tournamentId}/join`, {
      method: 'POST',
    });
  }

  async registerForTournament(tournamentId, teamData) {
    return this.request(`/tournaments/${tournamentId}/register`, {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  }

  // Wallet endpoints
  async getWallet() {
    return this.request('/wallet');
  }

  async getTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/wallet/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async addMoney(amount, paymentId) {
    return this.request('/wallet/add', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentId }),
    });
  }

  async createPaymentOrder(amount) {
    return this.request('/wallet/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Withdrawal endpoints
  async requestWithdrawal(amount, method, details) {
    const body = { amount, method };
    if (method === 'upi') {
      body.upiId = details?.upiId;
    } else if (method === 'bank') {
      body.accountNumber = details?.accountNumber;
      body.ifscCode = details?.ifscCode;
      body.accountHolderName = details?.accountHolderName;
    }
    return this.request('/withdrawals', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async getWithdrawals() {
    return this.request('/withdrawals');
  }

  // KYC endpoints
  async submitKYC(formData) {
    return this.request('/kyc/submit', {
      method: 'POST',
      headers: {},
      body: formData,
    });
  }

  async getKYCStatus() {
    return this.request('/kyc/status');
  }

  // Notification endpoints
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  // Ticket endpoints
  async createTicket(ticketData) {
    return this.request('/tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    });
  }

  async getTickets() {
    return this.request('/tickets');
  }

  async getTicket(id) {
    return this.request(`/tickets/${id}`);
  }

  async replyToTicket(id, message) {
    return this.request(`/tickets/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAdminUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingWithdrawals() {
    return this.request('/withdrawals/pending');
  }

  async approveWithdrawal(id) {
    return this.request(`/withdrawals/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectWithdrawal(id, reason) {
    return this.request(`/withdrawals/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getPendingKYC() {
    return this.request('/kyc/pending');
  }

  async approveKYC(id) {
    return this.request(`/kyc/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectKYC(id, reason) {
    return this.request(`/kyc/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Admin Match Management
  async createMatch(matchData) {
    return this.request('/matches', {
      method: 'POST',
      body: JSON.stringify(matchData),
    });
  }

  async updateMatch(id, matchData) {
    return this.request(`/matches/${id}`, {
      method: 'PUT',
      body: JSON.stringify(matchData),
    });
  }

  async deleteMatch(id) {
    return this.request(`/matches/${id}`, {
      method: 'DELETE',
    });
  }

  async setRoomCredentials(matchId, roomId, password) {
    return this.request(`/matches/${matchId}/room-credentials`, {
      method: 'POST',
      body: JSON.stringify({ roomId, roomPassword: password, revealNow: true }),
    });
  }

  async startMatch(matchId) {
    return this.request(`/matches/${matchId}/start`, {
      method: 'POST',
    });
  }

  async completeMatch(matchId, results) {
    return this.request(`/matches/${matchId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    });
  }

  async cancelMatch(matchId, reason) {
    return this.request(`/matches/${matchId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async getMatchScreenshots(matchId) {
    return this.request(`/matches/${matchId}/screenshots`);
  }

  // Admin Tournament Management
  async createTournament(tournamentData) {
    return this.request('/tournaments', {
      method: 'POST',
      body: JSON.stringify(tournamentData),
    });
  }

  async updateTournament(id, tournamentData) {
    return this.request(`/tournaments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tournamentData),
    });
  }

  async deleteTournament(id) {
    return this.request(`/tournaments/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin User Management
  async getAdminUser(id) {
    return this.request(`/admin/users/${id}`);
  }

  async updateAdminUser(id, data) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async banUser(id, reason) {
    return this.request(`/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unbanUser(id) {
    return this.request(`/admin/users/${id}/unban`, {
      method: 'POST',
    });
  }

  async adjustUserWallet(id, amount, reason) {
    return this.request(`/admin/users/${id}/wallet`, {
      method: 'POST',
      body: JSON.stringify({ amount, reason }),
    });
  }

  // Admin Tickets
  async getAllTickets(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tickets/admin/all${queryString ? `?${queryString}` : ''}`);
  }

  async assignTicket(id, assigneeId) {
    return this.request(`/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify({ assigneeId }),
    });
  }

  async resolveTicket(id, resolution) {
    return this.request(`/tickets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolution }),
    });
  }

  async addTicketMessage(id, message) {
    return this.request(`/tickets/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Admin Announcements
  async getAnnouncements() {
    return this.request('/admin/announcements');
  }

  async createAnnouncement(data) {
    return this.request('/admin/announcements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAnnouncement(id, data) {
    return this.request(`/admin/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAnnouncement(id) {
    return this.request(`/admin/announcements/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin Withdrawals
  async completeWithdrawal(id) {
    return this.request(`/withdrawals/${id}/complete`, {
      method: 'POST',
    });
  }

  // Admin KYC
  async getKYCDetails(id) {
    return this.request(`/kyc/${id}`);
  }
}

export const api = new ApiClient();
export default api;
