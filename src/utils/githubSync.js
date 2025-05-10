const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { parseRecipeMarkdown } = require('./markdownParser');
const Recipe = require('../models/Recipe');

// Repository directory
const repoDir = path.resolve(__dirname, '../../../HowToCook_Repo');

/**
 * Process all markdown files in the repository and update the database
 */
async function processRecipes() {
  console.log('Processing recipes...');
  const dishesDir = path.join(repoDir, 'dishes');
  
  try {
    await processDirectory(dishesDir);
    console.log('All recipes processed successfully');
  } catch (error) {
    console.error('Error processing recipes:', error);
  }
}

/**
 * Process all markdown files in a directory recursively
 * @param {string} dir Directory to process
 */
async function processDirectory(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      await processDirectory(fullPath);
    } else if (entry.name.endsWith('.md')) {
      await processMarkdownFile(fullPath);
    }
  }
}

/**
 * Process a markdown file and update the database
 * @param {string} filePath Path to the markdown file
 */
async function processMarkdownFile(filePath) {
  try {
    const recipeData = await parseRecipeMarkdown(filePath);
    if (!recipeData) return;
    
    // Calculate a unique identifier using the source URL
    const sourceId = recipeData.sourceUrl;
    
    // Try to find an existing recipe with the same source URL
    let recipe = await Recipe.findOne({ sourceUrl: sourceId });
    
    if (recipe) {
      // Update existing recipe
      console.log(`Updating recipe: ${recipeData.name}`);
      Object.assign(recipe, recipeData);
      await recipe.save();
    } else {
      // Create new recipe
      recipe = new Recipe(recipeData);
      await recipe.save();
      console.log(`Added new recipe: ${recipeData.name}`);
    }
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
  }
}

/**
 * Clone the repository if it doesn't exist, or pull updates if it does
 */
async function syncRepository() {
  console.log('Starting repository sync...');
  try {
    // Check if the repository directory exists
    try {
      await fs.access(repoDir);
      
      // Check if it's a git repository by looking for .git directory
      try {
        await fs.access(path.join(repoDir, '.git'));
        // If it exists and is a git repo, pull the latest changes
        console.log('Repository exists, pulling latest changes...');
        await exec(`cd "${repoDir}" && git pull`);
      } catch (error) {
        // Directory exists but is not a git repository
        console.log('Directory exists but is not a git repository, removing and cloning...');
        await fs.rm(repoDir, { recursive: true, force: true });
        console.log('Cloning repository...');
        await exec(`git clone "https://github.com/Anduin2017/HowToCook.git" "${repoDir}"`);
      }
    } catch (error) {
      // If the directory doesn't exist, clone it
      console.log('Repository does not exist, cloning...');
      await exec(`git clone "https://github.com/Anduin2017/HowToCook.git" "${repoDir}"`);
    }
    console.log('Repository synced successfully');
    
    // Process all markdown files
    await processRecipes();
  } catch (error) {
    console.error('Error syncing repository:', error);
  }
}

module.exports = {
  syncRepository,
  processRecipes
};