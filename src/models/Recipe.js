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
    default: null  
  },
  description: {
  type: String,
  default: null  
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
  allImageUrls: {
  type: [String],
  default: []
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

RecipeSchema.index({ name: 1 });
RecipeSchema.index({ materials: 1 });

const Recipe = mongoose.model('Recipe', RecipeSchema);
module.exports = Recipe;