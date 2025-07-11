const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const RECIPE_PROMPT_TEMPLATE = `
你是一位专业的中式料理专家。请根据用户提供的食材和厨具，生成一份严格按照以下markdown格式的中式菜谱：

严格格式要求（必须完全按照此格式）：
# [菜名]

![菜品图片](./{菜名}.jpg)

{简短描述，1-2句话}

预估烹饪难度：{★ 到 ★★★★★}

## 必备原料和工具

{列出所有需要的食材和工具，每行一个，用 - 开头}

## 计算

每份：

{具体的食材用量，每行一个，用 - 开头，包含具体数字和单位}

## 操作

{详细的烹饪步骤，每步一行，用 - 开头}

## 附加内容

如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。

用户选择的食材和设备：
蔬菜: {vegetables}
肉类: {meats}
主食: {staples}
厨具: {equipment}
模式: {mode}

要求：
1. 必须使用用户选择的食材
2. 适配用户选择的厨具
3. 如果是"严格匹配"模式，只能使用用户选择的食材
4. 如果是"模糊匹配"模式，可以添加1-2种常见调料
5. 如果是"生存模式"，尽量简化步骤和调料
6. 菜名要有创意且符合中式菜谱命名习惯
7. 步骤要详细实用，适合家庭制作
8. 必须严格按照上述markdown格式输出，不要有任何格式偏差
`;

/**
 * Generate recipe using Google Gemini AI
 * @param {Object} selections - User's ingredient and equipment selections
 * @returns {Promise<string>} Generated recipe in markdown format
 */
async function generateRecipe(selections) {
  try {
    // Validate API key
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY environment variable is not set');
    }

    // Prepare the prompt with user selections
    const prompt = RECIPE_PROMPT_TEMPLATE
      .replace('{vegetables}', selections.vegetables?.join(', ') || '无')
      .replace('{meats}', selections.meats?.join(', ') || '无')
      .replace('{staples}', selections.staples?.join(', ') || '无')
      .replace('{equipment}', selections.equipment?.join(', ') || '基本厨具')
      .replace('{mode}', selections.mode?.join(', ') || '模糊匹配');

    console.log('Generating recipe with Gemini AI...');
    console.log('User selections:', selections);

    // Generate content using Gemini
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    console.log('Recipe generated successfully');
    
    return generatedText;
  } catch (error) {
    console.error('AI Generation Error:', error);
    
    // Provide specific error messages
    if (error.message?.includes('API_KEY')) {
      throw new Error('Invalid Google API key. Please check your GOOGLE_API_KEY environment variable.');
    } else if (error.message?.includes('quota')) {
      throw new Error('API quota exceeded. Please try again later.');
    } else if (error.message?.includes('safety')) {
      throw new Error('Content filtered by safety settings. Please try different ingredients.');
    } else {
      throw new Error(`Failed to generate recipe: ${error.message}`);
    }
  }
}

/**
 * Parse generated markdown to extract structured recipe data
 * @param {string} markdown - Generated markdown content
 * @returns {Object} Parsed recipe object
 */
function parseGeneratedRecipe(markdown) {
  try {
    const lines = markdown.split('\n');
    let recipeName = '';
    let description = '';
    let difficulty = 1;
    let materials = [];
    let calculations = [];
    let procedure = [];
    let extraInfo = ['如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。'];
    
    let currentSection = '';
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('# ')) {
        recipeName = trimmedLine.replace('# ', '').trim();
      } else if (trimmedLine.includes('预估烹饪难度：')) {
        const stars = (trimmedLine.match(/★/g) || []);
        difficulty = stars.length > 0 ? stars.length : 1;
      } else if (trimmedLine === '## 必备原料和工具') {
        currentSection = 'materials';
      } else if (trimmedLine === '## 计算') {
        currentSection = 'calculations';
      } else if (trimmedLine === '## 操作') {
        currentSection = 'procedure';
      } else if (trimmedLine === '## 附加内容') {
        currentSection = 'extraInfo';
      } else if (trimmedLine.startsWith('- ') && currentSection) {
        const content = trimmedLine.replace('- ', '').trim();
        if (content) {
          switch (currentSection) {
            case 'materials':
              materials.push({ text: content, level: 0 });
              break;
            case 'calculations':
              calculations.push({ text: content, level: 0 });
              break;
            case 'procedure':
              procedure.push({ text: content, level: 0 });
              break;
            default:
              break;
          }
        }
      } else if (trimmedLine && !trimmedLine.startsWith('#') && !trimmedLine.startsWith('!') && !currentSection && !description) {
        // This might be the description
        if (trimmedLine.length > 10 && !trimmedLine.includes('预估烹饪难度')) {
          description = trimmedLine;
        }
      }
    });
    
    // Fallback values
    if (!recipeName) recipeName = 'AI生成菜谱';
    if (!description) description = '由AI生成的美味菜谱';
    if (materials.length === 0) materials.push({ text: '请参考原料清单', level: 0 });
    if (procedure.length === 0) procedure.push({ text: '请参考制作步骤', level: 0 });
    
    return {
      name: recipeName,
      description,
      difficulty,
      materials,
      calculations,
      procedure,
      extraInfo: extraInfo.map(item => ({ text: item, level: 0 })),
      category: 'AI生成',
      sourceUrl: '#',
      imageUrl: '',
      allImageUrls: []
    };
  } catch (error) {
    console.error('Error parsing generated recipe:', error);
    
    // Return a fallback recipe structure
    return {
      name: 'AI生成菜谱',
      description: '解析失败，请重新生成',
      difficulty: 1,
      materials: [{ text: '解析失败', level: 0 }],
      calculations: [],
      procedure: [{ text: '请重新生成菜谱', level: 0 }],
      extraInfo: [{ text: '如果您遵循本指南的制作流程而发现有问题或可以改进的流程，请提出 Issue 或 Pull request 。', level: 0 }],
      category: 'AI生成',
      sourceUrl: '#',
      imageUrl: '',
      allImageUrls: []
    };
  }
}

module.exports = { 
  generateRecipe, 
  parseGeneratedRecipe 
};
