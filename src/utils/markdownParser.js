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
    const difficultyRegex = /预估烹饪难度：(★+)/;
    const difficultyMatch = content.match(difficultyRegex);
    const difficulty = difficultyMatch ? difficultyMatch[1].length : null; // Use null for NA

    const imageUrls = extractImageUrls(content, filePath);

    // Extract description (usually the first paragraph after the title)
    let description = '';
    
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('的做法') || lines[i].trim().startsWith('# ')) {
        startIdx = i + 1;
        break;
      }
    }

    // Find end index (difficulty line or next heading)
    let endIdx = lines.length;
    for (let i = startIdx; i < lines.length; i++) {
      if (
        lines[i].includes('预估烹饪难度') || 
        lines[i].includes('必备原料和工具') ||
        lines[i].trim().startsWith('#')
      ) {
        endIdx = i;
        break;
      }
    }

    // Extract all description paragraphs
    if (startIdx >= 0 && startIdx < endIdx) {
      const descriptionParagraphs = [];
      for (let i = startIdx; i < endIdx; i++) {
        const line = lines[i].trim();
        // Skip empty lines and image markdown lines
        if (line !== '' && !line.match(/^!\[.*?\]\(.*?\)/)) {
          descriptionParagraphs.push(line);
        }
      }
      description = descriptionParagraphs.join('\n\n');
    }

    // If no description found, set to null
    if (!description) {
      description = null;
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
    const imageUrl = imageUrls.length > 0 ? imageUrls[0] : "";

    return {
      name,
      category,
      difficulty,
      description,
      materials,
      calculations,
      procedure,
      extraInfo,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : "",
      allImageUrls: imageUrls,
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
 * @param {string} filePath Path to the markdown file
 * @returns {Array} Array of image URLs
 */
function extractImageUrls(content, filePath) {
  // Find all image references using global regex
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = [...content.matchAll(imageRegex)];
  
  // No images found
  if (!matches || matches.length === 0) {
    return [];
  }
  
  // Get GitHub repo base path for the file
  const repoBase = 'https://github.com/Anduin2017/HowToCook/blob/master/';
  const relPath = filePath.includes('dishes') 
    ? filePath.substring(filePath.indexOf('dishes')) 
    : filePath;
  const dirPath = relPath.replace(/\\/g, '/').replace(/\/[^\/]+$/, '/');
  
  // Process each image URL
  return matches.map(match => {
    const imageRelPath = match[1];
    
    // Skip external URLs
    if (imageRelPath.startsWith('http')) {
      return imageRelPath;
    }
    
    // Convert relative paths to GitHub URLs
    if (imageRelPath.startsWith('./')) {
      // Remove "./" prefix for combining with dirPath
      const cleanPath = imageRelPath.substring(2);
      return `${repoBase}${dirPath}${cleanPath}`;
    } else if (imageRelPath.startsWith('/')) {
      // Absolute path from repo root
      return `${repoBase}${imageRelPath.substring(1)}`;
    } else {
      // Path without "./" prefix
      return `${repoBase}${dirPath}${imageRelPath}`;
    }
  }).filter(url => url.length > 0);
}



module.exports = {
  parseRecipeMarkdown
};