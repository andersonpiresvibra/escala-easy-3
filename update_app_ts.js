const fs = require('fs');
let code = fs.readFileSync('src/app/app.ts', 'utf8');

const target = `  getConsecutiveWorkStats(collab: any) {`;
const replace = `  getArray(n: number): number[] {
    return Array.from({length: Math.max(1, n)}, (_, i) => i + 1);
  }

  getBarColor(index: number, currentStreak: number, isWorking: boolean): string {
    if (!isWorking) return '#e2e8f0'; // slate-200
    if (index > currentStreak) return '#e2e8f0'; // future
    
    switch(index) {
      case 1: return '#10b981'; // emerald-500
      case 2: return '#3b82f6'; // blue-500
      case 3: return '#eab308'; // yellow-500
      case 4: return '#f97316'; // orange-500
      default: return '#ef4444'; // red-500
    }
  }

  getConsecutiveWorkStats(collab: any) {`;

if(!code.includes('getArray(n: number)')) {
  code = code.replace(target, replace);
  fs.writeFileSync('src/app/app.ts', code);
}
