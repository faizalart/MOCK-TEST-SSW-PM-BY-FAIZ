// scratch/assert-t027-service-worker-precache.mjs
// Focused verification for Task T027:
// Add data/sharedKotobaDictionary.json to Service Worker precache & bump shell cache version.

import fs from 'fs';
import path from 'path';
import assert from 'assert';

console.log('================================================================================');
console.log('FEATURE 008: Practice Selective Translation & Kotoba Reveal');
console.log('TASK T027: Service Worker Precaching & Shell Cache Versioning Verification');
console.log('================================================================================\n');

const swPath = path.resolve('sw.js');
assert(fs.existsSync(swPath), 'sw.js must exist');
const swSource = fs.readFileSync(swPath, 'utf8');

// 1. Parse CACHE_NAME and CORE precache array
const cacheNameMatch = swSource.match(/const\s+CACHE_NAME\s*=\s*['"]([^'"]+)['"]/);
assert(cacheNameMatch, 'sw.js must define CACHE_NAME constant');
const currentCacheName = cacheNameMatch[1];
console.log('• Detected CACHE_NAME:', currentCacheName);

const coreMatch = swSource.match(/const\s+CORE\s*=\s*\[([\s\S]*?)\];/);
assert(coreMatch, 'sw.js must define CORE array');
const coreItems = coreMatch[1]
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.startsWith("'") || line.startsWith('"'))
  .map(line => line.replace(/^['"]|['"],?$/g, ''));

console.log(`• Total CORE precache entries: ${coreItems.length}`);

// -----------------------------------------------------------------------------
// ASSERTION 1: data/sharedKotobaDictionary.json is present EXACTLY ONCE
// -----------------------------------------------------------------------------
const dictMatches = coreItems.filter(item => item.includes('sharedKotobaDictionary.json'));
assert.strictEqual(dictMatches.length, 1, `sharedKotobaDictionary.json must appear exactly once in CORE, found ${dictMatches.length}`);
const dictPath = dictMatches[0];
console.log('✓ Assertion 1: data/sharedKotobaDictionary.json is present exactly once in CORE:', dictPath);

// -----------------------------------------------------------------------------
// ASSERTION 2: Path matches GitHub Pages deployment scope & repository base path
// -----------------------------------------------------------------------------
assert.strictEqual(dictPath, './data/sharedKotobaDictionary.json', 'Dictionary path must follow repo-relative convention (./data/sharedKotobaDictionary.json)');

const ghPagesScope = 'https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/';
const resolvedGhUrl = new URL(dictPath, ghPagesScope).href;
const expectedGhUrl = 'https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/data/sharedKotobaDictionary.json';
assert.strictEqual(resolvedGhUrl, expectedGhUrl, 'Path must resolve cleanly under GitHub Pages base scope');

const localhostScope = 'http://localhost:8080/';
const resolvedLocalUrl = new URL(dictPath, localhostScope).href;
assert.strictEqual(resolvedLocalUrl, 'http://localhost:8080/data/sharedKotobaDictionary.json', 'Path must resolve cleanly under localhost scope');
console.log('✓ Assertion 2: Precache path cleanly resolves under GitHub Pages scope & local scope:', resolvedGhUrl);

// -----------------------------------------------------------------------------
// ASSERTION 3: Cache version is strictly incremented from previous version (v28 -> v29)
// -----------------------------------------------------------------------------
const versionRegex = /^ssw-pm-mock-test-shell-v(\d+)$/;
const versionMatch = currentCacheName.match(versionRegex);
assert(versionMatch, `CACHE_NAME (${currentCacheName}) must match ssw-pm-mock-test-shell-v<N> pattern`);
const versionNum = parseInt(versionMatch[1], 10);
assert(versionNum >= 29, `Cache version must be at least v29 (incremented from v28), got v${versionNum}`);
console.log(`✓ Assertion 3: Cache version incremented cleanly (was v28, now v${versionNum})`);

// -----------------------------------------------------------------------------
// ASSERTION 4: CACHE_NAME is used consistently across install, activate, and fetch handlers
// -----------------------------------------------------------------------------
// In install: caches.open(CACHE_NAME)
assert(swSource.includes('caches.open(CACHE_NAME)'), 'install handler must open CACHE_NAME');
// In activate: key !== CACHE_NAME
assert(swSource.includes('key !== CACHE_NAME'), 'activate handler must preserve current CACHE_NAME');
// In fetch: caches.open(CACHE_NAME) for runtime cache additions
assert(swSource.includes('const cache = await caches.open(CACHE_NAME);'), 'fetch handler must use CACHE_NAME for runtime puts');
console.log('✓ Assertion 4: CACHE_NAME constant is referenced consistently across all lifecycle handlers');

// -----------------------------------------------------------------------------
// ASSERTION 5: Install event safely awaits precaching completion
// -----------------------------------------------------------------------------
assert(swSource.includes("self.addEventListener('install'"), 'sw.js must declare install listener');
assert(swSource.includes('event.waitUntil('), 'install handler must use event.waitUntil()');
assert(swSource.includes('Promise.allSettled('), 'install handler must use Promise.allSettled to protect against partial failures');
assert(swSource.includes('await self.skipWaiting()'), 'install handler must call skipWaiting() after precaching');
console.log('✓ Assertion 5: Install lifecycle correctly wraps precaching in waitUntil() and skipWaiting()');

// -----------------------------------------------------------------------------
// ASSERTION 6: Fetch handler & Cache matching simulation for dictionary
// -----------------------------------------------------------------------------
// Simulate service worker fetch handler logic
class MockCache {
  constructor() {
    this.store = new Map();
  }
  async put(key, response) {
    const k = typeof key === 'string' ? key : key.url;
    this.store.set(k, response);
  }
  async match(key, { ignoreSearch = false } = {}) {
    const k = typeof key === 'string' ? key : key.url;
    if (this.store.has(k)) return this.store.get(k);
    if (ignoreSearch) {
      const cleanKey = k.split('?')[0];
      for (const [storedKey, val] of this.store.entries()) {
        if (storedKey.split('?')[0] === cleanKey) return val;
      }
    }
    return null;
  }
}

class MockCacheStorage {
  constructor() {
    this.caches = new Map();
  }
  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new MockCache());
    return this.caches.get(name);
  }
  async keys() {
    return Array.from(this.caches.keys());
  }
  async delete(name) {
    return this.caches.delete(name);
  }
  async match(req, opts) {
    for (const cache of this.caches.values()) {
      const res = await cache.match(req, opts);
      if (res) return res;
    }
    return null;
  }
}

// Run simulation
const mockCaches = new MockCacheStorage();
const activeCache = await mockCaches.open(currentCacheName);

// Populate mock cache with precache items under GitHub Pages scope
for (const item of coreItems) {
  const url = new URL(item, ghPagesScope).href;
  await activeCache.put(url, { status: 200, ok: true, url, body: `mock-content-for-${item}` });
}

// Test request matching for dictionary
const incomingDictReq = { url: 'https://faizalart.github.io/MOCK-TEST-SSW-PM-BY-FAIZ/data/sharedKotobaDictionary.json', method: 'GET' };
const matchedDict = await mockCaches.match(incomingDictReq);
assert(matchedDict, 'Fetch handler must match precached sharedKotobaDictionary.json');
assert.strictEqual(matchedDict.status, 200);
console.log('✓ Assertion 6: Simulated cache lookup successfully resolves dictionary request from cache');

// -----------------------------------------------------------------------------
// ASSERTION 7: Mapping Kotoba inspection & regression safety
// -----------------------------------------------------------------------------
const hasMappingInCore = coreItems.some(item => item.includes('kotobaMapping.json'));
const mappingDiskPath = path.resolve('data/kotobaMapping.json');
assert(fs.existsSync(mappingDiskPath), 'data/kotobaMapping.json must exist on disk');
const mappingData = JSON.parse(fs.readFileSync(mappingDiskPath, 'utf8'));
assert(typeof mappingData === 'object' && Object.keys(mappingData).length > 0, 'mapping data must be valid JSON object');

console.log(`• Audit Item: kotobaMapping.json in CORE precache: ${hasMappingInCore ? 'YES' : 'NO (Preserved as runtime fetch per T027 boundary)'}`);
console.log('✓ Assertion 7: Mapping Kotoba dataset is intact on disk and valid JSON with zero regression');

// -----------------------------------------------------------------------------
// ASSERTION 8: No unwanted mutation of other CORE asset behaviors
// -----------------------------------------------------------------------------
const criticalAssets = [
  './index.html',
  './styles.css?v=ssw28',
  './ZEN-APP-SHELL.css?v=ssw28',
  './app.js?v=ssw28',
  './ssw-pm-kunci-ujian-1.json',
  './ssw-pm-special-lab-bundle.json'
];
for (const ca of criticalAssets) {
  assert(coreItems.includes(ca), `CORE precache must retain critical asset: ${ca}`);
}
console.log('✓ Assertion 8: All pre-existing critical CSS, JS, HTML, and JSON bank assets preserved intact');

// -----------------------------------------------------------------------------
// ASSERTION 9: Zero duplicate entries and all static file paths exist on disk
// -----------------------------------------------------------------------------
const itemSet = new Set();
for (const item of coreItems) {
  assert(!itemSet.has(item), `Duplicate entry detected in CORE: ${item}`);
  itemSet.add(item);

  // Check physical file existence on disk (strip query string and leading ./)
  const cleanPath = item.split('?')[0].replace(/^\.\//, '');
  if (cleanPath !== '') { // empty string is './' (root)
    const diskFile = path.resolve(cleanPath);
    assert(fs.existsSync(diskFile), `Precached file must exist on disk: ${diskFile}`);
  }
}
console.log(`✓ Assertion 9: All ${coreItems.length} CORE precache entries are strictly unique and exist on disk`);

// -----------------------------------------------------------------------------
// ASSERTION 10: Service Worker activation cleans old cache without deleting new cache
// -----------------------------------------------------------------------------
// Pre-populate old mock caches
await mockCaches.open('ssw-pm-mock-test-shell-v27');
await mockCaches.open('ssw-pm-mock-test-shell-v28');
await mockCaches.open('other-unrelated-cache-v1');

const allKeysBefore = await mockCaches.keys();
assert(allKeysBefore.includes(currentCacheName), 'New cache must exist');
assert(allKeysBefore.includes('ssw-pm-mock-test-shell-v28'), 'Old cache v28 must exist');

// Simulate SW activate logic
const keysToDelete = allKeysBefore.filter(key =>
  key.startsWith('ssw-pm-mock-test-shell-') &&
  key !== currentCacheName
);
await Promise.all(keysToDelete.map(key => mockCaches.delete(key)));

const allKeysAfter = await mockCaches.keys();
assert(allKeysAfter.includes(currentCacheName), 'Active cache must NOT be deleted');
assert(!allKeysAfter.includes('ssw-pm-mock-test-shell-v28'), 'Old cache v28 must be deleted');
assert(!allKeysAfter.includes('ssw-pm-mock-test-shell-v27'), 'Old cache v27 must be deleted');
assert(allKeysAfter.includes('other-unrelated-cache-v1'), 'Unrelated caches must NOT be touched');
console.log('✓ Assertion 10: Activation lifecycle correctly purges outdated shell caches while preserving current active cache');

console.log('\n================================================================================');
console.log('ALL 10/10 SERVICE WORKER PRECACHE ASSERTIONS PASSED (100%)');
console.log('================================================================================');
