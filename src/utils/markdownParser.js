const fs = require('fs').promises;
const path = require('path');
const MarkdownIt = require('markdown-it');
const md = new MarkdownIt();

/**
 * @param {string} filePath 
 * @returns {Object} 
 */
async function parseRecipeMarkdown(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    const nameRegex = /^# (.+)/;
    const nameMatch = content.match(nameRegex);
    let name = nameMatch ? nameMatch[1] : path.basename(filePath, '.md');
    
    // Remove "的做法" from the recipe name if present
    name = name.replace(/的做法$/, '');

    const pathParts = filePath.split(path.sep);
    const categoryIndex = pathParts.indexOf('dishes');
    const category = categoryIndex !== -1 && pathParts.length > categoryIndex + 1 
      ? pathParts[categoryIndex + 1] 
      : '其他';

    const difficultyRegex = /预估烹饪难度：(★+)/;
    const difficultyMatch = content.match(difficultyRegex);
    const difficulty = difficultyMatch ? difficultyMatch[1].length : null; 

    const imageUrls = extractImageUrls(content, filePath);

    let description = '';
    
    let startIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('的做法') || lines[i].trim().startsWith('# ')) {
        startIdx = i + 1;
        break;
      }
    }

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

    if (startIdx >= 0 && startIdx < endIdx) {
      const descriptionParagraphs = [];
      for (let i = startIdx; i < endIdx; i++) {
        const line = lines[i].trim();
        if (line !== '' && !line.match(/^!\[.*?\]\(.*?\)/)) {
          descriptionParagraphs.push(line);
        }
      }
      description = descriptionParagraphs.join('\n\n');
    }

    if (!description) {
      description = null;
    }

    const materials = extractSection(content, '必备原料和工具');
    const calculations = extractSection(content, '计算');
    const procedure = extractSection(content, '操作');
    const extraInfo = extractSection(content, '附加内容');

    const githubBase = 'https://github.com/Anduin2017/HowToCook/blob/master/';
    const relPath = filePath.includes('dishes') 
      ? filePath.substring(filePath.indexOf('dishes')) 
      : filePath;
    const sourceUrl = `${githubBase}${relPath.replace(/\\/g, '/')}`;
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
 * @param {string} content 
 * @param {string} sectionName 
 * @returns {Array} 
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
 * @param {string} content 
 * @param {string} filePath 
 * @returns {Array} 
 */
function extractImageUrls(content, filePath) {
  const imageRegex = /!\[.*?\]\((.*?)\)/g;
  const matches = [...content.matchAll(imageRegex)];
  
  if (!matches || matches.length === 0) {
    return [];
  }
  
  const githubBase = 'https://github.com/Anduin2017/HowToCook/blob/master/';
  const mediaBase = 'https://media.githubusercontent.com/media/Anduin2017/HowToCook/master/';
  
  const relPath = filePath.includes('dishes') 
    ? filePath.substring(filePath.indexOf('dishes')) 
    : filePath;
  const dirPath = relPath.replace(/\\/g, '/').replace(/\/[^\/]+$/, '/');
  
  return matches.map(match => {
    const imageRelPath = match[1];
    
    if (imageRelPath.startsWith('http')) {
      return imageRelPath;
    }
    
    let fullPath = '';
    if (imageRelPath.startsWith('./')) {
      // Handle relative path with ./
      const cleanPath = imageRelPath.substring(2);
      fullPath = `${dirPath}${cleanPath}`;
    } else if (imageRelPath.startsWith('/')) {
      // Handle absolute path from repo root
      fullPath = imageRelPath.substring(1);
    } else {
      // Handle relative path without ./
      fullPath = `${dirPath}${imageRelPath}`;
    }
    
    return `${mediaBase}${fullPath}`;
  }).filter(url => url.length > 0);
}



module.exports = {
  parseRecipeMarkdown
};