const { MongoMemoryServer } = require('mongodb-memory-server');

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
  global.__MONGOD__ = mongod;
  process.env.MONGO_URI = mongod.getUri();
  
  console.log('✅ MongoDB ready!\n');
};
