const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf-8');

const target = `                    <div>
                      <h4 class="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5">
                        <span class="material-icons text-[#10b981] text-sm">calendar_month</span>
                        Calendário Oficial do Mês - {{ currentMonthName() }} {{ currentYear() }}
                      </h4>
                      <p class="text-[9px] text-slate-400 mt-1">
                        Legenda de cores: Verde representa suas folgas, Vermelho representa licenças/afastamentos médicos, e Azul representa escala regular.
                      </p>
                    </div>`;

const replacement = `                    <div class="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h4 class="font-black text-xs text-white uppercase tracking-wider flex items-center gap-1.5"
                            [class.text-slate-800]="isLightTheme()">
                          <span class="material-icons text-[#10b981] text-sm">calendar_month</span>
                          Calendário Oficial - {{ currentMonthName() }} {{ currentYear() }}
                        </h4>
                        <p class="text-[9px] text-slate-400 mt-1" [class.text-slate-500]="isLightTheme()">
                          Legenda: Verde (Folgas), Vermelho (Licenças), Azul (Escala Regular).
                        </p>
                      </div>
                      
                      <!-- Month Navigator -->
                      <div class="flex items-center gap-1 bg-[#071426] border border-[#10213b] rounded-lg p-1"
                           [class.bg-slate-100]="isLightTheme()"
                           [class.border-slate-200]="isLightTheme()">
                        <button (click)="prevMonth()" class="w-8 h-8 flex items-center justify-center rounded cursor-pointer text-slate-400 hover:text-emerald-400 hover:bg-[#0b1e36] transition-colors border-none outline-none"
                                [class.hover:bg-white]="isLightTheme()"
                                title="Mês Anterior">
                          <span class="material-icons text-sm">chevron_left</span>
                        </button>
                        <div class="flex flex-col items-center justify-center min-w-[100px]">
                          <span class="text-[9px] font-black uppercase text-slate-300 leading-tight"
                                [class.text-slate-700]="isLightTheme()">
                            {{ currentMonthName() }}
                          </span>
                          <span class="text-[7px] font-bold text-slate-500 font-mono leading-tight">
                            {{ currentYear() }}
                          </span>
                        </div>
                        <button (click)="nextMonth()" class="w-8 h-8 flex items-center justify-center rounded cursor-pointer text-slate-400 hover:text-emerald-400 hover:bg-[#0b1e36] transition-colors border-none outline-none"
                                [class.hover:bg-white]="isLightTheme()"
                                title="Próximo Mês">
                          <span class="material-icons text-sm">chevron_right</span>
                        </button>
                      </div>
                    </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/app/app.html', code);
