const fs = require('fs');
let content = fs.readFileSync('src/app/app.html', 'utf8');

// The header is:
// <th class="py-3 px-4 text-center">Estatísticas</th>
// There are two of them, but we only want to remove the one in the Sigla dictionary (the second one).
// Wait, the user said "Exclua a coluna estatisticas do dicionário de silgas."
// Let's remove ONLY from sigla dictionary.

// Wait, the sigla dictionary is the one with `scaleService.siglaTypes()`.
// I can just replace the specific section in the HTML.
const siglaTableStart = 'scaleService.siglaTypes()';

// Find the Estatísticas header AFTER siglaTableStart? No, it's before it!
// Let's just find the index of scaleService.siglaTypes() and then work backwards.
// Or just replace the specific lines.

const chunkToReplace = `                        <th class="py-3 px-4">Identificação / Nome</th>
                        <th class="py-3 px-4">Descrição detalhada</th>
                        <th class="py-3 px-4 text-center">Estatísticas</th>
                        <th class="py-3 px-4 text-center">Ações</th>`;

const newChunk = `                        <th class="py-3 px-4">Identificação / Nome</th>
                        <th class="py-3 px-4">Descrição detalhada</th>
                        <th class="py-3 px-4 text-center">Ações</th>`;

content = content.replace(chunkToReplace, newChunk);

const tdToReplace = `                          <td class="py-3 px-4 text-slate-400 text-[11px]">
                            {{ sigla.description || 'Não especificada' }}
                          </td>
                          
                          <!-- Real-time Sigla Allocation Stats -->
                          <td class="py-3 px-4">
                            <div class="flex flex-col gap-1 items-center justify-center">
                              <span class="px-2 py-0.5 rounded text-[9px] font-black font-sans uppercase inline-flex items-center gap-1 bg-[#052e16]/40 text-emerald-400 border border-emerald-500/20"
                                    title="Dias programados com esta sigla na escala operacional de {{ currentMonthName() }}">
                                <span class="material-icons text-[10px]">event_note</span>
                                {{ getScheduledDaysCountForShift(sigla.code) }} dia(s)
                              </span>
                            </div>
                          </td>`;

const newTd = `                          <td class="py-3 px-4 text-slate-400 text-[11px]">
                            {{ sigla.description || 'Não especificada' }}
                          </td>`;

content = content.replace(tdToReplace, newTd);

fs.writeFileSync('src/app/app.html', content);
console.log('patched HTML');
