const fs = require('fs');
let code = fs.readFileSync('src/app/app.ts', 'utf-8');

const monthMethods = `
  previousMonth() {
    if (this.selectedMonthIndex() === 0) {
      this.selectedMonthIndex.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.selectedMonthIndex.set(this.selectedMonthIndex() - 1);
    }
  }

  nextMonth() {
    if (this.selectedMonthIndex() === 11) {
      this.selectedMonthIndex.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.selectedMonthIndex.set(this.selectedMonthIndex() + 1);
    }
  }
`;

if (!code.includes('previousMonth() {')) {
  code = code.replace("changeRole(role: 'SUPERVISOR' | 'LIDER' | 'OPERADOR') {", monthMethods + "\n  changeRole(role: 'SUPERVISOR' | 'LIDER' | 'OPERADOR') {");
  fs.writeFileSync('src/app/app.ts', code);
}
