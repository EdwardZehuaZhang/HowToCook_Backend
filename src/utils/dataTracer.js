/**
 * Utility to trace data structure and transformation through the application
 */

function traceRecipeStructure(recipe, stage) {
  console.log(`\n=== DATA TRACE [${stage}] ===`);
  
  // Check if recipe exists
  if (!recipe) {
    console.log('Recipe is null or undefined');
    return;
  }
  
  // Log basic info
  console.log(`Recipe: ${recipe.name || 'unnamed'}`);
  
  // Check array fields
  const fields = ['materials', 'calculations', 'procedure', 'extraInfo'];
  fields.forEach(field => {
    const data = recipe[field];
    if (!data) {
      console.log(`${field}: undefined or null`);
    } else if (!Array.isArray(data)) {
      console.log(`${field}: not an array (${typeof data})`);
    } else {
      console.log(`${field}: Array with ${data.length} items`);
      if (data.length > 0) {
        const sample = data[0];
        console.log(`  - First item type: ${typeof sample}`);
        if (typeof sample === 'object') {
          console.log(`  - First item keys: ${Object.keys(sample).join(', ')}`);
          if ('text' in sample) {
            console.log(`  - Sample text: ${sample.text.substring(0, 40)}${sample.text.length > 40 ? '...' : ''}`);
          }
          if ('level' in sample) {
            console.log(`  - Sample level: ${sample.level} (${typeof sample.level})`);
          }
        } else {
          console.log(`  - Sample value: ${String(sample).substring(0, 40)}${String(sample).length > 40 ? '...' : ''}`);
        }
      }
    }
  });
}

module.exports = { traceRecipeStructure };
