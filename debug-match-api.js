const axios = require('axios');

// Sample valid payload for creating a match
const validPayload = {
  title: "Test Match Tournament",
  description: "This is a test tournament for debugging purposes",
  gameType: "pubg_mobile",  // Options: pubg_mobile, free_fire
  matchType: "tournament",  // Options: match_win, tournament, tdm, wow, special
  mode: "solo",             // Options: solo, duo, squad
  entryFee: 10,
  prizePool: 1000,
  maxSlots: 10,
  minLevelRequired: "bronze", // Options: bronze, silver, gold, platinum, diamond
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  map: "erangel",           // Options: erangel, miramar, sanhok, etc.
  rules: [
    "No hacking or cheating allowed",
    "Players must join 5 minutes before match starts"
  ],
  isFeatured: false
};

async function testCreateMatch() {
  try {
    // You'll need to replace this with your actual auth token
    const authToken = "YOUR_AUTH_TOKEN_HERE"; // Get this from your logged-in session
    
    const response = await axios.post(
      'http://localhost:5000/api/matches',
      validPayload,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Success:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Error Response:');
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      console.log('Headers:', error.response.headers);
    } else if (error.request) {
      console.log('Request Error:', error.request);
    } else {
      console.log('General Error:', error.message);
    }
  }
}

// Check if we have the required environment variables
if (!process.env.NODE_ENV) {
  console.log("Please make sure NODE_ENV is set to 'development' in your .env file");
  console.log("This will provide detailed error messages");
}

console.log('Testing match creation with valid payload...');
testCreateMatch();