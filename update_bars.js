const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

let pTextTarget = `<div class="flex items-center gap-2.5">
                              <span class="material-icons text-amber-400 text-lg">schedule</span>
                              <div>
                                <p class="text-[13px] font-extrabold text-slate-900 leading-tight">
                                  {{ seqStats.streak }}º Dia de Trabalho Consecutivo
                                </p>
                                <p class="text-[10px] text-slate-500">
                                  Escala programada de {{ seqStats.totalStreak }} dias úteis
                                </p>
                              </div>
                            </div>`;

let pTextReplace = `<div class="flex items-center gap-2.5">
                              <span class="material-icons text-amber-500 text-lg">schedule</span>
                              <div>
                                <p class="text-[13px] font-extrabold text-slate-900 leading-tight">
                                  {{ seqStats.streak }}º / {{ seqStats.totalStreak }} Dias consecutivos
                                </p>
                              </div>
                            </div>`;

code = code.replace(pTextTarget, pTextReplace);

let barTarget = `<div class="grid grid-cols-4 gap-1 h-1.5">
                            <div class="rounded-full transition-all duration-500"
                                 [style.background-color]="seqStats.isWorking && seqStats.streak >= 1 ? '#10b981' : '#1e293b'"></div>
                            <div class="rounded-full transition-all duration-500"
                                 [style.background-color]="seqStats.isWorking && seqStats.streak >= 2 ? '#0ea5e9' : '#1e293b'"></div>
                            <div class="rounded-full transition-all duration-500"
                                 [style.background-color]="seqStats.isWorking && seqStats.streak >= 3 ? '#f59e0b' : '#1e293b'"></div>
                            <div class="rounded-full transition-all duration-500"
                                 [style.background-color]="seqStats.isWorking && seqStats.streak >= 4 ? '#ef4444' : '#1e293b'"></div>
                          </div>`;
let barReplace = `<div class="flex gap-1 h-1.5 w-full">
                            @for (i of getArray(seqStats.totalStreak); track i) {
                              <div class="flex-1 rounded-full transition-all duration-500"
                                   [style.background-color]="getBarColor(i, seqStats.streak, seqStats.isWorking)"></div>
                            }
                          </div>`;
                          
code = code.replace(barTarget, barReplace);

let sec2Target = `<div class="flex items-center gap-2">
                              <span class="material-icons text-amber-500 text-base">radar</span>
                              <span class="text-xs font-bold text-slate-300">
                                @if (offStats.days === 1) {
                                  Falta apenas <span class="text-amber-400 font-extrabold text-[13px] font-mono">1 dia</span> de trabalho para folgar!
                                } @else if (offStats.days === 999) {
                                  Sem mais folgas programadas.
                                } @else {
                                  Faltam <span class="text-amber-400 font-extrabold text-[13px] font-mono">{{ offStats.days }} dias</span> para sua folga!
                                }
                              </span>
                            </div>
                            <div class="flex items-center gap-2">
                              <div class="w-px h-6 bg-[#10213b] mx-1"></div>
                              <div class="flex flex-col text-right">
                                <span class="text-[7.5px] uppercase tracking-wider text-slate-500 font-bold">Próxima folga</span>
                                <span class="text-[11px] font-black font-mono text-emerald-500 uppercase leading-none mt-0.5">Dia {{ offStats.nextOffDays[0] }}</span>
                              </div>
                            </div>`;
                            
let sec2Replace = `<div class="flex items-center gap-2">
                              <span class="material-icons text-amber-500 text-base">radar</span>
                              <span class="text-xs font-bold text-slate-700">
                                @if (offStats.days === 1) {
                                  Falta apenas <span class="text-amber-600 font-extrabold text-[13px] font-mono">1 dia</span> de trabalho para folgar!
                                } @else if (offStats.days === 999) {
                                  Sem mais folgas programadas.
                                } @else {
                                  Faltam <span class="text-amber-600 font-extrabold text-[13px] font-mono">{{ offStats.days }} dias</span> para sua folga!
                                }
                              </span>
                            </div>`;

code = code.replace(sec2Target, sec2Replace);

let sec3Target = `<div class="pt-3 border-t border-[#10213b]/50 space-y-1">
                          <p class="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                            FOLGAS PROGRAMADAS DE {{ currentMonthName() | uppercase }}
                          </p>
                          <div class="text-[11px] text-slate-300 flex items-center gap-1.5 flex-wrap">
                            <span class="material-icons text-xs text-emerald-400">calendar_month</span>
                            <span>Dias de descanso planejado:</span>
                            <span class="font-mono font-black text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded text-xs select-none">
                              {{ offStats.nextOffDays.join(', ') }}
                            </span>
                          </div>
                        </div>`;
                        
let sec3Replace = `<div class="pt-3 border-t border-[#10213b]/50 space-y-2">
                          <p class="text-[10px] font-black tracking-wider text-slate-500 uppercase">
                            FOLGAS PROGRAMADAS DE {{ currentMonthName() | uppercase }}
                          </p>
                          <div class="text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap">
                            <span class="material-icons text-xs text-emerald-500">calendar_month</span>
                            <span>Dias de descanso planejado:</span>
                            <div class="flex flex-wrap gap-1.5 ml-1">
                              @for (day of offStats.nextOffDays; track day) {
                                <span class="font-mono font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded text-xs select-none shadow-sm">
                                  {{ day }}
                                </span>
                              }
                            </div>
                          </div>
                        </div>`;

code = code.replace(sec3Target, sec3Replace);

fs.writeFileSync('src/app/app.html', code);
