import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d27ebec7-1c6f-4a08-9700-b5f26bb90bdd';
const indexUrl = 'file:///c:/Users/Admin/Documents/GitHub/MOCK-TEST-SSW-PM-BY-FAIZ/index.html';

const profile = path.join(artifactDir, 'scratch', 'chrome-profile-cbt-study-' + Date.now());
fs.mkdirSync(profile, { recursive: true });

const proc = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-sandbox',
  '--allow-file-access-from-files', '--disable-web-security',
  `--user-data-dir=${profile}`, '--remote-debugging-pipe', 'about:blank'
], { stdio: ['ignore', 'ignore', 'pipe', 'pipe', 'pipe'] });

const out = proc.stdio[3], inp = proc.stdio[4];
let buf = '', nextId = 1;
const pending = new Map();

inp.on('data', c => {
  buf += c.toString('utf8');
  let i;
  while ((i = buf.indexOf('\0')) !== -1) {
    const raw = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!raw.trim()) continue;
    const m = JSON.parse(raw);
    if (m.method === 'Runtime.consoleAPICalled') {
      console.log('[BROWSER CONSOLE]', m.params.type, m.params.args.map(a => a.value || a.description).join(' '));
    }
    if (m.method === 'Runtime.exceptionThrown') {
      console.log('[BROWSER EXCEPTION]', m.params.exceptionDetails);
    }
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id); pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    }
  }
});

const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++; pending.set(id, { resolve, reject });
  out.write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0');
});

const killer = setTimeout(() => {
  console.error('TIMEOUT 90s');
  proc.kill();
  process.exit(2);
}, 90000);

async function run() {
  try {
    const { targetInfos } = await send('Target.getTargets');
    const { sessionId } = await send('Target.attachToTarget', {
      targetId: targetInfos.find(t => t.type === 'page').targetId,
      flatten: true
    });

    await send('Runtime.enable', {}, sessionId);
    await send('Network.enable', {}, sessionId);
    await send('Network.setBypassServiceWorker', { bypass: true }, sessionId);
    await send('Network.clearBrowserCache', {}, sessionId);
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false
    }, sessionId);

    const ev = async (expr, label) => {
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }, sessionId);
      if (r.exceptionDetails) {
        throw new Error(`[${label}] ` + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
      }
      return r.result?.value;
    };

    const waitFor = sel => `(async () => {
      for (let i = 0; i < 150; i++) {
        if (document.querySelector(${JSON.stringify(sel)})) return true;
        await new Promise(r => setTimeout(r, 100));
      }
      throw new Error('waitFor timeout: ' + ${JSON.stringify(sel)});
    })()`;

    console.log('1. Navigating to index.html and booting...');
    await send('Page.navigate', { url: indexUrl }, sessionId);
    await ev(waitFor('.home-dashboard'), 'wait-boot-home');
    await new Promise(r => setTimeout(r, 1000));

    console.log('2. Starting CBT Exam...');
    await ev(`document.querySelector('[data-page="setup"]').click()`, 'go-setup');
    await ev(waitFor('#setup-form button[type="submit"]:not([disabled])'), 'wait-setup');
    await ev(`document.querySelector('#setup-form button[type="submit"]').click()`, 'submit-setup');
    await ev(waitFor('.exam-shell .answer-choice'), 'wait-cbt-exam');

    console.log('3. Verifying tool buttons order in bottom bar...');
    const toolButtons = await ev(`Array.from(document.querySelectorAll('.exam-bottom-tools .exam-tool-button')).map(b => ({
      text: b.textContent.trim(),
      action: b.getAttribute('data-action'),
      classes: b.className
    }))`, 'tool-buttons');
    console.log('Tool buttons:', toolButtons);

    const studyIdx = toolButtons.findIndex(b => b.action === 'toggle-study-list');
    const furiIdx = toolButtons.findIndex(b => b.action === 'toggle-furigana-quick');
    console.log('Study button index:', studyIdx, 'Furigana button index:', furiIdx);
    if (furiIdx !== toolButtons.length - 1) {
      throw new Error('Expected furigana button at the far right! Got: ' + furiIdx + ' of ' + toolButtons.length);
    }
    if (studyIdx !== furiIdx - 1) {
      throw new Error('Expected study button immediately before furigana button!');
    }

    console.log('4. Testing icon + click and question map trace line...');
    const btnCount = await ev(`document.querySelectorAll('.study-list-quick-button').length`, 'btn-count');
    console.log('Study quick button count in DOM:', btnCount);

    const initialMapItem1 = await ev(`({
      classes: document.querySelector('.question-map-item[data-index="0"]').className,
      boxShadow: window.getComputedStyle(document.querySelector('.question-map-item[data-index="0"]')).boxShadow,
      initialStudyListLen: window.state.studyList.length
    })`, 'map-item-1-initial');
    console.log('Initial Map Item 1:', initialMapItem1);

    // Click '+' button on question 1
    await ev(`document.querySelector('.study-list-quick-button').click()`, 'click-study-btn');
    await new Promise(r => setTimeout(r, 600));

    const afterStudyMapItem1 = await ev(`({
      btnText: document.querySelector('.study-list-quick-button').textContent.trim(),
      btnIsActive: document.querySelector('.study-list-quick-button').classList.contains('is-active'),
      classes: document.querySelector('.question-map-item[data-index="0"]').className,
      boxShadow: window.getComputedStyle(document.querySelector('.question-map-item[data-index="0"]')).boxShadow,
      studyListLen: window.state.studyList.length,
      checkQ0: window.isQuestionInStudy(window.state.activeSession.questions[0])
    })`, 'after-study-click');
    console.log('After Study Click Map Item 1:', JSON.stringify(afterStudyMapItem1, null, 2));

    if (!afterStudyMapItem1.classes.includes('in-study')) {
      throw new Error('Map item 1 does NOT have in-study class!');
    }

    // Now click Flag on question 1 as well!
    console.log('5. Clicking Flag on question 1 to test BOTH lines...');
    await ev(`document.querySelector('.exam-flag-button').click()`, 'click-flag');
    await new Promise(r => setTimeout(r, 300));

    const bothFlagAndStudy = await ev(`({
      classes: document.querySelector('.question-map-item[data-index="0"]').className,
      boxShadow: window.getComputedStyle(document.querySelector('.question-map-item[data-index="0"]')).boxShadow
    })`, 'both-flag-study');
    console.log('Both Flag and Study Map Item 1:', bothFlagAndStudy);

    if (!bothFlagAndStudy.classes.includes('flagged') || !bothFlagAndStudy.classes.includes('in-study')) {
      throw new Error('Map item 1 should have BOTH flagged and in-study classes!');
    }

    // Take screenshot of CBT with question map and bottom tools
    const ssBoth = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'cbt-question-map-study-line.png'), Buffer.from(ssBoth.data, 'base64'));
    console.log('Saved: cbt-question-map-study-line.png');

    // 6. Navigate to question 2 and check persistence in map
    console.log('DEBUG studyList before next:', await ev('JSON.stringify(state.studyList)', 'debug-list-before'));
    console.log('DEBUG isQuestionInStudy(q0) before next:', await ev('isQuestionInStudy(state.activeSession.questions[0])', 'debug-q0-before'));
    console.log('6. Navigating to question 2 and checking question 1 trace in map...');
    await ev(`document.querySelector('[data-action="exam-next"]').click()`, 'next-q');
    await new Promise(r => setTimeout(r, 500));

    const q1FromQ2 = await ev(`({
      q1Classes: document.querySelector('.question-map-item[data-index="0"]').className,
      q1BoxShadow: window.getComputedStyle(document.querySelector('.question-map-item[data-index="0"]')).boxShadow,
      q2StudyActive: document.querySelector('.study-list-quick-button').classList.contains('is-active')
    })`, 'check-q1-from-q2');
    console.log('Q1 checked while on Q2:', q1FromQ2);
    const matchedRules = await ev(`(() => {
      const el = document.querySelector('.question-map-item[data-index="0"]');
      const sheets = Array.from(document.styleSheets);
      const matched = [];
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.selectorText && el.matches(rule.selectorText) && rule.style.boxShadow) {
              matched.push({ sel: rule.selectorText, shadow: rule.style.boxShadow });
            }
          }
        } catch(e) {}
      }
      return matched;
    })()`, 'matched-rules');
    console.log('MATCHED SHADOW RULES FOR Q1:', matchedRules);
    console.log('DEBUG studyList after next:', await ev('JSON.stringify(state.studyList)', 'debug-list-after'));
    console.log('DEBUG isQuestionInStudy(q0) after next:', await ev('isQuestionInStudy(state.activeSession.questions[0])', 'debug-q0-after'));

    if (!q1FromQ2.q1Classes.includes('in-study') || !q1FromQ2.q1Classes.includes('flagged')) {
      throw new Error('Q1 should retain both in-study and flagged in question map after navigating!');
    }

    // 7. Add question 2 to study list (without flagging)
    console.log('7. Adding question 2 to study list only (without flagging)...');
    await ev(`document.querySelector('.study-list-quick-button').click()`, 'study-q2');
    await new Promise(r => setTimeout(r, 300));

    const q2StudyOnly = await ev(`({
      q2Classes: document.querySelector('.question-map-item[data-index="1"]').className,
      q2BoxShadow: window.getComputedStyle(document.querySelector('.question-map-item[data-index="1"]')).boxShadow
    })`, 'q2-study-only');
    console.log('Q2 study only:', q2StudyOnly);

    if (!q2StudyOnly.q2Classes.includes('in-study') || q2StudyOnly.q2Classes.includes('flagged')) {
      throw new Error('Q2 should have in-study but NOT flagged!');
    }

    // Take screenshot of question 2
    const ssQ2 = await send('Page.captureScreenshot', { format: 'png' }, sessionId);
    fs.writeFileSync(path.join(artifactDir, 'cbt-question-2-study-only.png'), Buffer.from(ssQ2.data, 'base64'));
    console.log('Saved: cbt-question-2-study-only.png');

    console.log('\n=== ALL CBT STUDY LINE & POSITION TESTS PASSED! ===');
    clearTimeout(killer);
    proc.kill();
    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    clearTimeout(killer);
    proc.kill();
    process.exit(1);
  }
}

run();
