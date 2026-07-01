const fs = require('fs');
const path = require('path');

const IGNORED_DIRS = ['node_modules', '.git', 'dist', 'k6-temp', '.agents', 'coverage', '.next', 'blueprint'];
const IGNORED_FILES = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', '.env'];

const SECRET_PATTERNS = [
  { name: 'Private Key Block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'Generic Secret Assignment', regex: /(password|secret|passwd|token|api_key|auth_key|private_key|passphrase)\s*[:=]\s*['"`][a-zA-Z0-9_\-\.\+=]{20,}['"`]/i },
  { name: 'bKash Credentials', regex: /(bkash_app_key|bkash_app_secret|bkash_username|bkash_password)\s*[:=]/i },
  { name: 'Nagad Credentials', regex: /(nagad_merchant_id|nagad_private_key|nagad_public_key)\s*[:=]/i },
  { name: 'Greenweb SMS Token', regex: /(greenweb_token|sms_token)\s*[:=]/i },
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const findings = [];
  SECRET_PATTERNS.forEach(pattern => {
    let match;
    pattern.regex.lastIndex = 0;
    
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (pattern.regex.test(line)) {
        // Exclude environment variable declaration placeholders or mock strings
        if (line.includes('<') && line.includes('>')) return;
        if (line.includes('PLACEHOLDER') || line.includes('placeholder')) return;
        if (line.includes('mock') || line.includes('MOCK') || line.includes('test') || line.includes('TEST')) return;
        
        findings.push({
          pattern: pattern.name,
          lineNumber: idx + 1,
          lineContent: line.trim()
        });
      }
    });
  });
  return findings;
}

function walkDir(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (!IGNORED_DIRS.includes(file)) {
        walkDir(filePath, fileList);
      }
    } else {
      if (!IGNORED_FILES.includes(file)) {
        fileList.push(filePath);
      }
    }
  });
  return fileList;
}

const rootDir = path.resolve(__dirname, '..');
console.log('Starting secret scan in ' + rootDir + '...');
const files = walkDir(rootDir);
let totalFindings = 0;

files.forEach(file => {
  try {
    const findings = scanFile(file);
    if (findings.length > 0) {
      console.log('\nFound secrets in ' + path.relative(rootDir, file) + ':');
      findings.forEach(f => {
        console.log('  Line ' + f.lineNumber + ' [' + f.pattern + ']: ' + f.lineContent);
        totalFindings++;
      });
    }
  } catch (err) {
    // Skip binary or unreadable files
  }
});

console.log('\nScan complete. Total files scanned: ' + files.length + '. Total secrets found: ' + totalFindings + '.');
if (totalFindings > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
