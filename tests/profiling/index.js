/**
 * Script to run the app for 2 minutes with a steady debit of queries
 * Useful for running profilers
 */

/* Init ----------------------------------------------------------------------*/

const crypto = require('crypto');
const redis = require('../../src');
const store = require('ha-store')({
  resolver: require('../integration/utils/dao').getAssets,
  uniqueParams: ['language'],
  cache: { limit: 60000, steps: 5, base: 5000 },
  batch: { tick: 10, limit: 10 },
  retry: { base: 5 },
  store: redis('//0.0.0.0:6379'),
});
const testDuration = 60000;
const requestDelay = 0;
const sampleRange = 2;
let sum = 0;
let completed = 0;
let cacheHits = 0;
let timeouts = 0;
let batches = 0;
const startHeap = process.memoryUsage().heapUsed;

const languages = ['fr', 'en', 'pr', 'it', 'ge'];
const now = Date.now();

store.on('query', () => { batches++; });
store.on('cacheHit', () => { cacheHits++; });

async function hitStore() {
  if (Date.now() - now < testDuration) {
    setTimeout(hitStore, requestDelay);
    let finished = false;
    setTimeout(() => {
      if (finished === false) timeouts++;
    }, 500);
    const id = crypto.randomBytes(sampleRange).toString('hex');
    const language = languages[Math.floor(Math.random()*languages.length)];
    const before = Date.now();
    store.get(id, { language })
      .then((result) => {
        if (!result || result.id !== id || result.language !== language) {
          console.log(`After ${completed} calls, ${result} was returned while requesting ${id} - ${language}`);
          throw new Error('result mismatch');
        }
        sum += (Date.now() - before);
        finished = true;
        completed++;
      })
      .catch((err) => {
        console.error(err);
        process.exit(1)
      });
  }
  else {
    console.log(`${completed} completed requests\n${cacheHits} cache hits\n${JSON.stringify(await store.size())}\n${timeouts} timed out\navg response time ${(sum / completed).toFixed(3)}\n${batches} batches sent\n${(((process.memoryUsage().heapUsed - startHeap) || 0) / 1024).toFixed(2)} Kbytes allocated`)
    process.exit(0);
  }
}
process.on('uncaughtException', console.error)

hitStore();
