const { MongoMemoryServer } = require('mongodb-memory-server');
const fs = require('fs');
const path = require('path');

module.exports = async () => {
  // This ensures MongoDB binary is downloaded before tests start
  console.log('\n🔧 Setting up MongoDB for tests...');

  const mongod = await MongoMemoryServer.create({
    binary: {
      version: '6.0.12',
      checkMD5: false
    }
  });

  // Store the URI for later use
  const uri = mongod.getUri();
  global.__MONGOD__ = mongod;
  process.env.MONGO_URI = uri;

  // Write the config to a file that can be read by individual test environments
  // This is necessary because global setup runs in a different process than the test environments
  const configPath = path.join(__dirname, 'test-config.json');
  fs.writeFileSync(configPath, JSON.stringify({ mongoUri: uri }));

  console.log('✅ MongoDB ready!\n');
};
