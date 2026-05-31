import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const rawUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lms';
    if (!rawUri || rawUri.trim() === '') {
      console.error('MONGO_URI is not set. Set the environment variable on Render to your MongoDB connection string.');
      process.exit(1);
    }
    const conn = await mongoose.connect(rawUri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
