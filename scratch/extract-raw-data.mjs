import fs from 'fs';

// 1. SSW_Bacteria_Lab.html
console.log('=== 1. SSW_Bacteria_Lab.html ===');
const bacContent = fs.readFileSync('C:\\Users\\Admin\\Downloads\\SSW_Bacteria_Lab.html', 'utf8');
const bacMatch = bacContent.match(/const\s+BANK\s*=\s*(\[[\s\S]*?\n\];)/);
if (bacMatch) {
  try {
    const bank = eval(bacMatch[1]);
    console.log(`BANK items: ${bank.length}`);
    console.log('Sample item 0:', JSON.stringify(bank[0], null, 2));
    if (bank.length > 1) {
      console.log('Sample item 1:', JSON.stringify(bank[1], null, 2));
    }
  } catch (e) {
    console.log('Error evaluating BANK:', e.message);
  }
} else {
  console.log('BANK array match not found');
}

// 2. SSW_Temperature_Lab_Fixed_v2.html
console.log('\n=== 2. SSW_Temperature_Lab_Fixed_v2.html ===');
const tempContent = fs.readFileSync('C:\\Users\\Admin\\Downloads\\SSW_Temperature_Lab_Fixed_v2.html', 'utf8');
const tempMatch = tempContent.match(/const\s+questions\s*=\s*(\[[\s\S]*?\n\];)/);
if (tempMatch) {
  try {
    const questions = eval(tempMatch[1]);
    console.log(`Temperature questions: ${questions.length}`);
    console.log('Sample item 0:', JSON.stringify(questions[0], null, 2));
    if (questions.length > 1) {
      console.log('Sample item 1:', JSON.stringify(questions[1], null, 2));
    }
  } catch (e) {
    console.log('Error evaluating Temperature questions:', e.message);
  }
} else {
  console.log('Temperature questions match not found');
}

// 3. HACCP_SSW_quiz.html
console.log('\n=== 3. HACCP_SSW_quiz.html ===');
const haccpContent = fs.readFileSync('C:\\Users\\Admin\\Downloads\\HACCP_SSW_quiz.html', 'utf8');
const haccpMatch = haccpContent.match(/const\s+questions\s*=\s*(\[[\s\S]*?\n\];)/);
if (haccpMatch) {
  try {
    const questions = eval(haccpMatch[1]);
    console.log(`HACCP questions: ${questions.length}`);
    console.log('Sample item 0:', JSON.stringify(questions[0], null, 2));
    if (questions.length > 1) {
      console.log('Sample item 1:', JSON.stringify(questions[1], null, 2));
    }
  } catch (e) {
    console.log('Error evaluating HACCP questions:', e.message);
  }
} else {
  console.log('HACCP questions match not found');
}

// 4. latihan_alergen_jepang_v2 (1).html
console.log('\n=== 4. latihan_alergen_jepang_v2 (1).html ===');
const algContent = fs.readFileSync('C:\\Users\\Admin\\Downloads\\latihan_alergen_jepang_v2 (1).html', 'utf8');
// Check all array / object declarations in the script
const scriptMatch = algContent.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
if (scriptMatch) {
  const s = scriptMatch[1];
  const foodsMatch = s.match(/const\s+foods\s*=\s*(\[[\s\S]*?\n\];)/);
  if (foodsMatch) {
    try {
      const foods = eval(foodsMatch[1]);
      console.log(`Allergen foods items: ${foods.length}`);
      console.log('Sample food 0:', JSON.stringify(foods[0], null, 2));
    } catch (e) {
      console.log('Error evaluating foods:', e.message);
    }
  }
  // Let's see if there are other data structures or quiz generation logic in allergen html
  console.log('Allergen script snippet (search for quiz):');
  const lines = s.split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('quiz') || l.includes('Deck') || l.includes('question') || l.includes('soal') || l.includes('prompt')) {
      if (idx < 150) console.log(`${idx+1}: ${l.trim().slice(0, 100)}`);
    }
  });
}
