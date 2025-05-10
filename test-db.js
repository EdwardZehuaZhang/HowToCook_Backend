require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Trying to connect with URI:', process.env.MONGO_URI);
    
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connection successful!');
    
    await mongoose.connection.close();
    console.log('Connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to connect:', error.message);
    process.exit(1);
  }
}

testConnection();