const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

code = code.replace(
  '<div class="md:hidden w-8 h-8 rounded-md border border-emerald-500/20 bg-slate-800 flex items-center justify-center text-emerald-500 font-bold text-xs overflow-hidden">',
  '<div class="md:hidden w-10 h-10 rounded-md border border-emerald-500/20 bg-slate-800 flex items-center justify-center text-emerald-500 font-bold text-sm overflow-hidden">'
);

fs.writeFileSync('src/app/app.html', code);
