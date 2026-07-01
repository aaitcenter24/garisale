const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const MIGRATIONS_DIR = path.resolve(__dirname, '../apps/api/prisma/migrations');

// Regex rules for unsafe operations
const RULES = [
  {
    name: 'DROP TABLE',
    regex: /\bDROP\s+TABLE\b/i,
    severity: 'FAIL',
    message: 'Data loss: dropping tables is not allowed in zero-downtime migrations.'
  },
  {
    name: 'DROP COLUMN',
    regex: /\bDROP\s+COLUMN\b/i,
    severity: 'FAIL',
    message: 'Data loss: dropping columns is not allowed. Remove code references first, then drop in a separate step.'
  },
  {
    name: 'ALTER COLUMN TYPE',
    regex: /\bALTER\s+TABLE\s+(\w+)\s+ALTER\s+COLUMN\s+(\w+)\s+TYPE\b/i,
    severity: 'FAIL',
    message: 'Incompatibility: altering column types can break older application instances running concurrently. Use column widening or add a new column instead.'
  },
  {
    name: 'RENAME COLUMN/TABLE',
    regex: /\bRENAME\s+(COLUMN|TABLE|TO)\b/i,
    severity: 'FAIL',
    message: 'Incompatibility: renaming columns or tables breaks older instances. Use add column, copy data, transition code, drop old column instead.'
  },
  {
    name: 'NOT NULL WITHOUT DEFAULT',
    regex: /(\bADD\s+COLUMN\b.*\bNOT\s+NULL\b(?!.*\bDEFAULT\b))|(\bSET\s+NOT\s+NULL\b)/i,
    severity: 'FAIL',
    message: 'Incompatibility: adding a NOT NULL column without a DEFAULT value, or setting an existing column to NOT NULL, breaks database writes from older instances.'
  },
  {
    name: 'CREATE INDEX WITHOUT CONCURRENTLY',
    regex: /\bCREATE\s+(UNIQUE\s+)?INDEX\b(?!.*\bCONCURRENTLY\b)/i,
    severity: 'WARN',
    message: 'Table lock: creating an index without CONCURRENTLY locks the table during creation. Consider using CREATE INDEX CONCURRENTLY.'
  }
];

function getChangedMigrationFiles() {
  const sqlFiles = [];
  try {
    const diffOutput = execSync('git diff --name-only origin/staging...HEAD || git diff --name-only origin/main...HEAD || git diff --name-only HEAD', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const files = diffOutput.split('\n').map(f => f.trim()).filter(Boolean);
    files.forEach(f => {
      if (f.endsWith('.sql') && f.includes('prisma/migrations')) {
        sqlFiles.push(path.resolve(__dirname, '..', f));
      }
    });
  } catch (e) {
    // Ignore git errors
  }

  // Fallback: If no files found from git, check the latest migration directory chronologically
  if (sqlFiles.length === 0 && fs.existsSync(MIGRATIONS_DIR)) {
    const dirs = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => fs.statSync(path.join(MIGRATIONS_DIR, f)).isDirectory())
      .sort(); // Alphabetic sort matches chronological due to timestamp prefix
    
    if (dirs.length > 0) {
      const latestDir = dirs[dirs.length - 1];
      const sqlPath = path.join(MIGRATIONS_DIR, latestDir, 'migration.sql');
      if (fs.existsSync(sqlPath)) {
        sqlFiles.push(sqlPath);
      }
    }
  }

  return sqlFiles;
}

const filesToScan = getChangedMigrationFiles();
console.log('Found ' + filesToScan.length + ' migration file(s) to check.');

let failed = false;

filesToScan.forEach(filePath => {
  console.log('\nScanning: ' + path.relative(path.resolve(__dirname, '..'), filePath));
  const content = fs.readFileSync(filePath, 'utf8');
  
  RULES.forEach(rule => {
    rule.regex.lastIndex = 0;
    if (rule.regex.test(content)) {
      console.log('  [' + rule.severity + '] ' + rule.name + ': ' + rule.message);
      if (rule.severity === 'FAIL') {
        failed = true;
      }
    }
  });
});

if (failed) {
  console.log('\n❌ Migration safety check failed. Please resolve the unsafe operations above.');
  process.exit(1);
} else {
  console.log('\n✅ Migration safety check passed.');
  process.exit(0);
}
