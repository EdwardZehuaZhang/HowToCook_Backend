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
    text: { type: String },
    level: { type: Number, default: 0 }
  }],
  calculations: [{
    text: { type: String },
    level: { type: Number, default: 0 }
  }],
  procedure: [{
    text: { type: String },
    level: { type: Number, default: 0 }
  }],
  extraInfo: [{
    text: { type: String },
    level: { type: Number, default: 0 }
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

// Update text search index to search in the text field of hierarchical structures
RecipeSchema.index({ 
  name: 'text', 
  description: 'text',
  'materials.text': 'text' 
});

RecipeSchema.index({ 'materials.text': 1 });

// Add a method to ensure all recipe data fields are present
RecipeSchema.statics.normalizeRecipe = function(recipe) {
  if (!recipe) return null;
  
  // Convert to a plain object if it's a Mongoose document
  const recipeObj = recipe.toObject ? recipe.toObject() : recipe;
  
  // Ensure all array fields exist, even if empty
  return {
    ...recipeObj,
    materials: Array.isArray(recipeObj.materials) ? recipeObj.materials : [],
    procedure: Array.isArray(recipeObj.procedure) ? recipeObj.procedure : [],
    calculations: Array.isArray(recipeObj.calculations) ? recipeObj.calculations : [],
    extraInfo: Array.isArray(recipeObj.extraInfo) ? recipeObj.extraInfo : []
  };
};

const Recipe = mongoose.model('Recipe', RecipeSchema);
module.exports = Recipe;