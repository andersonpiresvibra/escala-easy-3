const fs = require('fs');
let code = fs.readFileSync('src/app/app.ts', 'utf8');

// Insert dailyAvailableCollaborators before collaboratorsCountBySector
code = code.replace("  collaboratorsCountBySector = computed(() => {", `  dailyAvailableCollaborators = computed(() => {
    const days = this.daysInMonth();
    const collabs = this.filteredCollaborators();
    
    const availableCountByDay: { [day: number]: number } = {};
    
    days.forEach(day => {
      let count = 0;
      collabs.forEach(c => {
        const val = c.scale[day] || '-';
        // Only count as available if it's NOT an absence AND NOT a blank day ('-')
        const isAbsence = this.isSiglaAbsence(val);
        const isBlank = val === '-';
        if (!isAbsence && !isBlank) {
          count++;
        }
      });
      availableCountByDay[day] = count;
    });
    
    return availableCountByDay;
  });

  public selectedDailyDashDay = signal<number>(new Date().getDate());

  dailyDashSummary = computed(() => {
    const day = this.selectedDailyDashDay();
    const collabs = this.scaleService.collaborators();
    const shifts = this.scaleService.shiftTypes();
    const siglas = this.scaleService.siglaTypes();
    
    // Grouping
    const working: Array<{collab: any, shift: any, val: string, energy: number}> = [];
    const absent: Array<{collab: any, sigla: any, val: string}> = [];
    const unknown: Array<{collab: any, val: string}> = [];

    const getEnergy = (collab: any, targetDay: number) => {
      let streak = 0;
      for (let d = targetDay; d >= 1; d--) {
        const v = collab.scale[d] || '-';
        if (!this.isSiglaAbsence(v) && v !== '-') {
          streak++;
        } else {
          break;
        }
      }
      return Math.max(10, 100 - ((streak - 1) * 20));
    };

    collabs.forEach(c => {
      const val = (c.scale[day] || '-').trim().toUpperCase();
      if (val === '-') {
        unknown.push({collab: c, val});
      } else if (this.isSiglaAbsence(val)) {
        const sigla = siglas.find(s => s.code.toUpperCase() === val) || null;
        absent.push({collab: c, sigla, val});
      } else {
        const shift = shifts.find(s => s.code.toUpperCase() === val) || null;
        working.push({collab: c, shift, val, energy: getEnergy(c, day)});
      }
    });

    const workingByShift: { [shiftCode: string]: { shift: any, items: typeof working } } = {};
    working.forEach(w => {
      const code = w.shift ? w.shift.code : w.val;
      if (!workingByShift[code]) {
        workingByShift[code] = { shift: w.shift, items: [] };
      }
      workingByShift[code].items.push(w);
    });

    const absentBySigla: { [siglaCode: string]: { sigla: any, items: typeof absent } } = {};
    absent.forEach(a => {
      const code = a.sigla ? a.sigla.code : a.val;
      if (!absentBySigla[code]) {
        absentBySigla[code] = { sigla: a.sigla, items: [] };
      }
      absentBySigla[code].items.push(a);
    });

    return {
      day,
      working,
      absent,
      unknown,
      workingByShift: Object.values(workingByShift).sort((a,b) => (a.shift?.code || '').localeCompare(b.shift?.code || '')),
      absentBySigla: Object.values(absentBySigla).sort((a,b) => (a.sigla?.code || '').localeCompare(b.sigla?.code || ''))
    };
  });

  collaboratorsCountBySector = computed(() => {`);

// Update activeSubTab
code = code.replace("public activeSubTab = signal<'matrix' | 'ger.turnos' | 'siglas' | 'team' | 'team-mgmt' | 'portal' | 'dashboard'>('matrix');", "public activeSubTab = signal<'matrix' | 'daily-dash' | 'ger.turnos' | 'siglas' | 'team' | 'team-mgmt' | 'portal' | 'dashboard'>('daily-dash');");

fs.writeFileSync('src/app/app.ts', code);
