const http = require('http');
const https = require('https');

// Parse args
const args = process.argv.slice(2);
let duration = 300; // seconds
let threshold = 0.01; // 1%

args.forEach(arg => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    if (key === 'duration') duration = parseInt(value);
    if (key === 'threshold') threshold = parseFloat(value);
  }
});

const prodUrl = process.env.PRODUCTION_HEALTH_URL || 'https://api.garisale.com/health';
console.log(`Monitoring error rate post-deploy for ${duration}s at ${prodUrl} (threshold: ${threshold * 100}%)`);

const isCi = process.env.GITHUB_ACTIONS === 'true';
const runDuration = isCi ? duration : 5; // run for 5 seconds locally to save developer time
const interval = 10; // check every 10 seconds in CI, or 1s locally
const totalChecks = Math.max(1, Math.floor(runDuration / (isCi ? 10 : 1)));

console.log(`Will perform ${totalChecks} health checks...`);

let checkCount = 0;
let failedChecks = 0;

const client = prodUrl.startsWith('https') ? https : http;

function performCheck() {
  checkCount++;
  console.log(`Checking health (${checkCount}/${totalChecks})...`);
  
  let resolved = false;
  const resolve = (failed) => {
    if (resolved) return;
    resolved = true;
    if (failed) failedChecks++;
    next();
  };
  
  const req = client.get(prodUrl, { timeout: 5000, rejectUnauthorized: false }, (res) => {
    if (res.statusCode < 200 || res.statusCode >= 300) {
      console.warn(`⚠️ Unhealthy response: ${res.statusCode}`);
      resolve(true);
    } else {
      console.log(`✅ Production status: ${res.statusCode}`);
      resolve(false);
    }
  });
  
  req.on('error', (err) => {
    console.warn(`⚠️ Connection error: ${err.message}`);
    resolve(isCi);
  });
  
  req.on('timeout', () => {
    req.destroy();
    console.warn(`⚠️ Timeout during check`);
    resolve(true);
  });
}

function next() {
  if (checkCount < totalChecks) {
    setTimeout(performCheck, isCi ? 10000 : 1000);
  } else {
    const failureRate = failedChecks / totalChecks;
    console.log(`=== Monitoring Complete ===`);
    console.log(`Total checks: ${totalChecks}, Failed: ${failedChecks}, Failure rate: ${(failureRate * 100).toFixed(2)}%`);
    
    if (failureRate > threshold) {
      console.error(`❌ Failure rate exceeds threshold of ${threshold * 100}%! Triggering rollback.`);
      process.exit(1);
    } else {
      console.log(`✅ Error rate monitoring passed. No rollback required.`);
      process.exit(0);
    }
  }
}

console.log(`Waiting 45 seconds for DNS propagation and server boot...`);
setTimeout(performCheck, 45000);
