import { SEED_SSW_TIPE_2 } from '../seed-data.js';

const withImages = SEED_SSW_TIPE_2.questions
  .map((q, i) => ({ no: i + 1, hasImage: Boolean(q.image), prompt: q.prompt.slice(0, 40), optCount: q.options?.length }))
  .filter(x => x.hasImage);

console.log('Questions with images in Tipe 2:', withImages.slice(0, 10));
