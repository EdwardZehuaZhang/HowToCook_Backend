const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// Recipe routes
router.get('/recipes', recipeController.getAllRecipes);
router.get('/recipes/:id', recipeController.getRecipeById);
router.get('/search', recipeController.searchRecipes);
router.get('/categories', recipeController.getCategories);

module.exports = router;