require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { parseRecipeMarkdown } = require('./src/utils/markdownParser');
const Recipe = require('./src/models/Recipe');

async function main() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');
    
    // Repository directory
    const repoDir = path.join(__dirname, 'HowToCook_Repo');

    console.log('Starting repository sync...');
    
    // Check if repository exists
    try {
      const repoStat = await fs.stat(repoDir);
      const gitDirExists = await fs.stat(path.join(repoDir, '.git'))
        .then(() => true)
        .catch(() => false);
      
      if (repoStat.isDirectory() && gitDirExists) {
        console.log('Repository exists, resetting any local changes and pulling latest...');
        // Change to the repository directory and reset + pull changes
        const currentDir = process.cwd();
        process.chdir(repoDir);
        
        try {
          // Force reset any local changes
          await exec('git reset --hard HEAD');
          // Clean untracked files
          await exec('git clean -fd');
          // Now pull latest changes
          await exec('git pull');
        } catch (gitError) {
          console.error('Error during git operations:', gitError);
          throw gitError;
        }
        
        process.chdir(currentDir);
      } else {
        // Delete directory if it exists but isn't a git repository
        if (repoStat.isDirectory()) {
          console.log('Directory exists but not a git repo. Removing...');
          await fs.rm(repoDir, { recursive: true, force: true });
        }
        
        console.log('Repository does not exist, cloning...');
        await exec(`git clone "https://github.com/Anduin2017/HowToCook.git" "${repoDir}"`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Directory doesn't exist at all
        console.log('Repository does not exist, cloning...');
        await exec(`git clone "https://github.com/Anduin2017/HowToCook.git" "${repoDir}"`);
      } else {
        throw error;
      }
    }
    
    // Process the recipe files
    console.log('Processing recipe files...');
    const dishesDir = path.join(repoDir, 'dishes');
    await processDirectory(dishesDir);
    
    console.log('Repository sync completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
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
    console.error(`Error processing file ${filePath}:`, error);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});