const mongoose = require('mongoose');

const playerAnalyticsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
        index: true
    },
    // Daily statistics
    dailyStats: [{
        date: {
            type: Date,
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        totalDeaths: { type: Number, default: 0 },
        totalDamage: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        playTime: { type: Number, default: 0 }, // in minutes
        avgPlacement: { type: Number, default: 0 },
        headshots: { type: Number, default: 0 }
    }],
    // Weekly statistics
    weeklyStats: [{
        week: {
            type: String, // Format: "2026-W05"
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        totalDeaths: { type: Number, default: 0 },
        totalDamage: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        playTime: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        kdRatio: { type: Number, default: 0 }
    }],
    // Monthly statistics
    monthlyStats: [{
        month: {
            type: String, // Format: "2026-02"
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        totalDeaths: { type: Number, default: 0 },
        totalDamage: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 },
        playTime: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        kdRatio: { type: Number, default: 0 },
        avgPlacement: { type: Number, default: 0 }
    }],
    // Map performance
    mapPerformance: [{
        mapName: {
            type: String,
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        totalDeaths: { type: Number, default: 0 },
        avgPlacement: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        kdRatio: { type: Number, default: 0 },
        favoriteWeapon: String,
        lastPlayed: Date
    }],
    // Mode performance
    modePerformance: [{
        mode: {
            type: String,
            enum: ['solo', 'duo', 'squad'],
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        totalDeaths: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 },
        kdRatio: { type: Number, default: 0 },
        avgPlacement: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 }
    }],
    // Weapon statistics
    weaponStats: [{
        weaponName: {
            type: String,
            required: true
        },
        kills: { type: Number, default: 0 },
        damage: { type: Number, default: 0 },
        headshots: { type: Number, default: 0 },
        usageCount: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 }, // percentage
        lastUsed: Date
    }],
    // Time-based performance
    hourlyPerformance: [{
        hour: {
            type: Number,
            min: 0,
            max: 23,
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 }
    }],
    // Day-based performance
    dayPerformance: [{
        day: {
            type: Number,
            min: 0,
            max: 6,
            required: true
        },
        matchesPlayed: { type: Number, default: 0 },
        matchesWon: { type: Number, default: 0 },
        totalKills: { type: Number, default: 0 },
        winRate: { type: Number, default: 0 }
    }],
    // Streaks
    currentWinStreak: { type: Number, default: 0 },
    longestWinStreak: { type: Number, default: 0 },
    currentLossStreak: { type: Number, default: 0 },
    longestLossStreak: { type: Number, default: 0 },
    // Best performances
    bestMatch: {
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match'
        },
        kills: Number,
        placement: Number,
        damage: Number,
        date: Date
    },
    worstMatch: {
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match'
        },
        kills: Number,
        placement: Number,
        damage: Number,
        date: Date
    },
    // Performance trends
    performanceTrend: {
        last7Days: {
            matchesPlayed: { type: Number, default: 0 },
            winRate: { type: Number, default: 0 },
            kdRatio: { type: Number, default: 0 },
            avgKills: { type: Number, default: 0 }
        },
        last30Days: {
            matchesPlayed: { type: Number, default: 0 },
            winRate: { type: Number, default: 0 },
            kdRatio: { type: Number, default: 0 },
            avgKills: { type: Number, default: 0 }
        },
        last90Days: {
            matchesPlayed: { type: Number, default: 0 },
            winRate: { type: Number, default: 0 },
            kdRatio: { type: Number, default: 0 },
            avgKills: { type: Number, default: 0 }
        }
    },
    // Comparative stats
    percentileRank: {
        global: { type: Number, default: 0 }, // 0-100
        kills: { type: Number, default: 0 },
        wins: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 }
    },
    // Engagement metrics
    engagement: {
        avgSessionDuration: { type: Number, default: 0 }, // in minutes
        totalSessionTime: { type: Number, default: 0 },
        sessionsCount: { type: Number, default: 0 },
        lastActiveDate: Date,
        activeDaysThisMonth: { type: Number, default: 0 },
        longestSession: { type: Number, default: 0 }
    },
    // Prediction/Insights
    insights: [{
        type: {
            type: String,
            enum: ['strength', 'weakness', 'trend', 'achievement', 'recommendation']
        },
        title: String,
        description: String,
        icon: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes
playerAnalyticsSchema.index({ user: 1 });
playerAnalyticsSchema.index({ 'dailyStats.date': -1 });
playerAnalyticsSchema.index({ 'weeklyStats.week': -1 });
playerAnalyticsSchema.index({ 'monthlyStats.month': -1 });
playerAnalyticsSchema.index({ 'mapPerformance.mapName': 1 });
playerAnalyticsSchema.index({ 'modePerformance.mode': 1 });
playerAnalyticsSchema.index({ 'weaponStats.weaponName': 1 });

// Static: Get or create player analytics
playerAnalyticsSchema.statics.getOrCreate = async function(userId) {
    let analytics = await this.findOne({ user: userId });
    if (!analytics) {
        analytics = await this.create({ user: userId });
    }
    return analytics;
};

// Method: Update daily stats
playerAnalyticsSchema.methods.updateDailyStats = function(matchData) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let dailyStat = this.dailyStats.find(ds => 
        new Date(ds.date).getTime() === today.getTime()
    );
    
    if (!dailyStat) {
        dailyStat = {
            date: today,
            matchesPlayed: 0,
            matchesWon: 0,
            totalKills: 0,
            totalDeaths: 0,
            totalDamage: 0,
            earnings: 0,
            playTime: 0,
            avgPlacement: 0,
            headshots: 0
        };
        this.dailyStats.push(dailyStat);
    }
    
    dailyStat.matchesPlayed += 1;
    if (matchData.won) dailyStat.matchesWon += 1;
    dailyStat.totalKills += matchData.kills || 0;
    dailyStat.totalDeaths += matchData.deaths || 0;
    dailyStat.totalDamage += matchData.damage || 0;
    dailyStat.earnings += matchData.earnings || 0;
    dailyStat.playTime += matchData.playTime || 0;
    dailyStat.headshots += matchData.headshots || 0;
    
    // Recalculate average placement
    const totalMatches = dailyStat.matchesPlayed;
    if (totalMatches > 0) {
        dailyStat.avgPlacement = ((dailyStat.avgPlacement * (totalMatches - 1)) + (matchData.placement || 0)) / totalMatches;
    }
    
    this.lastUpdated = new Date();
    return this;
};

// Method: Update map performance
playerAnalyticsSchema.methods.updateMapPerformance = function(mapName, matchData) {
    let mapStat = this.mapPerformance.find(mp => mp.mapName === mapName);
    
    if (!mapStat) {
        mapStat = {
            mapName,
            matchesPlayed: 0,
            matchesWon: 0,
            totalKills: 0,
            totalDeaths: 0,
            avgPlacement: 0,
            winRate: 0,
            kdRatio: 0,
            favoriteWeapon: null,
            lastPlayed: new Date()
        };
        this.mapPerformance.push(mapStat);
    }
    
    mapStat.matchesPlayed += 1;
    if (matchData.won) mapStat.matchesWon += 1;
    mapStat.totalKills += matchData.kills || 0;
    mapStat.totalDeaths += matchData.deaths || 0;
    mapStat.lastPlayed = new Date();
    
    // Calculate stats
    if (mapStat.matchesPlayed > 0) {
        mapStat.winRate = (mapStat.matchesWon / mapStat.matchesPlayed) * 100;
        mapStat.kdRatio = mapStat.totalDeaths > 0 ? mapStat.totalKills / mapStat.totalDeaths : mapStat.totalKills;
        mapStat.avgPlacement = ((mapStat.avgPlacement * (mapStat.matchesPlayed - 1)) + (matchData.placement || 0)) / mapStat.matchesPlayed;
    }
    
    // Update favorite weapon
    if (matchData.weapon) {
        mapStat.favoriteWeapon = matchData.weapon;
    }
    
    return this;
};

// Method: Update mode performance
playerAnalyticsSchema.methods.updateModePerformance = function(mode, matchData) {
    let modeStat = this.modePerformance.find(mp => mp.mode === mode);
    
    if (!modeStat) {
        modeStat = {
            mode,
            matchesPlayed: 0,
            matchesWon: 0,
            totalKills: 0,
            totalDeaths: 0,
            winRate: 0,
            kdRatio: 0,
            avgPlacement: 0,
            earnings: 0
        };
        this.modePerformance.push(modeStat);
    }
    
    modeStat.matchesPlayed += 1;
    if (matchData.won) modeStat.matchesWon += 1;
    modeStat.totalKills += matchData.kills || 0;
    modeStat.totalDeaths += matchData.deaths || 0;
    modeStat.earnings += matchData.earnings || 0;
    
    if (modeStat.matchesPlayed > 0) {
        modeStat.winRate = (modeStat.matchesWon / modeStat.matchesPlayed) * 100;
        modeStat.kdRatio = modeStat.totalDeaths > 0 ? modeStat.totalKills / modeStat.totalDeaths : modeStat.totalKills;
        modeStat.avgPlacement = ((modeStat.avgPlacement * (modeStat.matchesPlayed - 1)) + (matchData.placement || 0)) / modeStat.matchesPlayed;
    }
    
    return this;
};

// Method: Update weapon stats
playerAnalyticsSchema.methods.updateWeaponStats = function(weaponName, matchData) {
    let weaponStat = this.weaponStats.find(ws => ws.weaponName === weaponName);
    
    if (!weaponStat) {
        weaponStat = {
            weaponName,
            kills: 0,
            damage: 0,
            headshots: 0,
            usageCount: 0,
            accuracy: 0,
            lastUsed: new Date()
        };
        this.weaponStats.push(weaponStat);
    }
    
    weaponStat.kills += matchData.killsWithWeapon || 0;
    weaponStat.damage += matchData.damageWithWeapon || 0;
    weaponStat.headshots += matchData.headshotsWithWeapon || 0;
    weaponStat.usageCount += 1;
    weaponStat.lastUsed = new Date();
    
    // Calculate accuracy (simplified)
    if (matchData.shotsFired && matchData.shotsFired > 0) {
        weaponStat.accuracy = ((weaponStat.kills / matchData.shotsFired) * 100).toFixed(2);
    }
    
    return this;
};

// Method: Update performance trends
playerAnalyticsSchema.methods.updatePerformanceTrends = function() {
    const now = new Date();
    
    // Last 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recent7Days = this.dailyStats.filter(ds => new Date(ds.date) >= sevenDaysAgo);
    
    if (recent7Days.length > 0) {
        const totalMatches = recent7Days.reduce((sum, ds) => sum + ds.matchesPlayed, 0);
        const totalWins = recent7Days.reduce((sum, ds) => sum + ds.matchesWon, 0);
        const totalKills = recent7Days.reduce((sum, ds) => sum + ds.totalKills, 0);
        const totalDeaths = recent7Days.reduce((sum, ds) => sum + ds.totalDeaths, 0);
        
        this.performanceTrend.last7Days = {
            matchesPlayed: totalMatches,
            winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
            kdRatio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
            avgKills: totalMatches > 0 ? totalKills / totalMatches : 0
        };
    }
    
    // Last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recent30Days = this.dailyStats.filter(ds => new Date(ds.date) >= thirtyDaysAgo);
    
    if (recent30Days.length > 0) {
        const totalMatches = recent30Days.reduce((sum, ds) => sum + ds.matchesPlayed, 0);
        const totalWins = recent30Days.reduce((sum, ds) => sum + ds.matchesWon, 0);
        const totalKills = recent30Days.reduce((sum, ds) => sum + ds.totalKills, 0);
        const totalDeaths = recent30Days.reduce((sum, ds) => sum + ds.totalDeaths, 0);
        
        this.performanceTrend.last30Days = {
            matchesPlayed: totalMatches,
            winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
            kdRatio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
            avgKills: totalMatches > 0 ? totalKills / totalMatches : 0
        };
    }
    
    // Last 90 days
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const recent90Days = this.dailyStats.filter(ds => new Date(ds.date) >= ninetyDaysAgo);
    
    if (recent90Days.length > 0) {
        const totalMatches = recent90Days.reduce((sum, ds) => sum + ds.matchesPlayed, 0);
        const totalWins = recent90Days.reduce((sum, ds) => sum + ds.matchesWon, 0);
        const totalKills = recent90Days.reduce((sum, ds) => sum + ds.totalKills, 0);
        const totalDeaths = recent90Days.reduce((sum, ds) => sum + ds.totalDeaths, 0);
        
        this.performanceTrend.last90Days = {
            matchesPlayed: totalMatches,
            winRate: totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0,
            kdRatio: totalDeaths > 0 ? totalKills / totalDeaths : totalKills,
            avgKills: totalMatches > 0 ? totalKills / totalMatches : 0
        };
    }
    
    return this;
};

// Method: Generate insights
playerAnalyticsSchema.methods.generateInsights = function() {
    const insights = [];
    
    // Check win streak
    if (this.currentWinStreak >= 3) {
        insights.push({
            type: 'achievement',
            title: 'Hot Streak!',
            description: `You're on a ${this.currentWinStreak}-match winning streak! Keep it up!`,
            icon: '🔥'
        });
    }
    
    // Check favorite map
    if (this.mapPerformance.length > 0) {
        const favoriteMap = this.mapPerformance.reduce((best, current) => 
            current.matchesPlayed > best.matchesPlayed ? current : best
        );
        if (favoriteMap.matchesPlayed >= 10) {
            insights.push({
                type: 'strength',
                title: 'Map Specialist',
                description: `You perform best on ${favoriteMap.mapName} with ${favoriteMap.winRate.toFixed(1)}% win rate`,
                icon: '🗺️'
            });
        }
    }
    
    // Check favorite mode
    if (this.modePerformance.length > 0) {
        const favoriteMode = this.modePerformance.reduce((best, current) => 
            current.matchesPlayed > best.matchesPlayed ? current : best
        );
        if (favoriteMode.matchesPlayed >= 10) {
            insights.push({
                type: 'strength',
                title: 'Mode Master',
                description: `You excel in ${favoriteMode.mode} mode with ${favoriteMode.kdRatio.toFixed(2)} K/D ratio`,
                icon: '🎯'
            });
        }
    }
    
    // Check improvement trend
    if (this.performanceTrend.last7Days.winRate > this.performanceTrend.last30Days.winRate + 10) {
        insights.push({
            type: 'trend',
            title: 'Improving Fast!',
            description: 'Your win rate has improved significantly in the last 7 days',
            icon: '📈'
        });
    }
    
    // Check for recommendation
    if (this.performanceTrend.last7Days.matchesPlayed < 5) {
        insights.push({
            type: 'recommendation',
            title: 'Play More',
            description: 'Play more matches to improve your skills and stats',
            icon: '🎮'
        });
    }
    
    this.insights = insights;
    return this;
};

const PlayerAnalytics = mongoose.model('PlayerAnalytics', playerAnalyticsSchema);

module.exports = PlayerAnalytics;
