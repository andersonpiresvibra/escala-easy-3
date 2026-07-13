const fs = require('fs');
let code = fs.readFileSync('src/app/scale.service.ts', 'utf-8');

code = code.replace(/this\.supabase = createClient\(url, key\);\s+this\.databaseError\.set\(null\);\s+this\.syncSupabase\(\);/g, 
  "this.supabase = createClient(url, key);\n        this.databaseError.set(null);\n        if (typeof window !== 'undefined') {\n          this.syncSupabase();\n        }");

fs.writeFileSync('src/app/scale.service.ts', code);
