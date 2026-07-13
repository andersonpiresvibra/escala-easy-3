const fs = require('fs');
let code = fs.readFileSync('src/app/app.ts', 'utf-8');

code = code.replace(/  prevMonth\(\): void \{[\s\S]*?  \}/, `  prevMonth(): void {
    if (this.selectedMonthIndex() === 0) {
      this.selectedMonthIndex.set(11);
      this.currentYear.set(this.currentYear() - 1);
    } else {
      this.selectedMonthIndex.set(this.selectedMonthIndex() - 1);
    }
    this.isMonthPickerOpen.set(false);
  }`);

code = code.replace(/  nextMonth\(\): void \{[\s\S]*?  \}/, `  nextMonth(): void {
    if (this.selectedMonthIndex() === 11) {
      this.selectedMonthIndex.set(0);
      this.currentYear.set(this.currentYear() + 1);
    } else {
      this.selectedMonthIndex.set(this.selectedMonthIndex() + 1);
    }
    this.isMonthPickerOpen.set(false);
  }`);

// Remove the ones I added earlier
code = code.replace(/  previousMonth\(\) \{[\s\S]*?  nextMonth\(\) \{[\s\S]*?  \}\n/g, "");

fs.writeFileSync('src/app/app.ts', code);
