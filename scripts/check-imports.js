const fs = require('fs');
const path = require('path');

const SRC_DIR = path.resolve(__dirname, '../apps/api/src');

// Helper to recursively list all files
function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath));
    } else if (filePath.endsWith('.ts') && !filePath.endsWith('.spec.ts') && !filePath.endsWith('.d.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

// Build dependency graph
const graph = {};
const files = getFiles(SRC_DIR);

files.forEach(file => {
  const relativeFile = path.relative(SRC_DIR, file).replace(/\\/g, '/');
  graph[relativeFile] = [];

  const content = fs.readFileSync(file, 'utf8');
  // Simple regex to match relative imports or path-aliased imports
  const importRegex = /import\s+[\s\S]*?\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    let importPath = match[1];
    let resolved = null;

    if (importPath.startsWith('@/')) {
      // Path alias
      resolved = importPath.slice(2);
    } else if (importPath.startsWith('.')) {
      // Relative path
      const fileDir = path.dirname(file);
      const absPath = path.resolve(fileDir, importPath);
      if (absPath.startsWith(SRC_DIR)) {
        resolved = path.relative(SRC_DIR, absPath).replace(/\\/g, '/');
      }
    }

    if (resolved) {
      // Try resolving with common extensions
      const candidates = [
        resolved,
        resolved + '.ts',
        resolved + '/index.ts',
        resolved + '.js',
        resolved + '/index.js'
      ];
      
      for (const cand of candidates) {
        const fullCandPath = path.resolve(SRC_DIR, cand);
        if (fs.existsSync(fullCandPath) && fs.statSync(fullCandPath).isFile()) {
          const relCand = path.relative(SRC_DIR, fullCandPath).replace(/\\/g, '/');
          if (!graph[relativeFile].includes(relCand)) {
            graph[relativeFile].push(relCand);
          }
          break;
        }
      }
    }
  }
});

// Cycle detection using DFS (Three-color coloring algorithm)
// 0 = unvisited, 1 = visiting, 2 = visited
const visited = {};
const pathStack = [];
const cycles = [];

function dfs(node) {
  visited[node] = 1;
  pathStack.push(node);

  const neighbors = graph[node] || [];
  for (const neighbor of neighbors) {
    if (visited[neighbor] === 1) {
      // Cycle detected
      const cycleStartIdx = pathStack.indexOf(neighbor);
      const cycle = pathStack.slice(cycleStartIdx).concat(neighbor);
      cycles.push(cycle);
    } else if (!visited[neighbor]) {
      dfs(neighbor);
    }
  }

  pathStack.pop();
  visited[node] = 2;
}

Object.keys(graph).forEach(node => {
  if (!visited[node]) {
    dfs(node);
  }
});

console.log('=== Circular Dependency Check ===');
if (cycles.length > 0) {
  console.error(`❌ Found ${cycles.length} circular dependencies:`);
  cycles.forEach((cycle, index) => {
    console.error(`\nCycle #${index + 1}:`);
    console.error('  ' + cycle.join(' -> '));
  });
  process.exit(1);
} else {
  console.log('✅ No circular dependencies found across ' + Object.keys(graph).length + ' files.');
  process.exit(0);
}
