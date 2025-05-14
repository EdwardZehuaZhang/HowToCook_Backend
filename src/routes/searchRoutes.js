const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');

// Log all search requests
router.use((req, res, next) => {
  console.log('🔎 Search route accessed:', req.url);
  console.log('🔎 Search query parameters:', req.query);
  next();
});

// Route handler for search
router.get('/', recipeController.searchRecipes);

module.exports = router;
