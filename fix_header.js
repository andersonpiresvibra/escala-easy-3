const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

code = code.replace(
  'class="flex flex-col xl:flex-row xl:items-center justify-between gap-4 select-none px-6 pt-4 pb-4 border-b border-[#10213b] shadow-xl relative z-[60]"',
  'class="flex flex-row items-center justify-between gap-2 md:gap-4 select-none px-4 md:px-6 py-3 border-b border-[#10213b] shadow-xl relative z-[60]"'
);

fs.writeFileSync('src/app/app.html', code);
