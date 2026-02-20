const PlayerAnalytics = require('../models/PlayerAnalytics');
const PlayerStats = require('../models/PlayerStats');
const Match = require('../models/Match');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Get player analytics dashboard data
exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get or create player analytics
        let analytics = await PlayerAnalytics.getOrCreate(userId);
        
        // Get player stats
        const playerStats = await PlayerStats.findOne({ user: userId });
        
        // Get user info
        const user = await User.findById(userId).select('name avatar level xp');
        
        // Get recent matches
        const recentMatches = await Match.find({
            'joinedUsers.user': userId,
            status: 'completed'
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title gameType mode scheduledAt status joinedUsers');
        
        // Get recent transactions
        const recentTransactions = await Transaction.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('type category amount description createdAt');
        
        // Calculate summary stats
        const summary = {
            totalMatches: playerStats?.totalMatches || 0,
            totalWins: playerStats?.totalWins || 0,
            totalKills: playerStats?.totalKills || 0,
            totalEarnings: playerStats?.totalEarnings || 0,
            winRate: playerStats?.winRate || 0,
            kdRatio: playerStats?.kdRatio || 0,
            skillRating: playerStats?.skillRating || 1000,
            level: user?.level || 'bronze',
            xp: user?.xp || 0
        };
        
        res.json({
            success: true,
            data: {
                summary,
                analytics,
                recentMatches,
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error getting analytics dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics dashboard',
            error: error.message
        });
    }
};

// Get performance chart data
exports.getPerformanceChart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { period = '7d', metric = 'kills' } = req.query;
        
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        let chartData = [];
        let labels = [];
        
        const now = new Date();
        
        if (period === '7d') {
            // Last 7 days
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                date.setHours(0, 0, 0, 0);
                
                const dayStat = analytics.dailyStats.find(ds => 
                    new Date(ds.date).getTime() === date.getTime()
                );
                
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
                
                switch (metric) {
                    case 'kills':
                        chartData.push(dayStat?.totalKills || 0);
                        break;
                    case 'wins':
                        chartData.push(dayStat?.matchesWon || 0);
                        break;
                    case 'matches':
                        chartData.push(dayStat?.matchesPlayed || 0);
                        break;
                    case 'earnings':
                        chartData.push(dayStat?.earnings || 0);
                        break;
                    case 'kd':
                        chartData.push(dayStat?.totalDeaths > 0 ? 
                            (dayStat.totalKills / dayStat.totalDeaths).toFixed(2) : 0);
                        break;
                    default:
                        chartData.push(dayStat?.totalKills || 0);
                }
            }
        } else if (period === '30d') {
            // Last 30 days
            for (let i = 29; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                date.setHours(0, 0, 0, 0);
                
                const dayStat = analytics.dailyStats.find(ds => 
                    new Date(ds.date).getTime() === date.getTime()
                );
                
                labels.push(date.getDate());
                
                switch (metric) {
                    case 'kills':
                        chartData.push(dayStat?.totalKills || 0);
                        break;
                    case 'wins':
                        chartData.push(dayStat?.matchesWon || 0);
                        break;
                    case 'matches':
                        chartData.push(dayStat?.matchesPlayed || 0);
                        break;
                    case 'earnings':
                        chartData.push(dayStat?.earnings || 0);
                        break;
                    case 'kd':
                        chartData.push(dayStat?.totalDeaths > 0 ? 
                            (dayStat.totalKills / dayStat.totalDeaths).toFixed(2) : 0);
                        break;
                    default:
                        chartData.push(dayStat?.totalKills || 0);
                }
            }
        } else if (period === '90d') {
            // Last 90 days (grouped by week)
            const weeks = {};
            for (let i = 89; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const weekKey = getWeekKey(date);
                
                if (!weeks[weekKey]) {
                    weeks[weekKey] = { kills: 0, wins: 0, matches: 0, earnings: 0, deaths: 0 };
                }
                
                const dayStat = analytics.dailyStats.find(ds => 
                    new Date(ds.date).getTime() === date.getTime()
                );
                
                if (dayStat) {
                    weeks[weekKey].kills += dayStat.totalKills;
                    weeks[weekKey].wins += dayStat.matchesWon;
                    weeks[weekKey].matches += dayStat.matchesPlayed;
                    weeks[weekKey].earnings += dayStat.earnings;
                    weeks[weekKey].deaths += dayStat.totalDeaths;
                }
            }
            
            labels = Object.keys(weeks);
            chartData = Object.values(weeks).map(week => {
                switch (metric) {
                    case 'kills':
                        return week.kills;
                    case 'wins':
                        return week.wins;
                    case 'matches':
                        return week.matches;
                    case 'earnings':
                        return week.earnings;
                    case 'kd':
                        return week.deaths > 0 ? (week.kills / week.deaths).toFixed(2) : 0;
                    default:
                        return week.kills;
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                labels,
                chartData,
                metric,
                period
            }
        });
    } catch (error) {
        console.error('Error getting performance chart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance chart',
            error: error.message
        });
    }
};

// Get map performance data
exports.getMapPerformance = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        const mapData = analytics.mapPerformance.map(map => ({
            mapName: map.mapName,
            matchesPlayed: map.matchesPlayed,
            matchesWon: map.matchesWon,
            totalKills: map.totalKills,
            totalDeaths: map.totalDeaths,
            winRate: map.winRate,
            kdRatio: map.kdRatio,
            avgPlacement: map.avgPlacement,
            favoriteWeapon: map.favoriteWeapon,
            lastPlayed: map.lastPlayed
        })).sort((a, b) => b.matchesPlayed - a.matchesPlayed);
        
        res.json({
            success: true,
            data: mapData
        });
    } catch (error) {
        console.error('Error getting map performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch map performance',
            error: error.message
        });
    }
};

// Get mode performance data
exports.getModePerformance = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        const modeData = analytics.modePerformance.map(mode => ({
            mode: mode.mode,
            matchesPlayed: mode.matchesPlayed,
            matchesWon: mode.matchesWon,
            totalKills: mode.totalKills,
            totalDeaths: mode.totalDeaths,
            winRate: mode.winRate,
            kdRatio: mode.kdRatio,
            avgPlacement: mode.avgPlacement,
            earnings: mode.earnings
        })).sort((a, b) => b.matchesPlayed - a.matchesPlayed);
        
        res.json({
            success: true,
            data: modeData
        });
    } catch (error) {
        console.error('Error getting mode performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch mode performance',
            error: error.message
        });
    }
};

// Get weapon statistics
exports.getWeaponStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        const weaponData = analytics.weaponStats
            .filter(w => w.usageCount > 0)
            .map(weapon => ({
                weaponName: weapon.weaponName,
                kills: weapon.kills,
                damage: weapon.damage,
                headshots: weapon.headshots,
                usageCount: weapon.usageCount,
                accuracy: weapon.accuracy,
                lastUsed: weapon.lastUsed
            }))
            .sort((a, b) => b.kills - a.kills);
        
        res.json({
            success: true,
            data: weaponData
        });
    } catch (error) {
        console.error('Error getting weapon stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch weapon stats',
            error: error.message
        });
    }
};

// Get time-based performance
exports.getTimeBasedPerformance = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        const hourlyData = analytics.hourlyPerformance.map(h => ({
            hour: h.hour,
            matchesPlayed: h.matchesPlayed,
            matchesWon: h.matchesWon,
            totalKills: h.totalKills,
            winRate: h.winRate
        }));
        
        const dayData = analytics.dayPerformance.map(d => ({
            day: d.day,
            dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.day],
            matchesPlayed: d.matchesPlayed,
            matchesWon: d.matchesWon,
            totalKills: d.totalKills,
            winRate: d.winRate
        }));
        
        res.json({
            success: true,
            data: {
                hourly: hourlyData,
                daily: dayData
            }
        });
    } catch (error) {
        console.error('Error getting time-based performance:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch time-based performance',
            error: error.message
        });
    }
};

// Get performance trends
exports.getPerformanceTrends = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        res.json({
            success: true,
            data: analytics.performanceTrend
        });
    } catch (error) {
        console.error('Error getting performance trends:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance trends',
            error: error.message
        });
    }
};

// Get insights
exports.getInsights = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        // Generate fresh insights
        analytics.generateInsights();
        await analytics.save();
        
        res.json({
            success: true,
            data: analytics.insights
        });
    } catch (error) {
        console.error('Error getting insights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch insights',
            error: error.message
        });
    }
};

// Get engagement metrics
exports.getEngagementMetrics = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        res.json({
            success: true,
            data: analytics.engagement
        });
    } catch (error) {
        console.error('Error getting engagement metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch engagement metrics',
            error: error.message
        });
    }
};

// Get comparative stats (percentile rank)
exports.getComparativeStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        // Get all users for comparison
        const allUsers = await PlayerStats.find({});
        const totalUsers = allUsers.length;
        
        if (totalUsers === 0) {
            return res.json({
                success: true,
                data: {
                    global: 0,
                    kills: 0,
                    wins: 0,
                    earnings: 0
                }
            });
        }
        
        const playerStats = await PlayerStats.findOne({ user: userId });
        
        if (!playerStats) {
            return res.json({
                success: true,
                data: {
                    global: 0,
                    kills: 0,
                    wins: 0,
                    earnings: 0
                }
            });
        }
        
        // Calculate percentiles
        const killsPercentile = calculatePercentile(
            allUsers.map(u => u.totalKills),
            playerStats.totalKills
        );
        
        const winsPercentile = calculatePercentile(
            allUsers.map(u => u.totalWins),
            playerStats.totalWins
        );
        
        const earningsPercentile = calculatePercentile(
            allUsers.map(u => u.totalEarnings),
            playerStats.totalEarnings
        );
        
        // Calculate global percentile (average of all)
        const globalPercentile = Math.round(
            (killsPercentile + winsPercentile + earningsPercentile) / 3
        );
        
        res.json({
            success: true,
            data: {
                global: globalPercentile,
                kills: Math.round(killsPercentile),
                wins: Math.round(winsPercentile),
                earnings: Math.round(earningsPercentile)
            }
        });
    } catch (error) {
        console.error('Error getting comparative stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch comparative stats',
            error: error.message
        });
    }
};

// Get earnings chart
exports.getEarningsChart = async (req, res) => {
    try {
        const userId = req.user._id;
        const { period = '30d' } = req.query;
        
        const transactions = await Transaction.find({
            user: userId,
            type: 'credit',
            status: 'completed'
        }).sort({ createdAt: 1 });
        
        let labels = [];
        let chartData = [];
        let cumulativeData = [];
        
        const now = new Date();
        let startDate;
        
        if (period === '7d') {
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (period === '30d') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (period === '90d') {
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        } else {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        // Group transactions by day
        const dailyEarnings = {};
        let cumulative = 0;
        
        transactions.forEach(tx => {
            if (tx.createdAt >= startDate) {
                const dateKey = tx.createdAt.toISOString().split('T')[0];
                if (!dailyEarnings[dateKey]) {
                    dailyEarnings[dateKey] = 0;
                }
                dailyEarnings[dateKey] += tx.amount;
            }
        });
        
        // Generate labels and data
        const daysDiff = Math.ceil((now - startDate) / (24 * 60 * 60 * 1000));
        for (let i = 0; i <= daysDiff; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const dateKey = date.toISOString().split('T')[0];
            
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            const dailyAmount = dailyEarnings[dateKey] || 0;
            chartData.push(dailyAmount);
            cumulative += dailyAmount;
            cumulativeData.push(cumulative);
        }
        
        res.json({
            success: true,
            data: {
                labels,
                dailyEarnings: chartData,
                cumulativeEarnings: cumulativeData,
                period
            }
        });
    } catch (error) {
        console.error('Error getting earnings chart:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earnings chart',
            error: error.message
        });
    }
};

// Get match history with detailed stats
exports.getMatchHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 20, gameType, mode } = req.query;
        
        const query = {
            'joinedUsers.user': userId,
            status: 'completed'
        };
        
        if (gameType) query.gameType = gameType;
        if (mode) query.mode = mode;
        
        const matches = await Match.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .select('title gameType mode map scheduledAt status joinedUsers prizePool');
        
        const total = await Match.countDocuments(query);
        
        // Extract user's performance from each match
        const matchHistory = matches.map(match => {
            const userSlot = match.joinedUsers.find(ju => {
                const juUserId = ju.user._id ? ju.user._id : ju.user;
                return juUserId.toString() === userId.toString();
            });
            
            return {
                matchId: match._id,
                title: match.title,
                gameType: match.gameType,
                mode: match.mode,
                map: match.map,
                date: match.scheduledAt,
                kills: userSlot?.kills || 0,
                position: userSlot?.position || 0,
                prizeWon: userSlot?.prizewon || 0,
                screenshot: userSlot?.screenshot?.url || null
            };
        });
        
        res.json({
            success: true,
            data: {
                matches: matchHistory,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('Error getting match history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch match history',
            error: error.message
        });
    }
};

// Update analytics after a match
exports.updateAnalytics = async (req, res) => {
    try {
        const { matchId, matchData } = req.body;
        const userId = req.user._id;
        
        const analytics = await PlayerAnalytics.getOrCreate(userId);
        
        // Update daily stats
        analytics.updateDailyStats(matchData);
        
        // Update map performance
        if (matchData.map) {
            analytics.updateMapPerformance(matchData.map, matchData);
        }
        
        // Update mode performance
        if (matchData.mode) {
            analytics.updateModePerformance(matchData.mode, matchData);
        }
        
        // Update weapon stats
        if (matchData.weapon) {
            analytics.updateWeaponStats(matchData.weapon, matchData);
        }
        
        // Update performance trends
        analytics.updatePerformanceTrends();
        
        // Update streaks
        if (matchData.won) {
            analytics.currentWinStreak += 1;
            analytics.currentLossStreak = 0;
            if (analytics.currentWinStreak > analytics.longestWinStreak) {
                analytics.longestWinStreak = analytics.currentWinStreak;
            }
        } else {
            analytics.currentLossStreak += 1;
            analytics.currentWinStreak = 0;
            if (analytics.currentLossStreak > analytics.longestLossStreak) {
                analytics.longestLossStreak = analytics.currentLossStreak;
            }
        }
        
        // Update best/worst match
        if (matchData.kills > (analytics.bestMatch?.kills || 0)) {
            analytics.bestMatch = {
                matchId,
                kills: matchData.kills,
                placement: matchData.placement,
                damage: matchData.damage,
                date: new Date()
            };
        }
        
        if (!analytics.worstMatch || matchData.placement > (analytics.worstMatch?.placement || 0)) {
            analytics.worstMatch = {
                matchId,
                kills: matchData.kills,
                placement: matchData.placement,
                damage: matchData.damage,
                date: new Date()
            };
        }
        
        // Generate insights
        analytics.generateInsights();
        
        await analytics.save();
        
        res.json({
            success: true,
            message: 'Analytics updated successfully',
            data: analytics
        });
    } catch (error) {
        console.error('Error updating analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update analytics',
            error: error.message
        });
    }
};

// Helper function to calculate percentile
function calculatePercentile(values, targetValue) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = sorted.findIndex(v => v >= targetValue);
    
    if (index === -1) return 100;
    if (index === 0) return 0;
    
    return (index / sorted.length) * 100;
}

// Helper function to get week key
function getWeekKey(date) {
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
}

// Helper function to get week number
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}
