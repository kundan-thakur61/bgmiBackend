require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'name phone email role').sort({ createdAt: -1 }).limit(20);
    console.log('\n--- Existing Users ---');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ${u.name || 'No Name'} | Phone: ${u.phone} | Role: ${u.role} | Email: ${u.email || 'N/A'}`);
    });

    const admin = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    if (admin) {
      console.log(`\nAdmin exists: ${admin.name} (${admin.phone}) - Role: ${admin.role}`);
    } else {
      console.log('\nNo admin found');
    }

    // If a phone number is passed as argument, promote that user
    const phone = process.argv[2];
    if (phone) {
      const user = await User.findOneAndUpdate(
        { phone },
        { role: 'super_admin' },
        { new: true }
      );
      if (user) {
        console.log(`\nSUCCESS: "${user.name}" (${user.phone}) is now super_admin!`);
      } else {
        console.log(`\nNo user found with phone: ${phone}`);
      }
    } else {
      console.log('\nTo promote a user, run: node make-admin.js <phone_number>');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
