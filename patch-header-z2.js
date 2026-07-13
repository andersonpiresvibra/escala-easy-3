const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf-8');

code = code.replace(
  'border-b border-[#10213b] shadow-xl relative z-50"',
  'border-b border-[#10213b] shadow-xl relative z-[60]"'
);

fs.writeFileSync('src/app/app.html', code);
