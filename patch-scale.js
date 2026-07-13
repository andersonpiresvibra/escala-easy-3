const fs = require('fs');
let code = fs.readFileSync('src/app/scale.service.ts', 'utf-8');

code = code.replace(/const stored = localStorage\.getItem\('supabase_url'\);/g, "const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_url') : null;");
code = code.replace(/localStorage\.setItem\('supabase_url'/g, "if (typeof localStorage !== 'undefined') localStorage.setItem('supabase_url'");
code = code.replace(/const windowUrl = \(window as any\)\['SUPABASE_URL'\] \|\| \(window as any\)\['env'\]\?\.\['SUPABASE_URL'\];/g, "const windowUrl = typeof window !== 'undefined' ? ((window as any)['SUPABASE_URL'] || (window as any)['env']?.['SUPABASE_URL']) : null;");

code = code.replace(/const stored = localStorage\.getItem\('supabase_key'\);/g, "const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_key') : null;");
code = code.replace(/localStorage\.setItem\('supabase_key'/g, "if (typeof localStorage !== 'undefined') localStorage.setItem('supabase_key'");
code = code.replace(/const windowKey = \(window as any\)\['SUPABASE_KEY'\] \|\| \(window as any\)\['env'\]\?\.\['SUPABASE_KEY'\];/g, "const windowKey = typeof window !== 'undefined' ? ((window as any)['SUPABASE_KEY'] || (window as any)['env']?.['SUPABASE_KEY']) : null;");

code = code.replace(/localStorage\.getItem\('active_db'\)/g, "(typeof localStorage !== 'undefined' ? localStorage.getItem('active_db') : null)");
code = code.replace(/localStorage\.setItem\('active_db'/g, "if (typeof localStorage !== 'undefined') localStorage.setItem('active_db'");

fs.writeFileSync('src/app/scale.service.ts', code);
