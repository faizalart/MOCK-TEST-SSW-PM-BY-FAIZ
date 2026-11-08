import fs from 'fs';

const FLAG_SVGS = {
  id: `<svg class="lang-flag-svg" viewBox="0 0 24 16" width="22" height="15" aria-hidden="true">
    <rect width="24" height="8" fill="#e70011"/>
    <rect y="8" width="24" height="8" fill="#ffffff"/>
    <rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
  </svg>`,
  en: `<svg class="lang-flag-svg" viewBox="0 0 60 30" width="22" height="15" aria-hidden="true">
    <clipPath id="uk-clip"><path d="M0,0 v30 h60 v-30 z"/></clipPath>
    <clipPath id="uk-diag"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath>
    <g clip-path="url(#uk-clip)">
      <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>
      <path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#uk-diag)" stroke="#c8102e" stroke-width="4"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>
      <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/>
      <rect width="60" height="30" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
    </g>
  </svg>`,
  ja: `<svg class="lang-flag-svg" viewBox="0 0 24 16" width="22" height="15" aria-hidden="true">
    <rect width="24" height="16" fill="#ffffff"/>
    <circle cx="12" cy="8" r="4.8" fill="#bc002d"/>
    <rect width="24" height="16" fill="none" stroke="rgba(0,0,0,0.15)" stroke-width="1"/>
  </svg>`
};

console.log('SVGs generated successfully:');
for (const [k, v] of Object.entries(FLAG_SVGS)) {
  console.log(k, v.length, 'chars');
}
