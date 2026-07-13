const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

// 1. Hide CENTER PORTAL PROFILE HEADER IN MAIN HEADER on mobile
code = code.replace(
  `id="header_portal_profile">`,
  `id="header_portal_profile" class="hidden md:flex">`
);

// 2. Hide FULLSCREEN TOGGLE on mobile
code = code.replace(
  `<!-- FULLSCREEN (TELA CHEIA) TOGGLE -->\n      <button (click)="toggleFullscreen()"`,
  `<!-- FULLSCREEN (TELA CHEIA) TOGGLE -->\n      <button (click)="toggleFullscreen()"\n              class="hidden md:flex relative p-2.5 h-[40px] w-[40px] bg-[#071426] border border-[#10213b] text-slate-400 hover:text-white hover:bg-[#0b1e36] rounded-lg transition-all items-center justify-center cursor-pointer shadow-sm select-none border-none outline-none"`
);
// Remove the original class for FULLSCREEN TOGGLE to avoid duplicates
code = code.replace(
  `class="relative p-2.5 h-[40px] w-[40px] bg-[#071426] border border-[#10213b] text-slate-400 hover:text-white hover:bg-[#0b1e36] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-sm select-none border-none outline-none"\n              title="Tela Cheia">`,
  `title="Tela Cheia">`
);

// 3. Hide THEME TOGGLE on mobile from the header
code = code.replace(
  `<!-- THEME (CLARO / ESCURO) TOGGLE -->\n      <button (click)="toggleTheme()"`,
  `<!-- THEME (CLARO / ESCURO) TOGGLE -->\n      <button (click)="toggleTheme()"\n              class="hidden md:flex relative p-2.5 h-[40px] w-[40px] bg-[#071426] border border-[#10213b] text-slate-400 hover:text-white hover:bg-[#0b1e36] rounded-lg transition-all items-center justify-center cursor-pointer shadow-sm select-none border-none outline-none"`
);
code = code.replace(
  `class="relative p-2.5 h-[40px] w-[40px] bg-[#071426] border border-[#10213b] text-slate-400 hover:text-white hover:bg-[#0b1e36] rounded-lg transition-all flex items-center justify-center cursor-pointer shadow-sm select-none border-none outline-none"\n              title="Alternar Tema">`,
  `title="Alternar Tema">`
);

// 4. Change SETTINGS DROPDOWN OPTIONS BUTTON to Avatar on mobile
code = code.replace(
  `<span class="material-icons text-xs text-slate-400">settings</span>\n          Opções`,
  `@if (getLoggedCollab()) {\n            @let loggedH = getLoggedCollab()!;\n            <div class="md:hidden w-6 h-6 rounded-md border border-emerald-500/20 bg-slate-800 flex items-center justify-center text-emerald-500 font-bold text-[10px] overflow-hidden">\n               @if (loggedH.photoUrl || loggedH.photo) {\n                 <img [src]="getCollabPhoto(loggedH)" class="w-full h-full object-cover">\n               } @else {\n                 {{ loggedH.name.charAt(0) }}\n               }\n            </div>\n            <span class="hidden md:inline-flex material-icons text-xs text-slate-400">settings</span>\n            <span class="hidden md:inline-block">Opções</span>\n          } @else {\n            <span class="material-icons text-xs text-slate-400">settings</span>\n            <span class="hidden md:inline-block">Opções</span>\n          }`
);
code = code.replace(
  `<span class="material-icons text-xs transition-transform duration-200" [class.rotate-180]="isDropdownOpen()">expand_more</span>`,
  `<span class="hidden md:inline-block material-icons text-xs transition-transform duration-200" [class.rotate-180]="isDropdownOpen()">expand_more</span>`
);
// Make the settings button responsive padding
code = code.replace(
  `class="px-3.5 py-2.5 h-[40px] text-[10px] font-black tracking-wider uppercase bg-[#071426] hover:bg-[#0b1e36] text-slate-300 border border-[#10213b] transition-all flex items-center gap-1.5 cursor-pointer rounded-lg shadow-sm select-none border-none outline-none"`,
  `class="px-2 md:px-3.5 py-2 md:py-2.5 h-[40px] text-[10px] font-black tracking-wider uppercase bg-transparent md:bg-[#071426] hover:bg-[#0b1e36] text-slate-300 border-none md:border md:border-[#10213b] transition-all flex items-center gap-1.5 cursor-pointer rounded-lg shadow-none md:shadow-sm select-none outline-none"`
);

// 5. Swap Notification Bell and Settings Dropdown in HTML
const notifRegex = /<!-- Notification Bell with unread badge -->([\s\S]*?)<!-- SETTINGS DROPDOWN OPTIONS BUTTON -->/;
const notifMatch = code.match(notifRegex);
if (notifMatch) {
  const notifHTML = notifMatch[0];
  code = code.replace(notifHTML, `<!-- SETTINGS DROPDOWN OPTIONS BUTTON (Moved Up) -->\n`);
  
  const settingsEndRegex = /id="dropdown_options_menu">([\s\S]*?)<\/div>\n        }\n      <\/div>/;
  const settingsMatch = code.match(settingsEndRegex);
  if (settingsMatch) {
    code = code.replace(settingsMatch[0], settingsMatch[0] + `\n\n      ` + notifHTML.replace('<!-- SETTINGS DROPDOWN OPTIONS BUTTON -->', ''));
  }
}

fs.writeFileSync('src/app/app.html', code);
