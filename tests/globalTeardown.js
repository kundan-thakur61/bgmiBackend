const fs = require('fs');
const path = require('path');

module.exports = async () => {
  if (global.__MONGOD__) {
    await global.__MONGOD__.stop();
  }

  // Clean up the config file
  const configPath = path.join(__dirname, 'test-config.json');
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
};
