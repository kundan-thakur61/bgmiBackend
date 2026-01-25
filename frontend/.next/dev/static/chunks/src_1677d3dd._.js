(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/seo/Schema.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BreadcrumbSchema",
    ()=>BreadcrumbSchema,
    "FAQSchema",
    ()=>FAQSchema,
    "MatchSchema",
    ()=>MatchSchema,
    "OrganizationSchema",
    ()=>OrganizationSchema,
    "TournamentSchema",
    ()=>TournamentSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function OrganizationSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'BattleZone',
        url: 'https://battlezone.com',
        logo: 'https://battlezone.com/logo.png',
        description: "India's premier esports gaming platform for PUBG Mobile and Free Fire tournaments.",
        foundingDate: '2024',
        foundingLocation: {
            '@type': 'Place',
            name: 'Dhanbad, Jharkhand, India'
        },
        address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN',
            addressLocality: 'Dhanbad',
            addressRegion: 'JH'
        },
        contact: {
            '@type': 'ContactPoint',
            contactType: 'Customer Service',
            email: 'support@battlezone.com',
            url: 'https://battlezone.com/contact'
        },
        sameAs: [
            'https://twitter.com/BattleZone',
            'https://facebook.com/BattleZone',
            'https://instagram.com/BattleZone',
            'https://youtube.com/@BattleZone',
            'https://discord.gg/BattleZone'
        ]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(schema)
        },
        suppressHydrationWarning: true
    }, void 0, false, {
        fileName: "[project]/src/components/seo/Schema.jsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c = OrganizationSchema;
function FAQSchema() {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
            {
                '@type': 'Question',
                name: 'How do I join a match on BattleZone?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: "Sign up for an account, complete KYC verification, add money to your wallet, browse available matches, and click join. You'll receive room details before the match starts."
                }
            },
            {
                '@type': 'Question',
                name: 'What games are available on BattleZone?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'BattleZone offers PUBG Mobile and Free Fire matches including solo matches, duo matches, squad matches, and special tournament formats with real money prizes.'
                }
            },
            {
                '@type': 'Question',
                name: 'How are match results verified?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Players upload match screenshots after completion. Our anti-cheat system verifies using EXIF data analysis, duplicate image detection, and manual admin review to prevent fraud.'
                }
            },
            {
                '@type': 'Question',
                name: 'When can I withdraw my winnings?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'After KYC verification is complete and you meet the minimum withdrawal amount, withdrawals are processed within 24-48 hours via UPI or bank transfer.'
                }
            },
            {
                '@type': 'Question',
                name: 'Is BattleZone legal in India?',
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Yes, BattleZone operates as a skill-based gaming platform, not gambling. All games are competitive and skill-based, compliant with Indian gaming regulations.'
                }
            }
        ]
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(schema)
        },
        suppressHydrationWarning: true
    }, void 0, false, {
        fileName: "[project]/src/components/seo/Schema.jsx",
        lineNumber: 95,
        columnNumber: 5
    }, this);
}
_c1 = FAQSchema;
function BreadcrumbSchema({ items }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index)=>({
                '@type': 'ListItem',
                position: index + 1,
                name: item.name,
                item: item.url
            }))
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(schema)
        },
        suppressHydrationWarning: true
    }, void 0, false, {
        fileName: "[project]/src/components/seo/Schema.jsx",
        lineNumber: 116,
        columnNumber: 5
    }, this);
}
_c2 = BreadcrumbSchema;
function MatchSchema({ match }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: `${match.gameType} ${match.matchType} - Prize ₹${match.prize}`,
        description: `Join this competitive ${match.gameType} ${match.matchType} match. Entry fee: ₹${match.entryFee}. Prize: ₹${match.prize}. Max slots: ${match.maxSlots}`,
        startDate: new Date(match.startTime).toISOString(),
        endDate: new Date(match.endTime).toISOString(),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: {
            '@type': 'VirtualLocation',
            url: 'https://battlezone.com'
        },
        offers: {
            '@type': 'Offer',
            price: match.entryFee,
            priceCurrency: 'INR',
            availability: match.remainingSlots > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `https://battlezone.com/matches/${match.id}`
        },
        organizer: {
            '@type': 'Organization',
            name: 'BattleZone',
            url: 'https://battlezone.com'
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(schema)
        },
        suppressHydrationWarning: true
    }, void 0, false, {
        fileName: "[project]/src/components/seo/Schema.jsx",
        lineNumber: 153,
        columnNumber: 5
    }, this);
}
_c3 = MatchSchema;
function TournamentSchema({ tournament }) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'SportsEvent',
        name: tournament.name,
        description: tournament.description || `Join ${tournament.name} tournament on BattleZone`,
        startDate: new Date(tournament.startDate).toISOString(),
        endDate: new Date(tournament.endDate).toISOString(),
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: {
            '@type': 'VirtualLocation',
            url: 'https://battlezone.com'
        },
        offers: {
            '@type': 'Offer',
            price: tournament.entryFee,
            priceCurrency: 'INR',
            availability: 'https://schema.org/InStock',
            url: `https://battlezone.com/tournaments/${tournament.id}`
        },
        organizer: {
            '@type': 'Organization',
            name: 'BattleZone',
            url: 'https://battlezone.com'
        }
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("script", {
        type: "application/ld+json",
        dangerouslySetInnerHTML: {
            __html: JSON.stringify(schema)
        },
        suppressHydrationWarning: true
    }, void 0, false, {
        fileName: "[project]/src/components/seo/Schema.jsx",
        lineNumber: 190,
        columnNumber: 5
    }, this);
}
_c4 = TournamentSchema;
var _c, _c1, _c2, _c3, _c4;
__turbopack_context__.k.register(_c, "OrganizationSchema");
__turbopack_context__.k.register(_c1, "FAQSchema");
__turbopack_context__.k.register(_c2, "BreadcrumbSchema");
__turbopack_context__.k.register(_c3, "MatchSchema");
__turbopack_context__.k.register(_c4, "TournamentSchema");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/seo/Analytics.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GoogleAnalytics",
    ()=>GoogleAnalytics,
    "GoogleSearchConsole",
    ()=>GoogleSearchConsole
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/script.js [app-client] (ecmascript)");
'use client';
;
;
function GoogleAnalytics({ gaId }) {
    if (!gaId) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                strategy: "afterInteractive",
                src: `https://www.googletagmanager.com/gtag/js?id=${gaId}`
            }, void 0, false, {
                fileName: "[project]/src/components/seo/Analytics.jsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$script$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                id: "google-analytics",
                strategy: "afterInteractive",
                dangerouslySetInnerHTML: {
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
              page_title: document.title,
              anonymize_ip: true,
            });
          `
                }
            }, void 0, false, {
                fileName: "[project]/src/components/seo/Analytics.jsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true);
}
_c = GoogleAnalytics;
function GoogleSearchConsole({ verificationCode }) {
    if (!verificationCode) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("meta", {
        name: "google-site-verification",
        content: verificationCode
    }, void 0, false, {
        fileName: "[project]/src/components/seo/Analytics.jsx",
        lineNumber: 38,
        columnNumber: 5
    }, this);
}
_c1 = GoogleSearchConsole;
var _c, _c1;
__turbopack_context__.k.register(_c, "GoogleAnalytics");
__turbopack_context__.k.register(_c1, "GoogleSearchConsole");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/api.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "api",
    ()=>api,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
const API_BASE_URL = ("TURBOPACK compile-time value", "http://localhost:5000/api") || 'http://localhost:5000/api';
class ApiClient {
    constructor(){
        this.baseUrl = API_BASE_URL;
    }
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        // Add auth token if available
        if ("TURBOPACK compile-time truthy", 1) {
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
            body: JSON.stringify({
                phone
            })
        });
    }
    async verifyOtp(phone, otp) {
        return this.request('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({
                phone,
                otp
            })
        });
    }
    async register(userData) {
        // userData: { name, phone, referralCode?, dateOfBirth? }
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
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
            method: 'POST'
        });
    }
    async getProfile() {
        return this.request('/users/profile');
    }
    async updateProfile(data) {
        return this.request('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(data)
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
            body: JSON.stringify({
                inGameId,
                inGameName
            })
        });
    }
    async submitMatchResult(matchId, data) {
        return this.request(`/matches/${matchId}/result`, {
            method: 'POST',
            body: JSON.stringify(data)
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
            method: 'POST'
        });
    }
    async registerForTournament(tournamentId, teamData) {
        return this.request(`/tournaments/${tournamentId}/register`, {
            method: 'POST',
            body: JSON.stringify(teamData)
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
            body: JSON.stringify({
                amount,
                paymentId
            })
        });
    }
    async createPaymentOrder(amount) {
        return this.request('/wallet/create-order', {
            method: 'POST',
            body: JSON.stringify({
                amount
            })
        });
    }
    // Withdrawal endpoints
    async requestWithdrawal(amount, method, details) {
        return this.request('/withdrawals/request', {
            method: 'POST',
            body: JSON.stringify({
                amount,
                method,
                details
            })
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
            body: formData
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
            method: 'PUT'
        });
    }
    async markAllNotificationsRead() {
        return this.request('/notifications/read-all', {
            method: 'PUT'
        });
    }
    // Ticket endpoints
    async createTicket(ticketData) {
        return this.request('/tickets', {
            method: 'POST',
            body: JSON.stringify(ticketData)
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
            body: JSON.stringify({
                message
            })
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
            method: 'POST'
        });
    }
    async rejectWithdrawal(id, reason) {
        return this.request(`/withdrawals/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({
                reason
            })
        });
    }
    async getPendingKYC() {
        return this.request('/kyc/pending');
    }
    async approveKYC(id) {
        return this.request(`/kyc/${id}/approve`, {
            method: 'POST'
        });
    }
    async rejectKYC(id, reason) {
        return this.request(`/kyc/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({
                reason
            })
        });
    }
    // Admin Match Management
    async createMatch(matchData) {
        return this.request('/matches', {
            method: 'POST',
            body: JSON.stringify(matchData)
        });
    }
    async updateMatch(id, matchData) {
        return this.request(`/matches/${id}`, {
            method: 'PUT',
            body: JSON.stringify(matchData)
        });
    }
    async deleteMatch(id) {
        return this.request(`/matches/${id}`, {
            method: 'DELETE'
        });
    }
    async setRoomCredentials(matchId, roomId, password) {
        return this.request(`/matches/${matchId}/room-credentials`, {
            method: 'POST',
            body: JSON.stringify({
                roomId,
                password
            })
        });
    }
    async startMatch(matchId) {
        return this.request(`/matches/${matchId}/start`, {
            method: 'POST'
        });
    }
    async completeMatch(matchId, results) {
        return this.request(`/matches/${matchId}/complete`, {
            method: 'POST',
            body: JSON.stringify({
                results
            })
        });
    }
    async cancelMatch(matchId, reason) {
        return this.request(`/matches/${matchId}/cancel`, {
            method: 'POST',
            body: JSON.stringify({
                reason
            })
        });
    }
    async getMatchScreenshots(matchId) {
        return this.request(`/matches/${matchId}/screenshots`);
    }
    // Admin Tournament Management
    async createTournament(tournamentData) {
        return this.request('/tournaments', {
            method: 'POST',
            body: JSON.stringify(tournamentData)
        });
    }
    async updateTournament(id, tournamentData) {
        return this.request(`/tournaments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(tournamentData)
        });
    }
    async deleteTournament(id) {
        return this.request(`/tournaments/${id}`, {
            method: 'DELETE'
        });
    }
    // Admin User Management
    async getAdminUser(id) {
        return this.request(`/admin/users/${id}`);
    }
    async updateAdminUser(id, data) {
        return this.request(`/admin/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    async banUser(id, reason) {
        return this.request(`/admin/users/${id}/ban`, {
            method: 'POST',
            body: JSON.stringify({
                reason
            })
        });
    }
    async unbanUser(id) {
        return this.request(`/admin/users/${id}/unban`, {
            method: 'POST'
        });
    }
    async adjustUserWallet(id, amount, reason) {
        return this.request(`/admin/users/${id}/wallet`, {
            method: 'POST',
            body: JSON.stringify({
                amount,
                reason
            })
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
            body: JSON.stringify({
                assigneeId
            })
        });
    }
    async resolveTicket(id, resolution) {
        return this.request(`/tickets/${id}/resolve`, {
            method: 'POST',
            body: JSON.stringify({
                resolution
            })
        });
    }
    async addTicketMessage(id, message) {
        return this.request(`/tickets/${id}/message`, {
            method: 'POST',
            body: JSON.stringify({
                message
            })
        });
    }
    // Admin Announcements
    async getAnnouncements() {
        return this.request('/admin/announcements');
    }
    async createAnnouncement(data) {
        return this.request('/admin/announcements', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
    async updateAnnouncement(id, data) {
        return this.request(`/admin/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }
    async deleteAnnouncement(id) {
        return this.request(`/admin/announcements/${id}`, {
            method: 'DELETE'
        });
    }
    // Admin Withdrawals
    async completeWithdrawal(id) {
        return this.request(`/withdrawals/${id}/complete`, {
            method: 'POST'
        });
    }
    // Admin KYC
    async getKYCDetails(id) {
        return this.request(`/kyc/${id}`);
    }
}
const api = new ApiClient();
const __TURBOPACK__default__export__ = api;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/context/AuthContext.jsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "default",
    ()=>__TURBOPACK__default__export__,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/api.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])({});
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            checkAuth();
        }
    }["AuthProvider.useEffect"], []);
    const checkAuth = async ()=>{
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].getMe();
                setUser(data.user);
            }
        } catch (err) {
            localStorage.removeItem('token');
            setUser(null);
        } finally{
            setLoading(false);
        }
    };
    // Send OTP to phone
    const sendOtp = async (phone)=>{
        try {
            setError(null);
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].sendOtp(phone);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };
    // Verify OTP and login
    const verifyOtp = async (phone, otp)=>{
        try {
            setError(null);
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].verifyOtp(phone, otp);
            if (data.token) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
            }
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };
    // Register new user (after OTP verification)
    const register = async (userData)=>{
        try {
            setError(null);
            const data = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].register(userData);
            if (data.token) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
            }
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };
    const logout = async ()=>{
        try {
            await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$api$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["api"].logout();
        } catch (err) {
        // Ignore logout errors
        } finally{
            localStorage.removeItem('token');
            setUser(null);
        }
    };
    const updateUser = (userData)=>{
        setUser((prev)=>({
                ...prev,
                ...userData
            }));
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            loading,
            error,
            sendOtp,
            verifyOtp,
            register,
            logout,
            updateUser,
            checkAuth,
            isAuthenticated: !!user
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/context/AuthContext.jsx",
        lineNumber: 92,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "PA9FxEY9xSNRrsSqaLtbYei52Hs=");
_c = AuthProvider;
const useAuth = ()=>{
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
const __TURBOPACK__default__export__ = AuthContext;
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1677d3dd._.js.map