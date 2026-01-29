
const mongoose = require('mongoose');
const Match = require('./models/Match');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log('Connected to MongoDB');

        const matchId = '696d0f2831271150b47b5886';

        try {
            const match = await Match.findById(matchId);
            if (match) {
                console.log(`Found match: ${match.title}, Scheduled: ${match.scheduledAt}, isChallenge: ${match.isChallenge}`);
                console.log(`Current registrationCloseTime: ${match.registrationCloseTime}`);

                // Update registrationCloseTime to scheduledAt if it's a challenge match
                // Or if it's not a challenge, maybe just bump it for testing?
                // Let's assume the user wants it to behave like a challenge match (which it likely is)

                if (match.isChallenge) {
                    match.registrationCloseTime = match.scheduledAt;
                } else {
                    // If not a challenge, maybe clear it or set it to same
                    match.registrationCloseTime = match.scheduledAt;
                }

                await match.save();
                console.log(`Updated registrationCloseTime to: ${match.registrationCloseTime}`);
            } else {
                console.log('Match not found');
            }
        } catch (err) {
            console.error('Error updating match:', err);
        } finally {
            mongoose.disconnect();
        }
    })
    .catch(err => {
        console.error('Connection error:', err);
    });
