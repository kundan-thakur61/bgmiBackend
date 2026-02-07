require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    // Promote by email
    const email = process.argv[2];
    if (!email) {
      console.log('Usage: node promote-by-email.js <email>');
      process.exit(0);
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role: 'super_admin' },
      { new: true }
    );

    if (user) {
      console.log(`SUCCESS: "${user.name}" (${user.email}) is now super_admin!`);
    } else {
      console.log(`No user found with email: ${email}`);
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
