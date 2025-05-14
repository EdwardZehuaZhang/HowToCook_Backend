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
  console.log('🔍 Search endpoint hit with request:', req.url);
  console.log('🔍 Search query params:', req.query);
  
  try {
    const { query, category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    console.log(`🔍 Processing search: query="${query}", category="${category}", page=${page}, limit=${limit}`);
    
    let searchQuery = {};
    
    // Add search if query is provided
    if (query) {
      // ONLY search in name field with case-insensitive regex
      searchQuery.name = { $regex: query, $options: 'i' };
      console.log(`🔍 Search query for '${query}' using:`, JSON.stringify(searchQuery));
    }
    
    // Add category filter if provided
    if (category) {
      searchQuery.category = category;
    }

    console.log('🔍 Full search query:', JSON.stringify(searchQuery));
    
    // Execute the search
    console.log('🔍 Executing MongoDB find with query...');
    const recipes = await Recipe.find(searchQuery)
      .select('name category difficulty description imageUrl')
      .skip(skip)
      .limit(limit);
    
    console.log(`✅ Search complete: Found ${recipes.length} results for '${query}'`);
    if (recipes.length > 0) {
      console.log('✅ Recipe names found:', recipes.map(r => r.name).join(', '));
    } else {
      console.log('❌ No recipes found');
    }
    
    const total = await Recipe.countDocuments(searchQuery);
    
    console.log(`🔍 Returning ${recipes.length} results, total: ${total}`);
    
    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: recipes
    });
    console.log('✅ Response sent successfully');
  } catch (error) {
    console.error('❌ Search error:', error);
    console.error('❌ Error stack:', error.stack);
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