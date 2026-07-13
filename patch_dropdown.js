const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

const oldProfileBlock = `@if (scaleService.selectedCollabName()) {
                <div class="mx-3 my-1.5 px-3 py-2 border border-[#10213b] bg-[#030a14]/60 rounded-lg flex items-center gap-2 select-none">
                  <div class="w-6 h-6 rounded bg-[#10b981] text-white flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                    {{ scaleService.selectedCollabName() | slice:0:2 | uppercase }}
                  </div>
                  <div class="flex flex-col min-w-0">
                    <span class="text-[9px] font-black uppercase text-white leading-tight tracking-wider truncate">{{ scaleService.selectedCollabName() }}</span>
                    <span class="text-[7px] font-bold text-slate-400 uppercase leading-tight tracking-widest truncate">{{ scaleService.currentRole() === 'SUPERVISOR' ? 'ADMIN' : scaleService.currentRole() === 'LIDER' ? 'LÍDER DE TURNO' : 'COLABORADOR' }}</span>
                  </div>
                </div>
              }`;

const newProfileBlock = `@if (getLoggedCollab()) {
                @let logCol = getLoggedCollab()!;
                <div class="mx-3 my-1.5 px-3 py-2 border border-[#10213b] bg-[#030a14]/60 rounded-lg flex flex-col gap-2 select-none">
                  <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded bg-[#10b981] text-white flex items-center justify-center font-bold text-[10px] font-mono shrink-0">
                      {{ logCol.name | slice:0:2 | uppercase }}
                    </div>
                    <div class="flex flex-col min-w-0">
                      <span class="text-[9px] font-black uppercase text-white leading-tight tracking-wider truncate">{{ logCol.name }}</span>
                      <span class="text-[7px] font-bold text-slate-400 uppercase leading-tight tracking-widest truncate">{{ logCol.role === 'SUPERVISOR' ? 'ADMIN' : logCol.role === 'LIDER' ? 'LÍDER DE TURNO' : 'COLABORADOR' }}</span>
                    </div>
                  </div>
                  <!-- Mobile only Sector and Turno info -->
                  <div class="flex md:hidden justify-between mt-1 pt-1 border-t border-[#10213b]/50">
                     <div class="flex flex-col">
                        <span class="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Setor</span>
                        <span class="text-[8px] font-black uppercase tracking-wide leading-none text-slate-300">{{ logCol.sector || 'Geral' }}</span>
                     </div>
                     <div class="flex flex-col items-end">
                        <span class="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Turno</span>
                        <span class="text-[8px] font-black text-emerald-500 uppercase tracking-wide leading-none font-mono">{{ logCol.shift }}</span>
                     </div>
                  </div>
                </div>
              }`;

code = code.replace(oldProfileBlock, newProfileBlock);

const presentationBlock = `<div class="py-2.5 px-4 bg-[#091526] border-t border-[#10213b]" id="presentation_mode_dropdown_section">`;
code = code.replace(presentationBlock, `<div class="py-2.5 px-4 bg-[#091526] border-t border-[#10213b] hidden md:block" id="presentation_mode_dropdown_section">`);

// Add theme toggle below the profile in the dropdown, visible only on mobile
const logoutBlock = `@if (!scaleService.selectedCollabName()) {`;
const themeToggleBlock = `
              <!-- Theme Toggle in Dropdown for Mobile -->
              <div class="py-1.5 border-t border-[#10213b] md:hidden">
                <button (click)="toggleTheme(); isDropdownOpen.set(false)"
                        class="w-full text-left px-4 py-2 text-[10px] font-black uppercase transition-colors tracking-wider flex items-center gap-2 cursor-pointer border-none outline-none bg-transparent hover:bg-[#0b1e36]">
                  <span class="material-icons text-sm" style="color: #e8e22f !important;" [class.text-amber-500]="isLightTheme()">{{ isLightTheme() ? 'light_mode' : 'dark_mode' }}</span>
                  Modo {{ isLightTheme() ? 'Claro' : 'Escuro' }}
                </button>
              </div>
              
              @if (!scaleService.selectedCollabName()) {`;

code = code.replace(logoutBlock, themeToggleBlock);

// Hide entire Seções block on mobile to keep it super clean (since Portal is the only mobile page)
// Wait, the user specifically mentioned removing Escala, Gerenciamento, Apresentacao.
// We can just hide the Seções block entirely on mobile!
const sessoesBlock = `<!-- Seções -->\n            <div class="py-1.5 bg-[#030a14] border-t border-[#10213b]" id="dropdown_sections_category">`;
code = code.replace(sessoesBlock, `<!-- Seções -->\n            <div class="py-1.5 bg-[#030a14] border-t border-[#10213b] hidden md:block" id="dropdown_sections_category">`);

fs.writeFileSync('src/app/app.html', code);
