const fs = require('fs');
let code = fs.readFileSync('src/app/app.ts', 'utf8');

const target = `  getImportantDatesForCollab(collab: any):`;
const replace = `  // --- Long Press Edit Dates Logic ---
  private datesLongPressTimer: any;
  public editingSpecialDates = signal<{date: string, description: string, priority: number}[]>([]);

  onImportantDatesPointerDown(event: Event) {
    this.datesLongPressTimer = setTimeout(() => {
      this.isPortalEditingDates.set(true);
      const logged = this.getLoggedCollab();
      if (logged) {
         const currentDates = JSON.parse(JSON.stringify(logged.specialDates || []));
         this.editingSpecialDates.set(currentDates);
      }
    }, 2000);
  }

  onImportantDatesPointerUp() {
    if (this.datesLongPressTimer) {
      clearTimeout(this.datesLongPressTimer);
    }
  }

  updateSpecialDateRow(index: number, field: 'date' | 'description', value: string) {
    this.editingSpecialDates.update(dates => {
      const newDates = [...dates];
      newDates[index] = { ...newDates[index], [field]: value };
      return newDates;
    });
  }

  addSpecialDateRow() {
    this.editingSpecialDates.update(dates => [...dates, { date: '', description: '', priority: 1 }]);
  }

  removeSpecialDateRow(index: number) {
    this.editingSpecialDates.update(dates => {
      const newDates = [...dates];
      newDates.splice(index, 1);
      return newDates;
    });
  }

  saveSpecialDates() {
    const logged = this.getLoggedCollab();
    if (!logged) return;
    const validDates = this.editingSpecialDates().filter(d => d.date && d.description);
    const updated = {
       ...logged,
       specialDates: validDates
    };
    this.scaleService.updateCollaborator(updated);
    this.isPortalEditingDates.set(false);
    this.showToast('Datas importantes atualizadas com sucesso!');
  }

  getImportantDatesForCollab(collab: any):`;

code = code.replace(target, replace);
fs.writeFileSync('src/app/app.ts', code);
