const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    index: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  difficulty: {
    type: Number,
    default: 1
  },
  description: {
    type: String,
    required: true
  },
  materials: [{
    type: String
  }],
  calculations: [{
    type: String
  }],
  procedure: [{
    type: String
  }],
  extraInfo: [{
    type: String
  }],
  imageUrl: {
    type: String,
    default: ""
  },
  sourceUrl: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Add text search index
RecipeSchema.index({ 
  name: 'text', 
  description: 'text',
  materials: 'text' 
});

const Recipe = mongoose.model('Recipe', RecipeSchema);
module.exports = Recipe;