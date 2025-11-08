const mongoose = require('mongoose');
require('dotenv').config(); // This line ensures 'process.env' has the variables from your .env file

const connectDB = async () => {
  try {
    // Check if the connection string exists to prevent errors
    if (!process.env.DB_CONNECT_STRING) {
      throw new Error('DB_CONNECT_STRING is not defined in the .env file.');
    }

    // Attempt to connect to the database
    await mongoose.connect(process.env.DB_CONNECT_STRING);
    
    console.log('MongoDB connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    // Exit the application with an error code if the database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;