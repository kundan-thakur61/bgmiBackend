require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Match, Tournament, Announcement } = require('../models');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/battlexzone');
    console.log('Connected to MongoDB');
    
    // Clear existing data (be careful in production!)
    if (process.env.NODE_ENV === 'development') {
      await User.deleteMany({});
      await Match.deleteMany({});
      await Tournament.deleteMany({});
      await Announcement.deleteMany({});
      console.log('Cleared existing data');
    }
    
    // Create Super Admin
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12);
    const superAdmin = await User.create({
      name: 'Super Admin',
      email: process.env.ADMIN_EMAIL || 'admin@battlexzone.com',
      phone: '9999999999',
      password: adminPassword,
      role: 'super_admin',
      isPhoneVerified: true,
      isEmailVerified: true,
      isKycVerified: true,
      isAgeVerified: true,
      walletBalance: 100000,
      level: 'diamond'
    });
    console.log('Created Super Admin:', superAdmin.email);
    
    // Create test users
    const testUsers = await User.create([
      {
        name: 'Test Player',
        phone: '9876543210',
        isPhoneVerified: true,
        walletBalance: 5000,
        level: 'gold',
        matchesPlayed: 50,
        matchesWon: 12
      },
      {
        name: 'Pro Gamer',
        phone: '9876543211',
        isPhoneVerified: true,
        isKycVerified: true,
        walletBalance: 15000,
        level: 'platinum',
        matchesPlayed: 200,
        matchesWon: 65
      }
    ]);
    console.log('Created test users');
    
    // Create sample matches
    const now = new Date();
    const matches = await Match.create([
      {
        title: 'PUBG Mobile Pro League Match #1',
        description: 'Compete in this exciting solo match and win big prizes!',
        gameType: 'pubg_mobile',
        matchType: 'match_win',
        mode: 'solo',
        map: 'erangel',
        entryFee: 50,
        prizePool: 400,
        perKillPrize: 5,
        maxSlots: 100,
        scheduledAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
        status: 'registration_open',
        createdBy: superAdmin._id,
        prizeDistribution: [
          { position: 1, prize: 200, label: '1st Place' },
          { position: 2, prize: 120, label: '2nd Place' },
          { position: 3, prize: 80, label: '3rd Place' }
        ],
        rules: [
          'No emulators allowed',
          'Fair play mandatory',
          'Screenshots required after match',
          'No teaming in solo'
        ],
        isFeatured: true
      },
      {
        title: 'Free Fire Squad Battle',
        description: 'Team up with your squad and dominate the battlefield!',
        gameType: 'free_fire',
        matchType: 'match_win',
        mode: 'squad',
        map: 'bermuda',
        entryFee: 100,
        prizePool: 800,
        perKillPrize: 10,
        maxSlots: 48,
        scheduledAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
        status: 'registration_open',
        createdBy: superAdmin._id,
        prizeDistribution: [
          { position: 1, prize: 400, label: '1st Place' },
          { position: 2, prize: 250, label: '2nd Place' },
          { position: 3, prize: 150, label: '3rd Place' }
        ],
        isFeatured: true
      },
      {
        title: 'TDM Challenge - High Stakes',
        description: 'Quick TDM match with amazing rewards!',
        gameType: 'pubg_mobile',
        matchType: 'tdm',
        mode: 'squad',
        entryFee: 25,
        prizePool: 180,
        maxSlots: 8,
        scheduledAt: new Date(now.getTime() + 1 * 60 * 60 * 1000),
        status: 'registration_open',
        createdBy: superAdmin._id,
        prizeDistribution: [
          { position: 1, prize: 180, label: 'Winner' }
        ]
      }
    ]);
    console.log('Created sample matches');
    
    // Create sample tournament
    const tournament = await Tournament.create({
      title: 'BattleZone Weekly Championship',
      description: 'The ultimate weekly tournament with massive prize pool. Top players battle it out for glory and rewards!',
      gameType: 'pubg_mobile',
      format: 'battle_royale',
      mode: 'squad',
      entryFee: 200,
      prizePool: 10000,
      perKillPrize: 15,
      maxTeams: 25,
      registrationStartAt: now,
      registrationEndAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      startAt: new Date(now.getTime() + 48 * 60 * 60 * 1000),
      status: 'registration_open',
      createdBy: superAdmin._id,
      prizeDistribution: [
        { position: 1, prize: 4000, percentage: 40, label: 'Champions' },
        { position: 2, prize: 2500, percentage: 25, label: '2nd Place' },
        { position: 3, prize: 1500, percentage: 15, label: '3rd Place' },
        { position: 4, prize: 1000, percentage: 10, label: '4th Place' },
        { position: 5, prize: 1000, percentage: 10, label: '5th Place' }
      ],
      rules: [
        'Squad of 4 players required',
        'All team members must be registered',
        'No emulators or hacks',
        'Fair play strictly enforced'
      ],
      isFeatured: true
    });
    console.log('Created sample tournament');
    
    // Create announcements
    await Announcement.create([
      {
        title: 'Welcome to BattleZone!',
        message: 'India\'s premier esports platform for PUBG Mobile and Free Fire. Join matches, win prizes!',
        type: 'info',
        placement: 'banner',
        isActive: true,
        createdBy: superAdmin._id
      },
      {
        title: 'New Season Started!',
        message: 'Season 1 is now live! Climb the ranks and unlock exclusive rewards.',
        type: 'success',
        placement: 'popup',
        isActive: true,
        isDismissible: true,
        createdBy: superAdmin._id
      }
    ]);
    console.log('Created announcements');
    
    console.log('\n✅ Database seeded successfully!');
    console.log('\n📧 Admin Login:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@battlexzone.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
