const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lms').then(async () => {
  const result = await mongoose.connection.collection('users').deleteMany({
    email: { $in: ['admin@lms.com','sales@lms.com','sanction@lms.com','disburse@lms.com','collection@lms.com','borrower@lms.com'] }
  });
  console.log('Deleted', result.deletedCount, 'old seed users');
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });