const fs = require('fs');
let code = fs.readFileSync('src/app/app.html', 'utf8');

const divTarget = `<!-- SECTION: MINHAS DATAS IMPORTANTES -->
                <div class="bg-[#030a14] border border-[#10213b] rounded-lg p-5 shadow-xl space-y-3">`;
const divReplace = `<!-- SECTION: MINHAS DATAS IMPORTANTES -->
                <div (pointerdown)="onImportantDatesPointerDown($event)" (pointerup)="onImportantDatesPointerUp()" (pointerleave)="onImportantDatesPointerUp()" class="bg-[#030a14] border border-[#10213b] rounded-lg p-5 shadow-xl space-y-3 cursor-pointer select-none hover:border-rose-500/30 transition-colors relative group" title="Pressione por 2 segundos para editar">
                  <div class="absolute inset-0 bg-rose-500/0 group-active:bg-rose-500/5 transition-colors duration-[2000ms] rounded-lg pointer-events-none"></div>`;

code = code.replace(divTarget, divReplace);

// Then append the modal at the end, right before </main> or in a generic modal area.
// Wait, I can place it right under the "Solicitar Folgas" modal.
const modalTarget = `<!-- MODAL: SOLICITAR FOLGA GENERICO -->`;
const modalReplace = `<!-- MODAL: EDITAR DATAS IMPORTANTES -->
  @if (isPortalEditingDates()) {
    <div class="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" id="modal_editing_dates_overlay">
      <div class="bg-[#030a14] border border-[#10213b] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-slide-up" id="modal_editing_dates_content">
        <div class="p-4 border-b border-[#10213b] flex items-center justify-between shrink-0 bg-slate-900/30">
          <div>
            <h3 class="font-black text-sm uppercase tracking-wider text-white">Editar Datas Importantes</h3>
            <span class="text-[10px] font-bold text-slate-400 block uppercase mt-0.5">
              Personalize suas datas (Aniversários, Casamento, etc.)
            </span>
          </div>
          <button (click)="isPortalEditingDates.set(false)" class="text-slate-400 hover:text-white transition-colors bg-transparent border-none outline-none cursor-pointer p-1">
            <span class="material-icons text-xl">close</span>
          </button>
        </div>
        <div class="p-4 space-y-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
           @for (date of editingSpecialDates(); track $index) {
             <div class="flex items-center gap-2">
                <input type="date" [value]="date.date" (change)="updateSpecialDateRow($index, 'date', $any($event.target).value)" class="bg-[#071426] text-white border border-[#10213b] focus:border-emerald-500 outline-none rounded-lg px-2 py-1.5 text-[11px] font-mono h-8">
                <input type="text" [value]="date.description" (input)="updateSpecialDateRow($index, 'description', $any($event.target).value)" placeholder="Descrição (ex: Casamento)" class="flex-1 bg-[#071426] text-white border border-[#10213b] focus:border-emerald-500 outline-none rounded-lg px-2 py-1.5 text-xs h-8">
                <button (click)="removeSpecialDateRow($index)" class="w-8 h-8 rounded flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500/20 cursor-pointer">
                  <span class="material-icons text-sm leading-none">delete</span>
                </button>
             </div>
           } @empty {
              <div class="text-center py-4 border border-dashed border-[#10213b]/60 rounded-lg bg-slate-900/30">
                <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nenhuma data adicionada.</span>
              </div>
           }
           <button (click)="addSpecialDateRow()" class="w-full py-2 bg-[#071426] border border-dashed border-[#10213b] hover:bg-[#10213b] hover:border-emerald-500/40 hover:text-emerald-400 text-slate-400 text-[10px] font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer">
             <span class="material-icons text-xs">add</span> Adicionar Data Especial
           </button>
        </div>
        <div class="p-4 border-t border-[#10213b] bg-slate-900/30">
          <button (click)="saveSpecialDates()" class="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer">
            Salvar Datas no Cadastro
          </button>
        </div>
      </div>
    </div>
  }

  <!-- MODAL: SOLICITAR FOLGA GENERICO -->`;

code = code.replace(modalTarget, modalReplace);
fs.writeFileSync('src/app/app.html', code);
