import fs from 'fs';
import path from 'path';

export function runGovernanceCheck() {
  const root = process.cwd();
  const swPath = path.join(root, 'sw.js');
  const indexPath = path.join(root, 'index.html');
  const appPath = path.join(root, 'app.js');

  const swContent = fs.readFileSync(swPath, 'utf8');
  const indexContent = fs.readFileSync(indexPath, 'utf8');
  const appContent = fs.readFileSync(appPath, 'utf8');

  const results = {
    passed: true,
    errors: [],
    details: []
  };

  function assert(condition, message, errorDetail) {
    if (condition) {
      results.details.push({ status: 'PASS', message });
      console.log(`[PASS] ${message}`);
    } else {
      results.passed = false;
      results.errors.push(errorDetail || message);
      results.details.push({ status: 'FAIL', message: errorDetail || message });
      console.error(`[FAIL] ${errorDetail || message}`);
    }
  }

  // Invariant 1: Extract active shell version from sw.js
  const swMatch = swContent.match(/const\s+CACHE_NAME\s*=\s*['"]ssw-pm-mock-test-shell-v(\d+)['"]/);
  if (!swMatch) {
    assert(false, 'Extract active shell version from sw.js', 'Cannot extract active CACHE_NAME from sw.js');
    return results;
  }
  const activeVersion = swMatch[1];
  assert(true, `Active shell version extracted from sw.js: v${activeVersion}`);

  // Invariant 2: Validate app.js SW registration query
  const regMatch = appContent.match(/navigator\.serviceWorker\.register\(['"]\.\/sw\.js\?v=ssw(\d+)['"]\)/);
  const regVersion = regMatch ? regMatch[1] : null;
  assert(
    regVersion === activeVersion,
    `app.js registers ./sw.js?v=ssw${activeVersion}`,
    `app.js SW registration query (v=${regVersion || 'none'}) does not match active shell version v${activeVersion}`
  );

  // Invariant 3: Validate index.html contains ZERO caches.delete or hardcoded version exceptions
  const hasIndexCachesDelete = /caches\.delete/.test(indexContent);
  assert(
    !hasIndexCachesDelete,
    'index.html contains zero caches.delete() calls',
    'index.html contains unauthorized caches.delete() calls'
  );

  const hasIndexShellRef = /ssw-pm-mock-test-shell-/.test(indexContent);
  assert(
    !hasIndexShellRef,
    'index.html contains zero hardcoded ssw-pm-mock-test-shell- references',
    'index.html contains hardcoded ssw-pm-mock-test-shell- references or exception checks'
  );

  // Invariant 4: Validate sw.js activate handler is dynamically prefix-gated
  const normalizedSw = swContent.replace(/\r\n/g, '\n');
  const hasDynamicActivate = normalizedSw.includes("key.startsWith('ssw-pm-mock-test-shell-') &&\n          key !== CACHE_NAME") ||
                             normalizedSw.includes("key.startsWith('ssw-pm-mock-test-shell-') && key !== CACHE_NAME") ||
                             /key\.startsWith\(['"]ssw-pm-mock-test-shell-['"]\)\s*&&\s*key\s*!==\s*CACHE_NAME/.test(normalizedSw);
  assert(
    hasDynamicActivate,
    'sw.js activate handler dynamically evicts obsolete shell caches (key !== CACHE_NAME)',
    'sw.js activate handler does not contain dynamic prefix gating'
  );

  // Invariant 5: Validate shell assets in index.html match activeVersion query
  const shellStylesheets = ['styles.css', 'QUESTION-EDITOR-UPDATES.css', 'ZEN-APP-SHELL.css', 'HOME-DASHBOARD.css', 'ZEN-PAGES.css'];
  for (const sheet of shellStylesheets) {
    const sheetRegex = new RegExp(`${sheet}\\?v=ssw(\\d+)`);
    const sheetMatch = indexContent.match(sheetRegex);
    const sheetVersion = sheetMatch ? sheetMatch[1] : null;
    assert(
      sheetVersion === activeVersion,
      `index.html references ${sheet}?v=ssw${activeVersion}`,
      `index.html references ${sheet} with version ${sheetVersion || 'none'}, expected ssw${activeVersion}`
    );
  }

  const appScriptMatch = indexContent.match(/app\.js\?v=ssw(\d+)/);
  const appScriptVersion = appScriptMatch ? appScriptMatch[1] : null;
  assert(
    appScriptVersion === activeVersion,
    `index.html loads app.js?v=ssw${activeVersion}`,
    `index.html loads app.js with version ${appScriptVersion || 'none'}, expected ssw${activeVersion}`
  );

  return results;
}

if (process.argv[1] && process.argv[1].endsWith('verify-cache-governance.js')) {
  const result = runGovernanceCheck();
  if (!result.passed) {
    process.exit(1);
  }
}
