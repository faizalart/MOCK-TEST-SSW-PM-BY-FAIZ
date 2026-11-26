import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const ROOT = process.cwd();
const SCREENSHOT_DIR = path.join(ROOT, 'deliverables/reports/screenshots');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon',
};

class CDPClient {
  constructor(chromeProcess) {
    this.chrome = chromeProcess;
    this.pipeWrite = chromeProcess.stdio[3];
    this.pipeRead = chromeProcess.stdio[4];
    this.msgId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    this.buf = Buffer.alloc(0);

    this.pipeRead.on('data', chunk => {
      this.buf = Buffer.concat([this.buf, chunk]);
      let idx;
      while ((idx = this.buf.indexOf(0)) !== -1) {
        const raw = this.buf.subarray(0, idx).toString('utf8');
        this.buf = this.buf.subarray(idx + 1);
        if (!raw) continue;
        try {
          const msg = JSON.parse(raw);
          if (msg.id && this.pending.has(msg.id)) {
            const { resolve, reject } = this.pending.get(msg.id);
            this.pending.delete(msg.id);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          } else if (msg.method && this.listeners.has(msg.method)) {
            for (const fn of this.listeners.get(msg.method)) fn(msg.params, msg.sessionId);
          }
        } catch (e) {
          console.error('[CDP Parse Error]', e);
        }
      }
    });
  }

  send(method, params = {}, sessionId = undefined) {
    const id = ++this.msgId;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.pipeWrite.write(JSON.stringify(payload) + '\0');
    });
  }

  on(method, callback) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(callback);
  }

  async eval(expression, sessionId) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    }, sessionId);
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception?.description || res.exceptionDetails.text || 'Runtime.evaluate exception';
      throw new Error(desc);
    }
    return res.result ? res.result.value : undefined;
  }
}

function launchChrome(userDataDir) {
  return spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-pipe',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe', 'pipe', 'pipe'] });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function dispatchKey(cdp, sessionId, key, code = '') {
  await cdp.eval(`document.dispatchEvent(new KeyboardEvent('keydown', {
    key: ${JSON.stringify(key)},
    code: ${JSON.stringify(code || key)},
    repeat: false,
    bubbles: true,
    cancelable: true
  }))`, sessionId);
  await delay(50);
}

async function waitForCondition(cdp, sessionId, expr, timeoutMs = 25000, intervalMs = 80) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await cdp.eval(`Boolean(${expr})`, sessionId)) return true;
    await delay(intervalMs);
  }
  throw new Error(`Timeout waiting for condition: ${expr}`);
}

async function main() {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(ROOT, decodeURIComponent(reqPath.replace(/^\/+/, '')));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found: ' + req.url);
    }
  });

  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-10paket-otaff51-'));
  const chromeProcess = launchChrome(userDataDir);
  const cdp = new CDPClient(chromeProcess);

  const consoleErrors = [];
  const consoleWarnings = [];
  const pageExceptions = [];
  const networkFailures = [];

  cdp.on('Runtime.consoleAPICalled', params => {
    const txt = (params.args || []).map(a => a.value || a.description || '').join(' ');
    if (params.type === 'error') consoleErrors.push(txt);
    else if (params.type === 'warning') consoleWarnings.push(txt);
  });
  cdp.on('Runtime.exceptionThrown', params => {
    pageExceptions.push(params.exceptionDetails?.exception?.description || params.exceptionDetails?.text || 'Exception');
  });
  cdp.on('Network.responseReceived', params => {
    if (params.response.status >= 400) {
      networkFailures.push({ url: params.response.url, status: params.response.status });
    }
  });

  const pkgResults = [];

  try {
    await cdp.send('Target.setDiscoverTargets', { discover: true });
    const targetInfo = await new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout finding page target')), 15000);
      try {
        const res = await cdp.send('Target.getTargets');
        const page = (res.targetInfos || []).find(t => t.type === 'page');
        if (page) { clearTimeout(timer); resolve(page); return; }
      } catch {}
      cdp.on('Target.targetCreated', params => {
        if (params.targetInfo?.type === 'page') { clearTimeout(timer); resolve(params.targetInfo); }
      });
    });

    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId: targetInfo.targetId, flatten: true });
    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false }, sessionId);

    console.log(`Navigating to ${baseUrl}/index.html ...`);
    await cdp.send('Page.navigate', { url: `${baseUrl}/index.html` }, sessionId);
    await waitForCondition(cdp, sessionId, 'window.__APP_BOOTED__ === true && window.state && window.state.questions && window.state.questions.length >= 2139', 30000);

    const totalLoaded = await cdp.eval('window.state.questions.length', sessionId);
    const avail = await cdp.eval('window.getAvailablePackages().map(p => ({ id: p.id, name: p.name, total: p.total, active: p.active }))', sessionId);
    const homeText = await cdp.eval('document.body.innerText', sessionId);

    console.log(`✓ App booted with ${totalLoaded} total questions across ${avail.length} packages`);

    // Assert old packages still present
    for (const oldId of ['latsol-nguyen-01', 'latsol-nguyen-10', 'ssw-pm-kunci-ujian-14', 'ssw-pm-kunci-ujian-16', 'pilot-otaff51-01']) {
      const found = avail.find(p => p.id === oldId);
      assert.ok(found && found.active > 0, `Existing package ${oldId} must remain intact`);
    }
    console.log('✓ Legacy packages verified intact alongside new packages');

    // Verify all 10 new packages
    let totalCat1ImgsRendered = 0;
    let totalCat2OptImgsRendered = 0;
    let totalOptionsChecked = 0;
    let totalPromptKotobaDom = 0;
    let totalOptionKotobaDom = 0;
    let totalTangoInDom = 0;
    let q31SpotCheckVerified = false;
    let q02SpotCheckVerified = false;
    const mappingRef = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/kotobaMapping.json'), 'utf8'));

    for (let pNum = 1; pNum <= 10; pNum++) {
      const pad = String(pNum).padStart(2, '0');
      const setId = `latsol-otaff-pm51-${pad}`;
      const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, `data/${setId}.json`), 'utf8'));

      const catEntry = avail.find(p => p.id === setId);
      assert.ok(catEntry, `${setId} must exist in catalog`);
      assert.equal(catEntry.total, 40, `${setId} total must be 40`);
      assert.equal(catEntry.active, 40, `${setId} active must be 40`);
      assert.ok(homeText.includes(`Paket ${pad}`), `Beranda UI must display Paket ${pad}`);

      // --- A. Practice Mode Verification (all 40 questions, images, 3 options, ruby, translation, ALL Kotoba) ---
      await cdp.eval(`
        (async () => {
          for (const s of window.state.sessions) {
            if (s.status === 'in_progress') {
              s.status = 'completed';
              await window.put('sessions', s);
            }
          }
          window.state.activeSession = null;
          window.state.practiceTranslationOpen = false;
          window.state.setup.mode = 'practice';
          window.state.setup.practice = true;
          window.state.setup.setId = ${JSON.stringify(setId)};
          window.state.setup.count = 40;
          window.state.setup.duration = 0;
          window.state.setup.random = false;
          window.state.setup.shuffleQuestions = false;
          window.state.setup.shuffleOptions = false;
          await window.startExam();
        })()
      `, sessionId);
      await waitForCondition(cdp, sessionId, `window.state.page === "exam" && window.state.activeSession?.setId === "${setId}"`);

      // Toggle global translation ON once for the package via KeyY
      await dispatchKey(cdp, sessionId, 'y', 'KeyY');
      await waitForCondition(cdp, sessionId, 'document.querySelectorAll(".practice-question-translation, .practice-option-translation").length > 0', 10000);

      let pkgCat1Count = 0;
      let pkgCat2OptCount = 0;
      let pkgPromptKotobaDom = 0;
      let pkgOptionKotobaDom = 0;
      let screenshotIdx = -1;

      for (let qIdx = 0; qIdx < 40; qIdx++) {
        const expectedQ = pkg.questions[qIdx];
        const hasQImg = Boolean(String(expectedQ.questionImage || '').trim());
        const expectedOptImgs = expectedQ.options.filter(o => String(o.optionImage || '').trim()).length;

        if (screenshotIdx === -1 && (expectedOptImgs > 0 || hasQImg)) {
          screenshotIdx = qIdx;
        }

        await cdp.eval(`window.moveExamTo(${qIdx})`, sessionId);
        await waitForCondition(cdp, sessionId, `window.state.activeSession.currentIndex === ${qIdx}`);

        if (hasQImg) {
          await waitForCondition(cdp, sessionId, '(() => { const img = document.querySelector(".question-display-image"); return Boolean(img && img.complete && img.naturalWidth > 0); })()', 15000);
          pkgCat1Count++;
        }
        if (expectedOptImgs > 0) {
          await waitForCondition(cdp, sessionId, `(() => { const imgs = Array.from(document.querySelectorAll(".answer-image")); return imgs.length === ${expectedOptImgs} && imgs.every(i => i.complete && i.naturalWidth > 0); })()`, 15000);
          const mainImgCnt = await cdp.eval('document.querySelectorAll(".question-display-image").length', sessionId);
          assert.equal(mainImgCnt, 0, `${expectedQ.id} must have 0 duplicate question-display-image`);
          pkgCat2OptCount += expectedOptImgs;
        }

        // Open prompt & all option Kotoba panels for this question
        if (qIdx === screenshotIdx || (screenshotIdx === -1 && qIdx === 30)) {
          await dispatchKey(cdp, sessionId, 'v', 'KeyV');
          await dispatchKey(cdp, sessionId, 'z', 'KeyZ');
        }
        await cdp.eval(`
          (async () => {
            const delayFrame = () => new Promise(r => setTimeout(r, 8));
            for (let pass = 0; pass < 6; pass++) {
              const closed = document.querySelector('[data-action="toggle-selective-kotoba"][aria-expanded="false"]');
              if (!closed) break;
              closed.click();
              await delayFrame();
            }
          })()
        `, sessionId);
        await waitForCondition(cdp, sessionId, 'document.querySelectorAll(".practice-question-kotoba .practice-kotoba-item").length > 0 && document.querySelectorAll(".practice-option-kotoba").length === 3', 10000);

        const domCheck = await cdp.eval(`(() => {
          const choices = Array.from(document.querySelectorAll(".answer-choice"));
          const letters = choices.map(c => c.querySelector(".answer-letter")?.textContent?.trim());
          const hasRuby = document.querySelectorAll(".question-prompt rt, .question-instruction rt, .answer-text rt").length > 0;
          const promptItems = Array.from(document.querySelectorAll(".practice-question-kotoba .practice-kotoba-item")).map(el => el.innerText.trim());
          const optBlocks = Array.from(document.querySelectorAll(".practice-option-kotoba"));
          const optItemsPerChoice = optBlocks.map(b => Array.from(b.querySelectorAll(".practice-kotoba-item")).map(el => el.innerText.trim()));
          const hasPromptTrans = document.querySelectorAll(".practice-question-translation").length > 0;
          const optTransCount = document.querySelectorAll(".practice-option-translation").length;
          return { count: choices.length, letters, hasRuby, promptItems, optItemsPerChoice, hasPromptTrans, optTransCount };
        })()`, sessionId);

        assert.equal(domCheck.count, 3, `${expectedQ.id} rendered ${domCheck.count} choices instead of 3`);
        assert.deepEqual(domCheck.letters, ['A', 'B', 'C'], `${expectedQ.id} letters mismatch`);
        assert.ok(domCheck.hasRuby, `${expectedQ.id} must render <ruby>/<rt>`);
        assert.ok(domCheck.hasPromptTrans, `${expectedQ.id} must render prompt translation`);
        assert.equal(domCheck.optTransCount, 3, `${expectedQ.id} must render 3 option translations`);

        const expectedPromptCount = (mappingRef.questions[expectedQ.id] || []).length;
        assert.equal(domCheck.promptItems.length, expectedPromptCount, `${expectedQ.id} prompt Kotoba DOM count ${domCheck.promptItems.length} !== mapped ${expectedPromptCount}`);
        const optItemCounts = domCheck.optItemsPerChoice.map(arr => arr.length);
        assert.ok(optItemCounts.every(n => n > 0), `${expectedQ.id} has empty option Kotoba: ${JSON.stringify(optItemCounts)}`);

        const allRenderedTexts = [...domCheck.promptItems, ...domCheck.optItemsPerChoice.flat()];
        const tangoHits = allRenderedTexts.filter(txt => txt.includes('たんご'));
        totalTangoInDom += tangoHits.length;
        assert.equal(tangoHits.length, 0, `${expectedQ.id} rendered たんご in DOM: ${tangoHits.join(', ')}`);

        pkgPromptKotobaDom += domCheck.promptItems.length;
        pkgOptionKotobaDom += optItemCounts.reduce((a, b) => a + b, 0);
        totalOptionsChecked += 3;

        if (expectedQ.id === 'otaff-pm51-01-q002') {
          const optAText = domCheck.optItemsPerChoice[0].join(' | ');
          assert.ok(optAText.includes('消費者') && optAText.includes('信用') && optAText.includes('なくす'), `P01 Q02 Opt A DOM missing expected terms: ${optAText}`);
          q02SpotCheckVerified = true;
        }
        if (expectedQ.id === 'otaff-pm51-01-q031') {
          const optAText = domCheck.optItemsPerChoice[0].join(' | ');
          assert.ok(optAText.includes('内側') && optAText.includes('襟') && optAText.includes('ほこり'), `P01 Q31 Opt A DOM missing expected terms: ${optAText}`);
          const ssQ31 = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
          fs.writeFileSync(path.join(SCREENSHOT_DIR, 'otaff-pm51-01-q031-kotoba.png'), Buffer.from(ssQ31.data, 'base64'));
          q31SpotCheckVerified = true;
        }

        if (qIdx === screenshotIdx || (screenshotIdx === -1 && qIdx === 30)) {
          const ss = await cdp.send('Page.captureScreenshot', { format: 'png' }, sessionId);
          fs.writeFileSync(path.join(SCREENSHOT_DIR, `${setId}.png`), Buffer.from(ss.data, 'base64'));
        }
      }

      totalCat1ImgsRendered += pkgCat1Count;
      totalCat2OptImgsRendered += pkgCat2OptCount;
      totalPromptKotobaDom += pkgPromptKotobaDom;
      totalOptionKotobaDom += pkgOptionKotobaDom;

      // --- B. 70-Minute CBT Exam Simulation (all 40 answers -> submit -> verify weights & score = 150) ---
      await cdp.eval(`
        (async () => {
          window.state.activeSession = null;
          window.state.setup.mode = 'exam';
          window.state.setup.practice = false;
          window.state.setup.setId = ${JSON.stringify(setId)};
          window.state.setup.count = 40;
          window.state.setup.duration = 70;
          window.state.setup.random = false;
          window.state.setup.shuffleQuestions = false;
          window.state.setup.shuffleOptions = false;
          await window.startExam();
        })()
      `, sessionId);
      await waitForCondition(cdp, sessionId, `window.state.page === "exam" && window.state.activeSession?.setId === "${setId}" && window.state.activeSession?.mode === "exam"`);

      const sessionCheck = await cdp.eval(`(() => {
        const s = window.state.activeSession;
        const pts1to25 = s.questions.slice(0, 25).every(q => q.points === 3);
        const pts26to40 = s.questions.slice(25, 40).every(q => q.points === 5);
        return { durationMinutes: s.durationMinutes, pts1to25, pts26to40 };
      })()`, sessionId);
      assert.equal(sessionCheck.durationMinutes, 70, `${setId} durationMinutes must be 70`);
      assert.ok(sessionCheck.pts1to25 && sessionCheck.pts26to40, `${setId} weights 1-25=3 / 26-40=5 mismatch`);

      for (let qIdx = 0; qIdx < 40; qIdx++) {
        const expectedQ = pkg.questions[qIdx];
        await cdp.eval(`window.moveExamTo(${qIdx})`, sessionId);
        await cdp.eval(`document.querySelector('.answer-choice[data-index="${expectedQ.correctIndex}"]')?.click()`, sessionId);
      }

      const answeredInSession = await cdp.eval('Object.keys(window.state.activeSession.answers || {}).length', sessionId);
      assert.equal(answeredInSession, 40, `${setId}: expected 40 recorded answers`);

      await cdp.eval('window.finishExam(true)', sessionId);
      await waitForCondition(cdp, sessionId, 'window.state.page === "result"', 15000);
      const resultSummary = await cdp.eval(`(() => {
        const scoreVal = document.querySelector(".pr-score-val")?.innerText || '';
        const correctVal = document.querySelector(".pr-bd-val.is-correct")?.innerText || '';
        const reviewCards = document.querySelectorAll(".zen-review-list > *").length;
        return { scoreVal, correctVal, reviewCards };
      })()`, sessionId);
      assert.ok(resultSummary.scoreVal.includes('150') && resultSummary.scoreVal.includes('100%'), `${setId} scoreVal unexpected: ${resultSummary.scoreVal}`);
      assert.ok(resultSummary.correctVal.includes('40'), `${setId} correctVal unexpected: ${resultSummary.correctVal}`);
      assert.equal(resultSummary.reviewCards, 40, `${setId} expected 40 review items, got ${resultSummary.reviewCards}`);

      pkgResults.push({
        setId,
        status: 'PASS',
        questionsRendered: 40,
        optionsPerQuestion: 3,
        promptKotobaItemsDom: pkgPromptKotobaDom,
        optionKotobaItemsDom: pkgOptionKotobaDom,
        cat1ImagesRendered: pkgCat1Count,
        cat2OptionImagesRendered: pkgCat2OptCount,
        examDurationMinutes: sessionCheck.durationMinutes,
        answeredCount: answeredInSession,
        scoreDisplayed: resultSummary.scoreVal.replace(/\s+/g, ' ').trim(),
        reviewItemsRendered: resultSummary.reviewCards,
        screenshot: `deliverables/reports/screenshots/${setId}.png`,
      });
      console.log(`✓ ${setId}: 40/40 q, 3 opts each, promptKotoba=${pkgPromptKotobaDom}, optKotoba=${pkgOptionKotobaDom}, cat1=${pkgCat1Count}, cat2Opts=${pkgCat2OptCount}, 70m Exam ${resultSummary.scoreVal.replace(/\s+/g, ' ').trim()}, 40 review cards PASS`);
    }

    assert.equal(totalOptionsChecked, 1200, 'Expected 1,200 option elements verified across 400 questions');
    assert.ok(q02SpotCheckVerified, 'P01 Q02 Kotoba spot check not executed');
    assert.ok(q31SpotCheckVerified, 'P01 Q31 Kotoba spot check not executed');
    assert.equal(totalTangoInDom, 0, 'Expected 0 たんご strings rendered in DOM');
    assert.equal(totalCat1ImgsRendered, 41, 'Expected 41 Category 1 question images rendered');
    assert.equal(totalCat2OptImgsRendered, 81, 'Expected 81 Category 2 option images rendered');
    assert.deepEqual(consoleErrors, [], `Console errors detected: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(pageExceptions, [], `Page exceptions detected: ${pageExceptions.join(' | ')}`);
    assert.deepEqual(networkFailures, [], `HTTP >=400 failures detected: ${JSON.stringify(networkFailures)}`);

    const summary = {
      status: 'PASS',
      testedAt: new Date().toISOString(),
      totalLoadedQuestionsInIndexedDB: totalLoaded,
      catalogPackagesCount: avail.length,
      packagesTested: pkgResults.length,
      totalQuestionsVerifiedInDOM: 400,
      totalOptionsVerifiedInDOM: totalOptionsChecked,
      totalPromptKotobaItemsDom: totalPromptKotobaDom,
      totalOptionKotobaItemsDom: totalOptionKotobaDom,
      totalTangoInDom,
      q02SpotCheckVerified,
      q31SpotCheckVerified,
      totalCat1ImagesRendered: totalCat1ImgsRendered,
      totalCat2OptionImagesRendered: totalCat2OptImgsRendered,
      totalImagesRendered: totalCat1ImgsRendered + totalCat2OptImgsRendered,
      consoleErrors,
      consoleWarnings,
      pageExceptions,
      networkFailures,
      packages: pkgResults,
    };
    fs.writeFileSync(path.join(ROOT, 'deliverables/reports/browser-test-results.json'), JSON.stringify(summary, null, 2) + '\n', 'utf8');
    console.log('\nALL 10 PACKAGES (400 QUESTIONS, 1200 OPTIONS, 122 IMAGES, 70m EXAMS) BROWSER TESTS PASSED!');
  } finally {
    try { chromeProcess.kill(); } catch {}
    server.close();
    try { fs.rmSync(userDataDir, { recursive: true, force: true }); } catch {}
  }
}

main();
