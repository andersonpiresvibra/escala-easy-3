const fs = require('fs');
let code = fs.readFileSync('src/app/scale.service.ts', 'utf-8');

code = code.replace(/console\.error\('Error fetching paginated scale rows:', error\);/g, "console.error('Error fetching paginated scale rows:', error?.message || JSON.stringify(error));");
code = code.replace(/console\.error\('Error syncing Supabase:', err\);/g, "console.error('Error syncing Supabase:', err?.message || JSON.stringify(err));");

fs.writeFileSync('src/app/scale.service.ts', code);
