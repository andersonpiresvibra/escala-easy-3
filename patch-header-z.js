const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf-8');

code = code.replace(/<header class="(.*?) relative z-50"(.*?)>/, "<header class=\"$1 relative z-[60]\"$2>");

fs.writeFileSync('src/app/app.html', code);
