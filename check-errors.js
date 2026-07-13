const { JSDOM, VirtualConsole } = require('jsdom');

const virtualConsole = new VirtualConsole();
virtualConsole.on('error', (err) => {
  console.log('🔴 JS Error in Virtual Console:', err.message, err.stack);
});
virtualConsole.on('warn', (msg) => {
  console.log('🟡 JS Warning in Virtual Console:', msg);
});
virtualConsole.on('log', (msg) => {
  console.log('🟢 JS Log in Virtual Console:', msg);
});

console.log('Loading local dev server...');
JSDOM.fromURL('http://localhost:3000/', {
  resources: 'usable',
  runScripts: 'dangerously',
  virtualConsole
}).then(dom => {
  console.log('DOM loaded successfully. Waiting 5 seconds for Angular initialization...');
  setTimeout(() => {
    console.log('Page content length:', dom.serialize().length);
    console.log('App root content:', dom.window.document.querySelector('app-root').innerHTML);
    dom.window.close();
    process.exit(0);
  }, 5000);
}).catch(err => {
  console.error('Failed to load page via JSDOM:', err);
  process.exit(1);
});
