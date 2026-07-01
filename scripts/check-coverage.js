const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const thresholds = {
  lines: 80,
  functions: 80,
  branches: 70,
  statements: 80
};

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    if (key in thresholds) {
      thresholds[key] = parseFloat(value);
    }
  }
});

const summaryPath = path.resolve(__dirname, '../apps/api/coverage/coverage-summary.json');

if (!fs.existsSync(summaryPath)) {
  console.error(`❌ Coverage summary file not found at ${summaryPath}`);
  console.error('Please make sure tests ran with --coverage and --coverageReporters=json-summary');
  process.exit(1);
}

try {
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  const total = summary.total;
  let failed = false;

  console.log('=== Test Coverage Threshold Check ===');
  Object.keys(thresholds).forEach(metric => {
    const threshold = thresholds[metric];
    const pct = total[metric] ? total[metric].pct : 0;
    
    if (pct < threshold) {
      console.error(`❌ ${metric.toUpperCase()}: ${pct}% (Threshold: ${threshold}%) - FAILED`);
      failed = true;
    } else {
      console.log(`✅ ${metric.toUpperCase()}: ${pct}% (Threshold: ${threshold}%) - PASSED`);
    }
  });

  if (failed) {
    console.error('\n❌ Test coverage check failed. Some metrics are below the required threshold.');
    process.exit(1);
  } else {
    console.log('\n✅ All test coverage metrics passed the threshold.');
    process.exit(0);
  }
} catch (error) {
  console.error(`❌ Error parsing coverage summary: ${error.message}`);
  process.exit(1);
}
