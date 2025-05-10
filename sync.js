require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { parseRecipeMarkdown } = require('./src/utils/markdownParser');
const Recipe = require('./src/models/Recipe');

// Repository directory
const repoDir = path.resolve(__dirname, './HowToCook_Repo');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');
    
    console.log('Starting repository sync...');
    
    // Check if repo exists
    try {
      await fs.access(repoDir);
      console.log('Repository exists, pulling latest changes...');
      await exec(`cd "${repoDir}" && git pull`);
    } catch (error) {
      console.log('Repository does not exist, cloning...');
      await exec(`git clone "https://github.com/Anduin2017/HowToCook.git" "${repoDir}"`);
    }
    
    console.log('Processing recipes...');
    const dishesDir = path.join(repoDir, 'dishes');
    await processDirectory(dishesDir);
    
    console.log('All done! Closing connection...');
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

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
    console.error(`Error processing file ${filePath}:`, error.message);
  }
}

main();