const Recipe = require('../models/Recipe');

// Get all recipes (with pagination)
exports.getAllRecipes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const recipes = await Recipe.find({})
      .select('name category difficulty description imageUrl')
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    
    const total = await Recipe.countDocuments();
    
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: recipes
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get recipe by ID
exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ message: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.searchRecipes = async (req, res) => {
  try {
    const { query, category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let searchQuery = {};
    
    // Add search if query is provided
    if (query) {
      // Just use simple regex search - no need for complex $or with text search
      searchQuery.name = { $regex: query, $options: 'i' };
    }
    
    // Add category filter if provided
    if (category) {
      searchQuery.category = category;
    }

    console.log('Search query:', JSON.stringify(searchQuery));
    
    const recipes = await Recipe.find(searchQuery)
      .select('name category difficulty description imageUrl')
      .skip(skip)
      .limit(limit);
    
    const total = await Recipe.countDocuments(searchQuery);
    
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: recipes
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Recipe.distinct('category');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};