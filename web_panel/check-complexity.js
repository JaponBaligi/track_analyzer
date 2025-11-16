const escomplex = require('typhonjs-escomplex');
const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      // Skip test files and type definition files
      if (!file.includes('.test.') && !file.includes('.spec.') && !file.endsWith('.d.ts')) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

function getFunctionName(func) {
  if (func.name && func.name !== '<anon>') {
    return func.name;
  }
  // Try to extract from class or component context
  if (func.class) {
    return `${func.class}.${func.name || 'anonymous'}`;
  }
  return func.name || 'anonymous';
}

function getComplexityLevel(complexity) {
  if (complexity > 20) return { level: 'CRITICAL', emoji: '🔴', threshold: 20 };
  if (complexity > 10) return { level: 'HIGH', emoji: '⚠️', threshold: 10 };
  if (complexity > 5) return { level: 'MEDIUM', emoji: '⚡', threshold: 5 };
  return { level: 'LOW', emoji: '✅', threshold: 0 };
}

function analyzeComplexity() {
  const srcDir = path.join(__dirname, 'src');
  const files = getAllFiles(srcDir);
  
  const fileResults = new Map();
  const allFunctions = [];
  const critical = [];
  const high = [];
  const medium = [];

  files.forEach((filePath) => {
    try {
      const code = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(__dirname, filePath);
      const lines = code.split('\n').length;
      
      // Analyze the file
      const result = escomplex.analyzeModule(code, {
        sourceType: 'module',
        ecmaVersion: 2020
      });

      const fileData = {
        path: relativePath,
        moduleComplexity: result.aggregate?.cyclomatic || 0,
        moduleMaintainability: result.aggregate?.maintainability || 0,
        linesOfCode: lines,
        functionCount: 0,
        functions: []
      };

      // Get function-level complexity
      const functions = result.methods || [];
      
      functions.forEach((func) => {
        const complexity = func.cyclomatic || 0;
        const maintainability = func.maintainability || 0;
        const line = func.line || func.sloc?.start || 'unknown';
        const params = func.params || [];
        const functionName = getFunctionName(func);
        
        const funcData = {
          file: relativePath,
          name: functionName,
          line: line,
          complexity: complexity,
          maintainability: maintainability,
          parameters: params.length,
          lines: func.sloc?.physical || 0
        };

        fileData.functions.push(funcData);
        fileData.functionCount++;
        allFunctions.push(funcData);

        const level = getComplexityLevel(complexity);
        if (complexity > 20) {
          critical.push(funcData);
        } else if (complexity > 10) {
          high.push(funcData);
        } else if (complexity > 5) {
          medium.push(funcData);
        }
      });

      fileResults.set(relativePath, fileData);
    } catch (error) {
      console.error(`Error analyzing ${filePath}:`, error.message);
    }
  });

  // Sort by complexity (highest first)
  allFunctions.sort((a, b) => b.complexity - a.complexity);
  critical.sort((a, b) => b.complexity - a.complexity);
  high.sort((a, b) => b.complexity - a.complexity);
  medium.sort((a, b) => b.complexity - a.complexity);

  // Sort files by module complexity
  const sortedFiles = Array.from(fileResults.values())
    .sort((a, b) => b.moduleComplexity - a.moduleComplexity);

  console.log('\n' + '='.repeat(80));
  console.log('  CYCLOMATIC COMPLEXITY ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');
  console.log(`Total files analyzed: ${files.length}`);
  console.log(`Total functions analyzed: ${allFunctions.length}\n`);

  // Critical issues
  if (critical.length > 0) {
    console.log('🔴 CRITICAL COMPLEXITY (complexity > 20): ' + critical.length);
    console.log('-'.repeat(80));
    critical.forEach((func) => {
      console.log(`  ${func.file}:${func.line}`);
      console.log(`    Function: ${func.name}`);
      console.log(`    Complexity: ${func.complexity} | Params: ${func.parameters} | Lines: ${func.lines}`);
      console.log(`    Maintainability: ${func.maintainability.toFixed(2)}\n`);
    });
  }

  // High complexity
  if (high.length > 0) {
    console.log('⚠️  HIGH COMPLEXITY (complexity > 10): ' + high.length);
    console.log('-'.repeat(80));
    high.forEach((func) => {
      console.log(`  ${func.file}:${func.line}`);
      console.log(`    Function: ${func.name}`);
      console.log(`    Complexity: ${func.complexity} | Params: ${func.parameters} | Lines: ${func.lines}`);
      console.log(`    Maintainability: ${func.maintainability.toFixed(2)}\n`);
    });
  }

  // Medium complexity summary
  if (medium.length > 0) {
    console.log(`⚡ MEDIUM COMPLEXITY (5 < complexity ≤ 10): ${medium.length} functions\n`);
  }

  // Top 10 most complex files
  console.log('\n' + '='.repeat(80));
  console.log('  TOP 10 MOST COMPLEX FILES (by module complexity)');
  console.log('='.repeat(80) + '\n');
  sortedFiles.slice(0, 10).forEach((file, index) => {
    const level = getComplexityLevel(file.moduleComplexity);
    console.log(`${index + 1}. ${level.emoji} ${file.path}`);
    console.log(`   Module Complexity: ${file.moduleComplexity} | Functions: ${file.functionCount} | LOC: ${file.linesOfCode}`);
    console.log(`   Maintainability: ${file.moduleMaintainability.toFixed(2)}`);
    
    // Show top 3 functions in this file
    const topFunctions = file.functions
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 3);
    if (topFunctions.length > 0) {
      console.log(`   Top functions:`);
      topFunctions.forEach(f => {
        const funcLevel = getComplexityLevel(f.complexity);
        console.log(`     ${funcLevel.emoji} ${f.name} (line ${f.line}): complexity ${f.complexity}`);
      });
    }
    console.log('');
  });

  // Summary statistics
  const complexities = allFunctions.map(r => r.complexity).filter(c => c > 0);
  if (complexities.length > 0) {
    const avg = complexities.reduce((a, b) => a + b, 0) / complexities.length;
    const max = Math.max(...complexities);
    const min = Math.min(...complexities);
    const median = complexities.sort((a, b) => a - b)[Math.floor(complexities.length / 2)];
    
    console.log('='.repeat(80));
    console.log('  SUMMARY STATISTICS');
    console.log('='.repeat(80) + '\n');
    console.log(`Complexity Distribution:`);
    console.log(`  🔴 Critical (>20):  ${critical.length}`);
    console.log(`  ⚠️  High (10-20):    ${high.length}`);
    console.log(`  ⚡ Medium (5-10):    ${medium.length}`);
    console.log(`  ✅ Low (≤5):         ${allFunctions.length - critical.length - high.length - medium.length}`);
    console.log(`\nComplexity Metrics:`);
    console.log(`  Average:  ${avg.toFixed(2)}`);
    console.log(`  Median:   ${median.toFixed(2)}`);
    console.log(`  Maximum:  ${max}`);
    console.log(`  Minimum:  ${min}`);
    
    // File-level stats
    const fileComplexities = sortedFiles.map(f => f.moduleComplexity).filter(c => c > 0);
    if (fileComplexities.length > 0) {
      const avgFile = fileComplexities.reduce((a, b) => a + b, 0) / fileComplexities.length;
      const maxFile = Math.max(...fileComplexities);
      console.log(`\nFile-level Metrics:`);
      console.log(`  Average module complexity: ${avgFile.toFixed(2)}`);
      console.log(`  Maximum module complexity: ${maxFile} (${sortedFiles[0].path})`);
    }
  }

  console.log('\n' + '='.repeat(80) + '\n');
}

analyzeComplexity();

