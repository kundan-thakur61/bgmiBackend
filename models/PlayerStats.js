const mongoose = require('mongoose');

const playerStatsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Overall Statistics
    totalMatches: {
        type: Number,
        default: 0
    },
    totalWins: {
        type: Number,
        default: 0
    },
    totalLosses: {
        type: Number,
        default: 0
    },
    totalKills: {
        type: Number,
        default: 0
    },
    totalDeaths: {
        type: Number,
        default: 0
    },
    totalAssists: {
        type: Number,
        default: 0
    },
    totalDamage: {
        type: Number,
        default: 0
    },
    totalHeadshots: {
        type: Number,
        default: 0
    },
    // Calculated Stats
    winRate: {
        type: Number,
        default: 0
    },
    kdRatio: {
        type: Number,
        default: 0
    },
    averageKills: {
        type: Number,
        default: 0
    },
    averageDamage: {
        type: Number,
        default: 0
    },
    headshotPercentage: {
        type: Number,
        default: 0
    },
    skillRating: {
        type: Number,
        default: 1000 // ELO-style rating
    },
    rank: {
        global: { type: Number, default: 0 },
        country: { type: Number, default: 0 }
    },
    // Tournament Stats
    tournamentStats: {
        participated: { type: Number, default: 0 },
        won: { type: Number, default: 0 },
        topThree: { type: Number, default: 0 },
        earnings: { type: Number, default: 0 }
    },
    // Streaks
    currentWinStreak: {
        type: Number,
        default: 0
    },
    longestWinStreak: {
        type: Number,
        default: 0
    },
    currentLossStreak: {
        type: Number,
        default: 0
    },
    // Recent Performance (last 10 matches)
    recentMatches: [{
        matchId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Match'
        },
        result: { type: String, enum: ['win', 'loss'] },
        kills: Number,
        deaths: Number,
        damage: Number,
        placement: Number,
        date: Date
    }],
    // Performance by Map
    mapStats: [{
        mapName: String,
        matches: Number,
        wins: Number,
        avgKills: Number,
        avgPlacement: Number
    }],
    // Performance by Mode
    modeStats: [{
        mode: String, // solo, duo, squad
        matches: Number,
        wins: Number,
        kdRatio: Number
    }],
    // Achievements
    mvpCount: {
        type: Number,
        default: 0
    },
    aceCount: {
        type: Number,
        default: 0 // 5+ kills in a match
    },
    chickenDinners: {
        type: Number,
        default: 0
    },
    // Time Stats
    totalPlayTime: {
        type: Number,
        default: 0 // in minutes
    },
    averageMatchDuration: {
        type: Number,
        default: 0 // in minutes
    },
    lastMatchDate: Date,
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Calculate all derived statistics
playerStatsSchema.methods.calculateStats = function () {
    // Win rate
    if (this.totalMatches > 0) {
        this.winRate = (this.totalWins / this.totalMatches) * 100;
    }

    // K/D Ratio
    if (this.totalDeaths > 0) {
        this.kdRatio = this.totalKills / this.totalDeaths;
    } else {
        this.kdRatio = this.totalKills;
    }

    // Average kills per match
    if (this.totalMatches > 0) {
        this.averageKills = this.totalKills / this.totalMatches;
        this.averageDamage = this.totalDamage / this.totalMatches;
    }

    // Headshot percentage
    if (this.totalKills > 0) {
        this.headshotPercentage = (this.totalHeadshots / this.totalKills) * 100;
    }

    this.lastUpdated = Date.now();
};

// Update stats after a match
playerStatsSchema.methods.updateAfterMatch = function (matchData) {
    this.totalMatches += 1;

    if (matchData.result === 'win') {
        this.totalWins += 1;
        this.currentWinStreak += 1;
        this.currentLossStreak = 0;

        if (this.currentWinStreak > this.longestWinStreak) {
            this.longestWinStreak = this.currentWinStreak;
        }

        if (matchData.placement === 1) {
            this.chickenDinners += 1;
        }
    } else {
        this.totalLosses += 1;
        this.currentLossStreak += 1;
        this.currentWinStreak = 0;
    }

    this.totalKills += matchData.kills || 0;
    this.totalDeaths += matchData.deaths || 0;
    this.totalAssists += matchData.assists || 0;
    this.totalDamage += matchData.damage || 0;
    this.totalHeadshots += matchData.headshots || 0;

    // Check for Ace
    if (matchData.kills >= 5) {
        this.aceCount += 1;
    }

    // Add to recent matches
    this.recentMatches.unshift({
        matchId: matchData.matchId,
        result: matchData.result,
        kills: matchData.kills,
        deaths: matchData.deaths,
        damage: matchData.damage,
        placement: matchData.placement,
        date: new Date()
    });

    // Keep only last 10 matches
    if (this.recentMatches.length > 10) {
        this.recentMatches = this.recentMatches.slice(0, 10);
    }

    this.lastMatchDate = new Date();

    // Recalculate all stats
    this.calculateStats();

    // Update skill rating (simplified ELO)
    this.updateSkillRating(matchData);
};

// Update skill rating based on match performance
playerStatsSchema.methods.updateSkillRating = function (matchData) {
    const K_FACTOR = 32;
    const expectedScore = 1 / (1 + Math.pow(10, (1200 - this.skillRating) / 400));

    let actualScore = 0;
    if (matchData.result === 'win') {
        actualScore = 1;
    } else if (matchData.placement <= 3) {
        actualScore = 0.5;
    }

    // Bonus for high kills
    const killBonus = Math.min(matchData.kills * 2, 20);

    const ratingChange = K_FACTOR * (actualScore - expectedScore) + killBonus;
    this.skillRating = Math.max(100, Math.min(3000, this.skillRating + ratingChange));
};

// Get performance trend
playerStatsSchema.methods.getPerformanceTrend = function () {
    if (this.recentMatches.length < 3) {
        return 'neutral';
    }

    const recentWins = this.recentMatches.slice(0, 5).filter(m => m.result === 'win').length;

    if (recentWins >= 4) return 'hot';
    if (recentWins >= 3) return 'good';
    if (recentWins <= 1) return 'cold';
    return 'neutral';
};

// Indexes (user already indexed via unique: true in schema)
playerStatsSchema.index({ skillRating: -1 });
playerStatsSchema.index({ winRate: -1 });
playerStatsSchema.index({ kdRatio: -1 });
playerStatsSchema.index({ totalWins: -1 });

const PlayerStats = mongoose.model('PlayerStats', playerStatsSchema);

module.exports = PlayerStats;
