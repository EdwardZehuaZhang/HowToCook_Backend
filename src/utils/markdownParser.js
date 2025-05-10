const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

/**
 * Parse a markdown file to extract recipe data
 * @param {string} filePath Path to the markdown file
 * @returns {Object} Recipe data
 */
async function parseRecipeMarkdown(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    // Get recipe name (first H1 heading)
    const nameRegex = /^# (.+)/;
    const nameMatch = content.match(nameRegex);
    const name = nameMatch ? nameMatch[1] : path.basename(filePath, '.md');

    // Determine category from the file path
    const pathParts = filePath.split(path.sep);
    const categoryIndex = pathParts.indexOf('dishes');
    const category = categoryIndex !== -1 && pathParts.length > categoryIndex + 1 
      ? pathParts[categoryIndex + 1] 
      : '其他';

    // Extract difficulty (look for stars)
    const difficultyRegex = /难度[：:]\s*(\d+)\s*星/;
    const difficultyMatch = content.match(difficultyRegex);
    const difficulty = difficultyMatch ? parseInt(difficultyMatch[1]) : 1;

    // Extract description (usually the first paragraph after the title)
    let description = '';
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() && !lines[i].startsWith('#')) {
        description = lines[i].trim();
        break;
      }
    }

    // Extract materials, calculations, procedure, and extra info
    const materials = extractSection(content, '必备原料和工具');
    const calculations = extractSection(content, '计算');
    const procedure = extractSection(content, '操作');
    const extraInfo = extractSection(content, '附加内容');

    // Generate sourceUrl from GitHub repo path
    const repoBase = 'https://github.com/Anduin2017/HowToCook/blob/master/';
    const relPath = filePath.includes('dishes') 
      ? filePath.substring(filePath.indexOf('dishes')) 
      : filePath;
    const sourceUrl = `${repoBase}${relPath.replace(/\\/g, '/')}`;
    const imageUrl = extractImageUrl(content);


    return {
      name,
      category,
      difficulty,
      description,
      materials,
      calculations,
      procedure,
      extraInfo,
      imageUrl: imageUrl,  // Use the extracted URL
      sourceUrl,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Error parsing markdown file ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract a section from markdown content
 * @param {string} content Markdown content
 * @param {string} sectionName Section name to extract
 * @returns {Array} Lines in the section
 */
function extractSection(content, sectionName) {
  const sectionRegex = new RegExp(`## ${sectionName}([\\s\\S]*?)(?=## |$)`, 'i');
  const match = content.match(sectionRegex);
  
  if (!match) return [];
  
  return match[1]
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

/**
 * Extract image URLs from markdown content
 * @param {string} content Markdown content
 * @returns {string} First image URL found or empty string
 */
function extractImageUrl(content) {
  const imageRegex = /!\[.*?\]\((.*?)\)/;
  const match = content.match(imageRegex);
  
  if (match && match[1]) {
    let imageUrl = match[1];
    
    // Handle relative paths vs absolute URLs
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    } else if (imageUrl.startsWith('./')) {
      // For relative paths, we can't resolve them easily
      // so we'll use a placeholder for now
      return "";
    }
  }
  
  return "";
}



module.exports = {
  parseRecipeMarkdown
};