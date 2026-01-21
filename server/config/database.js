import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Подключение использует строку из .env, которую вы предоставили
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;