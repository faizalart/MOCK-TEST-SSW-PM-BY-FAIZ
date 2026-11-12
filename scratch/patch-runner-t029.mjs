// scratch/patch-runner-t029.mjs
import fs from 'fs';

const runnerPath = 'scratch/run-feature-008-verification.mjs';
let c = fs.readFileSync(runnerPath, 'utf8');

const oldEnd = `  {
    name: 'Service Worker Precaching & Shell Cache Versioning',
    script: 'scratch/assert-t027-service-worker-precache.mjs',
    task: 'T027',
    category: 'Attribution & Offline'
  }
];`;

const newEnd = `  {
    name: 'Service Worker Precaching & Shell Cache Versioning',
    script: 'scratch/assert-t027-service-worker-precache.mjs',
    task: 'T027',
    category: 'Attribution & Offline'
  },
  {
    name: 'Final Acceptance Criteria Verification (8 Scenarios)',
    script: 'scratch/assert-t029-acceptance-scenarios.mjs',
    task: 'T029',
    category: 'Final Acceptance'
  }
];`;

c = c.replace(oldEnd, newEnd);
fs.writeFileSync(runnerPath, c, 'utf8');
console.log('Runner updated with T029 module');
