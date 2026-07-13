const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

// Fix flex-wrap in utilities row
code = code.replace(
  '<div class="flex flex-wrap items-center gap-2.5 justify-end">',
  '<div class="flex flex-nowrap items-center gap-1 md:gap-2.5 justify-end">'
);

// Apply bg-white to the specific widget
code = code.replace(
  '<div class="p-4 bg-[#071426]/60 border border-[#10213b] rounded-xl flex flex-col space-y-4 transition-all duration-300 shadow-xl"',
  '<div class="p-4 bg-white border border-[#10213b] rounded-xl flex flex-col space-y-4 transition-all duration-300 shadow-xl"'
);

// We should also change text colors inside it if it's now white, otherwise text won't be readable.
// But let's first apply what they asked. The user might have a light theme or wants it white explicitly.

fs.writeFileSync('src/app/app.html', code);
