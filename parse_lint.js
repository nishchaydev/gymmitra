const fs = require('fs');
const data = JSON.parse(fs.readFileSync('lint-errors.json', 'utf8'));
data.forEach(f => {
  const errs = f.messages.filter(m => m.severity === 2);
  if (errs.length > 0) {
    console.log('\n--- ' + f.filePath + ' ---');
    errs.forEach(m => console.log(`[Line ${m.line}] ${m.ruleId}: ${m.message}`));
  }
});
