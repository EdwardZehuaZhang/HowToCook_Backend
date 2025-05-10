require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./src/config/database');
const Recipe = require('./src/models/Recipe'); // Add this line to import the model

async function rebuildIndex() {
  try {
    await connectDB();
    console.log('Rebuilding text index...');
    await Recipe.collection.dropIndexes();
    await Recipe.syncIndexes();
    console.log('Text index rebuilt successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error rebuilding index:', error);
    process.exit(1);
  }
}

rebuildIndex();