import fs from 'fs';

let code = fs.readFileSync('app.js', 'utf8');
const oldPattern = /case 'bank-prev-page':[\s\S]*?case 'download-csv-template':/;
const newSnippet = `case 'bank-prev-page': {
      if (state.bankPage > 1) {
        state.bankPage--;
        renderBank();
        const heading = document.getElementById('zen-questions-heading');
        if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }
    case 'bank-next-page': {
      state.bankPage++;
      renderBank();
      const heading = document.getElementById('zen-questions-heading');
      if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
    case 'bank-go-page': {
      const pageNum = Number(el?.dataset?.pageNum || el?.dataset?.id || id);
      if (pageNum && pageNum !== state.bankPage) {
        state.bankPage = pageNum;
        renderBank();
        const heading = document.getElementById('zen-questions-heading');
        if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      break;
    }
    case 'download-csv-template':`;

code = code.replace(oldPattern, newSnippet);
fs.writeFileSync('app.js', code, 'utf8');
console.log('Successfully fixed bank-go-page in app.js!');
