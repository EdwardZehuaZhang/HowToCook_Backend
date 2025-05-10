require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const Recipe = require('./src/models/Recipe'); // Add this line to import the model


async function clearDatabase() {
  try {
    await connectDB();
    const Recipe = mongoose.model('Recipe');
    console.log('Clearing recipes from database...');
    await Recipe.deleteMany({});
    console.log('Database cleared! Run the sync process to re-populate.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();