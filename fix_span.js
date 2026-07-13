const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

const target = `<span class="text-[9px] font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/25 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 animate-pulse">
                              <span class="material-icons text-[10px]">local_cafe</span>
                              <span>Boas folgas vêm aí!</span>
                            </span>`;

const replacement = `<div class="flex items-center gap-2">
                              <div class="w-px h-6 bg-[#10213b] mx-1"></div>
                              <div class="flex flex-col text-right">
                                <span class="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold">Próxima folga</span>
                                <span class="text-[11px] font-black font-mono text-emerald-500 uppercase leading-none mt-0.5">Dia {{ offStats.nextOffDays[0] }}</span>
                              </div>
                            </div>`;

code = code.replace(target, replacement);
fs.writeFileSync('src/app/app.html', code);
