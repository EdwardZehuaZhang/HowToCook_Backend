const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe'); // Adjust path if your model is located elsewhere

/**
 * @route GET /api/recipes
 * @desc Get paginated recipes
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const total = await Recipe.countDocuments();
    const recipes = await Recipe.find()
      .skip(skip)
      .limit(limit)
      .sort({ name: 1 });
    
    const totalPages = Math.ceil(total / limit);
    
    return res.json({
      data: recipes,
      total,
      page,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/recipes/:id
 * @desc Get recipe by ID
 * @access Public
 */
router.get('/:id', async (req, res) => {
  try {
    console.log(`Looking up recipe with ID: ${req.params.id}`);
    // Explicitly select all fields to ensure nested arrays are included
    const recipe = await Recipe.findById(req.params.id).lean();
    
    if (!recipe) {
      console.log(`Recipe with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Recipe not found' });
    }
    
    // Use the normalizeRecipe method to ensure consistent structure
    const normalizedRecipe = Recipe.normalizeRecipe(recipe);
    
    console.log('Recipe found, checking arrays:', {
      hasMaterials: Array.isArray(normalizedRecipe.materials) && normalizedRecipe.materials.length,
      hasProcedure: Array.isArray(normalizedRecipe.procedure) && normalizedRecipe.procedure.length,
      materialsSample: normalizedRecipe.materials?.slice(0, 2)
    });
    
    return res.json(normalizedRecipe);
  } catch (error) {
    console.error(`Error fetching recipe ${req.params.id}:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;