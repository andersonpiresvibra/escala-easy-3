const fs = require('fs');
let code = fs.readFileSync('src/app/app.ts', 'utf8');

// Add onResize handler
const hostRegex = /host: \{\n(.*)\n(.*?)\n\s*\}/;
code = code.replace(hostRegex, `host: {\n$1\n$2,\n    '(window:resize)': 'onResize()'\n  }`);

const classRegex = /export class App \{/;
code = code.replace(classRegex, `export class App {\n\n  onResize() {\n    if (typeof window !== 'undefined' && window.innerWidth < 768) {\n      if (this.activeSubTab() !== 'portal') {\n        this.activeSubTab.set('portal');\n      }\n    }\n  }`);

const initRegex = /constructor\(\) \{/;
code = code.replace(initRegex, `constructor() {\n    if (typeof window !== 'undefined' && window.innerWidth < 768) {\n      this.activeSubTab.set('portal');\n    }`);

fs.writeFileSync('src/app/app.ts', code);
