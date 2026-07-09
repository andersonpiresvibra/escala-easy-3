import { Component, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScaleService, Collaborator, ShiftType, SpecialDate, FolgaRequest } from './scale.service';
import * as pdfjsLib from 'pdfjs-dist';

if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

interface AppNotification {
  id: string;
  type: 'publish' | 'alert' | 'trade';
  message: string;
  timestamp: string;
  read: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  host: {
    '(document:fullscreenchange)': 'onFullscreenChange()',
    '(document:click)': 'onDocumentClick($event)'
  }
})
export class App {
  public scaleService = inject(ScaleService);

  // Theme & Fullscreen states
  public isLightTheme = signal<boolean>(true);
  public isFullscreen = signal<boolean>(false);

  public toggleTheme(): void {
    const val = !this.isLightTheme();
    this.isLightTheme.set(val);
    if (val) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }

  public onFullscreenChange(): void {
    this.isFullscreen.set(!!document.fullscreenElement);
  }

  public onDocumentClick(event: MouseEvent): void {
    this.isDropdownOpen.set(false);
    this.isMonthPickerOpen.set(false);
    this.isMatrixOptionsOpen.set(false);
    this.isNotificationOpen.set(false);
  }

  public toggleNotificationMenu(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.isNotificationOpen();
    this.isDropdownOpen.set(false);
    this.isMonthPickerOpen.set(false);
    this.isMatrixOptionsOpen.set(false);
    this.isNotificationOpen.set(!current);
  }

  public toggleDropdownMenu(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.isDropdownOpen();
    this.isMonthPickerOpen.set(false);
    this.isMatrixOptionsOpen.set(false);
    this.isNotificationOpen.set(false);
    this.isDropdownOpen.set(!current);
  }

  public toggleMonthPickerMenu(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.isMonthPickerOpen();
    this.isDropdownOpen.set(false);
    this.isMatrixOptionsOpen.set(false);
    this.isNotificationOpen.set(false);
    this.isMonthPickerOpen.set(!current);
  }

  public toggleMatrixOptionsMenu(event: MouseEvent): void {
    event.stopPropagation();
    const current = this.isMatrixOptionsOpen();
    this.isDropdownOpen.set(false);
    this.isMonthPickerOpen.set(false);
    this.isNotificationOpen.set(false);
    this.isMatrixOptionsOpen.set(!current);
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
        // Fallback toggle
        this.isFullscreen.set(!this.isFullscreen());
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.warn('Exit fullscreen failed:', err);
      });
    }
  }

  // Sub tab navigation: 'matrix' | 'ger.turnos' | 'siglas' | 'team' | 'team-mgmt' | 'portal' | 'dashboard'
  public activeSubTab = signal<'matrix' | 'ger.turnos' | 'siglas' | 'team' | 'team-mgmt' | 'portal' | 'dashboard'>('matrix');
  
  public teamViewMode = signal<'gallery' | 'mgmt'>('gallery');
  public editingCollab = signal<Collaborator | null>(null);
  public isPortalCollabListOpen = signal<boolean>(false);
  public isPortalRulesOpen = signal<boolean>(false);
  public isCollabModalOpen = signal<boolean>(false);
  public isNewSectorMode = signal<boolean>(false);
  public isNewRoleMode = signal<boolean>(false);

  public openCreateCollabModal(): void {
    this.editingCollab.set(null);
    this.newCollabPhotoData.set(null);
    this.isCollabModalOpen.set(true);
    this.isNewSectorMode.set(false);
    this.isNewRoleMode.set(false);
  }

  // Simulated Day of Month (1 to 30) for Folga request window check
  simulatedDayOfMonth = signal<number>(5);

  // New Collaborator Registration Fields
  newCollabBirthday = signal<string>('');
  newCollabSpecialDates = signal<SpecialDate[]>([
    { description: '', date: '', priority: 1 },
    { description: '', date: '', priority: 2 },
    { description: '', date: '', priority: 3 },
    { description: '', date: '', priority: 4 },
    { description: '', date: '', priority: 5 }
  ]);

  // Selected collaborator for detailed profile view
  selectedProfileCollabId = signal<string | null>(null);

  // Computes the active collaborator, falling back to the first one in the list
  selectedProfileCollab = computed<any>(() => {
    const list = this.scaleService.collaborators();
    if (list.length === 0) return null;
    const id = this.selectedProfileCollabId();
    if (id) {
      const found = list.find(c => c.id === id);
      if (found) return found;
    }
    return list[0]; // fallback to first
  });

  // Dynamically computes stats, fatigue indexes, and shift hours for the selected collaborator
  collabStats = computed(() => {
    return this.calculateStatsForCollab(this.selectedProfileCollab());
  });

  // Dynamically computes team-wide fatigue and energy statistics for the entire organization
  teamStats = computed(() => {
    const list = this.scaleService.collaborators();
    if (list.length === 0) {
      return {
        avgEnergy: 0,
        critCount: 0,
        limitCount: 0,
        totalHours: 0
      };
    }
    
    let totalEnergy = 0;
    let critCount = 0;
    let limitCount = 0;
    let totalHours = 0;
    
    list.forEach(collab => {
      const data = this.scaleService.calculateEnergyAndFatigue(collab);
      totalEnergy += data.energy;
      totalHours += data.totalHoursWorked;
      if (data.energy < 30) {
        critCount++;
      }
      if (data.alertaLimite) {
        limitCount++;
      }
    });
    
    return {
      avgEnergy: Math.round(totalEnergy / list.length),
      critCount,
      limitCount,
      totalHours: parseFloat(totalHours.toFixed(1))
    };
  });

  isSiglaAbsence(val: string): boolean {
    const upper = (val || '').toUpperCase().trim();
    if (!upper || upper === '-' || upper === '?') return false;
    
    // Base standard rest codes
    if (upper === 'X' || upper === 'BH' || upper === 'F' || upper === 'LM' || upper === 'CP' || upper === 'AT' || upper === 'W' || upper === 'FO' || upper === 'P' || upper === 'R' || upper === 'EX') {
      return true;
    }
    
    // Dynamic check
    const sigla = this.scaleService.siglaTypes().find(s => s.code.toUpperCase().trim() === upper);
    if (sigla && sigla.computaAusencia) {
      return true;
    }
    
    return false;
  }

  // Reusable method to calculate stats for any collaborator
  calculateStatsForCollab(collab: Collaborator | null) {
    if (!collab) return null;

    const scale = collab.scale || {};
    let workDays = 0;
    let offDays = 0;
    
    // Calculate sequences
    let currentWorkStreak = 0;
    let maxWorkStreak = 0;
    
    let currentOffStreak = 0;
    let maxOffStreak = 0;

    const defaultCode = this.getShiftCode(collab.shift);
    for (let d = 1; d <= 30; d++) {
      const rawVal = scale[d] || '-';
      const val = (rawVal === '-') ? defaultCode : rawVal;
      
      // Use dynamic absence check
      const isRest = this.isSiglaAbsence(val);
      
      if (!isRest) {
        workDays++;
        currentWorkStreak++;
        maxWorkStreak = Math.max(maxWorkStreak, currentWorkStreak);
        
        currentOffStreak = 0;
      } else {
        offDays++;
        currentOffStreak++;
        maxOffStreak = Math.max(maxOffStreak, currentOffStreak);
        
        currentWorkStreak = 0;
      }
    }

    // Fatigue classification
    let fatigueRisk: 'Baixo' | 'Moderado' | 'Crítico' = 'Baixo';
    let fatigueColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let fatigueDescription = 'Ciclo de descanso balanceado. Excelente recuperação biológica.';

    if (maxWorkStreak >= 6) {
      fatigueRisk = 'Crítico';
      fatigueColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse';
      fatigueDescription = 'Risco elevado de fadiga acumulada. Sequência contínua de ' + maxWorkStreak + ' dias no pátio. Recomenda-se escala de folga imediata para evitar incidentes operacionais.';
    } else if (maxWorkStreak === 5) {
      fatigueRisk = 'Moderado';
      fatigueColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      fatigueDescription = 'Atenção. Sequência de 5 dias trabalhados. Nível de alerta operacional intermediário.';
    }

    // Map shift to times dynamically
    let entryTime = '07:00';
    let exitTime = '15:20';
    const sCode = (collab.shift || '').trim().toUpperCase();
    const shiftType = this.scaleService.shiftTypes().find(s => 
      s.code.trim().toUpperCase() === sCode || 
      s.label.trim().toUpperCase() === sCode
    );
    if (shiftType && shiftType.startTime && shiftType.endTime) {
      entryTime = shiftType.startTime;
      exitTime = shiftType.endTime;
    } else {
      if (sCode === 'MANHÃ' || sCode === 'M') {
        entryTime = '06:00';
        exitTime = '14:00';
      } else if (sCode === 'TARDE' || sCode === 'T') {
        entryTime = '14:00';
        exitTime = '22:00';
      } else if (sCode === 'MADRUGADA' || sCode === 'NOITE' || sCode === 'N') {
        entryTime = '22:00';
        exitTime = '06:00';
      } else if (sCode === 'ADMINISTRATIVO' || sCode === 'ADM') {
        entryTime = '08:00';
        exitTime = '17:00';
      }
    }

    return {
      workDays,
      offDays,
      maxWorkStreak,
      maxOffStreak,
      fatigueRisk,
      fatigueColor,
      fatigueDescription,
      entryTime,
      exitTime
    };
  }

  getShiftCode(s: string): string {
    const norm = (s || '').toUpperCase().trim();
    const foundByCode = this.scaleService.shiftTypes().find(st => st.code.toUpperCase().trim() === norm);
    if (foundByCode) return foundByCode.code;

    const foundByLabel = this.scaleService.shiftTypes().find(st => st.label.toUpperCase().trim() === norm);
    if (foundByLabel) return foundByLabel.code;

    return norm;
  }

    getShiftLabel(collab: any): string {
    if (!collab || !collab.shift) return '-';
    const sCode = collab.shift.trim().toUpperCase();
    const shiftType = this.scaleService.shiftTypes().find(s => 
      s.code.trim().toUpperCase() === sCode || 
      s.label.trim().toUpperCase() === sCode
    );
    return shiftType ? shiftType.label : collab.shift;
  }

  getCollabHours(collab: any): string {
    if (!collab) return '07:00-15:20';
    const sCode = (collab.shift || '').trim().toUpperCase();
    const shiftType = this.scaleService.shiftTypes().find(s => 
      s.code.trim().toUpperCase() === sCode || 
      s.label.trim().toUpperCase() === sCode
    );
    if (shiftType && shiftType.startTime && shiftType.endTime) {
      return `${shiftType.startTime}-${shiftType.endTime}`;
    }
    
    if (sCode === 'MANHÃ' || sCode === 'M') {
      return '06:00-14:00';
    } else if (sCode === 'TARDE' || sCode === 'T') {
      return '14:00-22:00';
    } else if (sCode === 'MADRUGADA' || sCode === 'NOITE' || sCode === 'N') {
      return '22:00-06:00';
    } else if (sCode === 'ADMINISTRATIVO' || sCode === 'ADM') {
      return '08:00-17:00';
    }
    return '07:00-15:20';
  }

  getCollabPhoto(collab: any): string {
    const isLight = this.isLightTheme();
    const bgFill = isLight ? '#f1f5f9' : '#0b1a30';
    const borderStroke = isLight ? '#cbd5e1' : '#10213b';
    
    const msnAvatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="50" fill="${bgFill}" stroke="${borderStroke}" stroke-width="1.5" />
  <g transform="translate(0, 4)">
    <circle cx="40" cy="38" r="12" fill="#0080C0" />
    <path d="M 40 38 A 12 12 0 0 1 52 38 A 9 9 0 0 0 40 38 Z" fill="#3399FF" opacity="0.5"/>
    <path d="M 40 52 C 22 52, 16 78, 16 84 L 64 84 C 64 78, 58 52, 40 52 Z" fill="#0080C0" />
    <path d="M 40 52 C 27 52, 20 68, 18 78 C 25 65, 36 56, 40 56 C 44 56, 55 65, 62 78 C 60 68, 53 52, 40 52 Z" fill="#3399FF" opacity="0.5"/>
    <circle cx="62" cy="44" r="12" fill="#74C322" />
    <path d="M 62 44 A 12 12 0 0 1 74 44 A 9 9 0 0 0 62 44 Z" fill="#9CE146" opacity="0.6"/>
    <path d="M 62 58 C 44 58, 38 84, 38 90 L 86 90 C 86 84, 80 58, 62 58 Z" fill="#74C322" stroke="${bgFill}" stroke-width="2" />
    <path d="M 62 58 C 44 58, 42 74, 40 84 C 47 71, 58 62, 62 62 C 66 62, 77 71, 84 84 C 82 74, 75 58, 62 58 Z" fill="#9CE146" opacity="0.5"/>
  </g>
</svg>`;

    return 'data:image/svg+xml;utf8,' + encodeURIComponent(msnAvatarSvg);
  }

  // Real-time aviation clock
  currentTimeString = signal<string>('');

  // Dropdowns & Modals states
  public isDropdownOpen = signal<boolean>(false);
  public isMatrixOptionsOpen = signal<boolean>(false);
  public isNotificationOpen = signal<boolean>(false);
  public isAuthModalOpen = signal<boolean>(false);
  public authMode = signal<'LOGIN' | 'SIGNUP'>('LOGIN');
  public isImportModalOpen = signal<boolean>(false);
  public isDbModalOpen = signal<boolean>(false);

  // Database Connection Indicator
  dbStatus = signal<'checking' | 'connected' | 'error'>('connected');

  // Toast System
  toastMessage = signal<string | null>(null);

  // Paintbrush Mass Edit Mode
  showPaintbrushPanel = signal<boolean>(false);
  activePaintbrush = signal<string | null>(null);

  // Row-level inline editing signals
  editingRowCollabId = signal<string | null>(null);
  editingRowScaleDraft = signal<{ [day: number]: string }>({});

  // Filter systems
  collabSearchQuery = signal<string>('');
  selectedFilterRole = signal<string>('TODOS');
  selectedFilterSector = signal<string>('TODOS');
  selectedFilterShift = signal<string>('TODOS');

  // Dynamic database-driven filter options (Single Source of Truth)
  availableSectors = computed(() => {
    const collabs = this.scaleService.collaborators();
    const sectorsSet = new Set<string>(['Geral']);
    collabs.forEach(c => {
      if (c.sector) {
        const s = c.sector.trim();
        if (s) sectorsSet.add(s);
      }
    });
    return Array.from(sectorsSet).sort((a, b) => a.localeCompare(b));
  });

  availableRoles = computed(() => {
    const collabs = this.scaleService.collaborators();
    const rolesSet = new Set<string>(['OPERADOR', 'LIDER', 'SUPERVISOR']);
    collabs.forEach(c => {
      if (c.role) {
        const r = c.role.trim();
        if (r) rolesSet.add(r);
      }
    });
    return Array.from(rolesSet).sort((a, b) => a.localeCompare(b));
  });

  availableShifts = computed(() => {
    return this.scaleService.shiftTypes();
  });

  // Dedicated filters and sorting for "Quadro de Colaboradores" admin table
  adminSearchQuery = signal<string>('');
  adminFilterRole = signal<string>('TODOS');
  adminFilterShift = signal<string>('TODOS');
  adminSortOrder = signal<'asc' | 'desc'>('asc');

  // Computed stats counters
  collaboratorsCountByShift = computed(() => {
    const collabs = this.scaleService.collaborators();
    const counts: { [key: string]: number } = { 'MANHÃ': 0, 'TARDE': 0, 'MADRUGADA': 0, 'ADMINISTRATIVO': 0, 'NOITE': 0 };
    collabs.forEach(c => {
      const s = (c.shift || '').toUpperCase().trim();
      if (s in counts) {
        counts[s]++;
      }
    });
    // Group MADRUGADA into NOITE
    counts['NOITE'] += counts['MADRUGADA'];
    counts['MADRUGADA'] = 0;
    return counts;
  });

  collaboratorsCountBySector = computed(() => {
    const collabs = this.scaleService.collaborators();
    const counts: { [key: string]: number } = {
      'GERAL': 0,
      'GESTÃO': 0,
      'CENTRAL': 0,
      'AERÓDROMO': 0,
      'VIP': 0,
      'TESTE': 0,
      'MANUTENÇÃO': 0
    };
    collabs.forEach(c => {
      let s = (c.sector || '').toUpperCase().trim();
      if (s === 'GESTAO') s = 'GESTÃO';
      if (s === 'MANUTENCAO') s = 'MANUTENÇÃO';
      if (s === 'AERODROMO') s = 'AERÓDROMO';
      if (s) {
        if (s in counts) {
          counts[s]++;
        } else {
          counts[s] = 1;
        }
      }
    });
    return counts;
  });

  // Month Selection and Navigation System
  monthsList = [
    { name: 'Janeiro', shortName: 'JAN' },
    { name: 'Fevereiro', shortName: 'FEV' },
    { name: 'Março', shortName: 'MAR' },
    { name: 'Abril', shortName: 'ABR' },
    { name: 'Maio', shortName: 'MAI' },
    { name: 'Junho', shortName: 'JUN' },
    { name: 'Julho', shortName: 'JUL' },
    { name: 'Agosto', shortName: 'AGO' },
    { name: 'Setembro', shortName: 'SET' },
    { name: 'Outubro', shortName: 'OUT' },
    { name: 'Novembro', shortName: 'NOV' },
    { name: 'Dezembro', shortName: 'DEZ' }
  ];

  selectedMonthIndex = signal<number>(new Date().getMonth());
  currentYear = signal<number>(new Date().getFullYear());
  isMonthPickerOpen = signal<boolean>(false);
  showFilters = signal<boolean>(false);

  // Computed properties for the active month
  currentMonthName = computed(() => this.monthsList[this.selectedMonthIndex()].name);
  
  activeFiltersCount = computed(() => {
    let count = 0;
    if (this.collabSearchQuery().trim() !== '') count++;
    if (this.selectedFilterRole() !== 'TODOS') count++;
    if (this.selectedFilterSector() !== 'TODOS') count++;
    if (this.selectedFilterShift() !== 'TODOS') count++;
    return count;
  });

  // Days list for the selected month dynamically calculated as a signal
  daysInMonth = computed(() => {
    const year = this.currentYear();
    const month = this.selectedMonthIndex();
    const count = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  });

  isWorkStatus(code: string | undefined | null): boolean {
    if (!code) return false;
    const upper = code.trim().toUpperCase();
    if (upper === '-' || upper === '' || upper === '?') return false;
    
    // If it is marked as an absence sigla, it is not a working status
    if (this.isSiglaAbsence(upper)) {
      return false;
    }
    
    // Numbers or shift abbreviations (e.g., M, T, N, ADM) are considered present
    return true;
  }

  dailyWorkingCounts = computed(() => {
    const collabs = this.filteredCollaborators();
    const days = this.daysInMonth();
    const counts: { [day: number]: number } = {};
    
    days.forEach(day => {
      let count = 0;
      collabs.forEach(collab => {
        const rawVal = collab.scale[day] || '-';
        const val = (rawVal === '-') ? this.getShiftCode(collab.shift) : rawVal;
        if (this.isWorkStatus(val)) {
          count++;
        }
      });
      counts[day] = count;
    });
    return counts;
  });

  prevMonth(): void {
    const prev = (this.selectedMonthIndex() - 1 + 12) % 12;
    this.selectedMonthIndex.set(prev);
    this.isMonthPickerOpen.set(false);
  }

  nextMonth(): void {
    const next = (this.selectedMonthIndex() + 1) % 12;
    this.selectedMonthIndex.set(next);
    this.isMonthPickerOpen.set(false);
  }

  selectMonth(index: number): void {
    this.selectedMonthIndex.set(index);
    this.isMonthPickerOpen.set(false);
  }

  // Notifications State
  notifications = signal<AppNotification[]>([
    {
      id: 'n_1',
      type: 'publish',
      message: 'Escala oficial de trabalho publicada para Junho de this.currentYear().',
      timestamp: 'Hoje, 10:15',
      read: false
    },
    {
      id: 'n_2',
      type: 'alert',
      message: 'Aviso: Baixo efetivo no turno da Noite para o Setor Aeródromo.',
      timestamp: 'Hoje, 08:30',
      read: false
    },
    {
      id: 'n_3',
      type: 'trade',
      message: 'Everton Souza solicitou uma permuta de turno com Carlos Alberto para o dia 12.',
      timestamp: 'Ontem, 16:45',
      read: true
    }
  ]);

  // Unread notifications counter
  unreadNotificationsCount = computed(() => {
    return this.notifications().filter(n => !n.read).length;
  });

  // Shift manager editing state
  newShiftCode = signal<string>('');
  newShiftLabel = signal<string>('');
  newShiftHours = signal<string>('7h20');
  newShiftColor = signal<string>('#3b82f6');
  newShiftTextColor = signal<string>('#ffffff');
  editingShiftCode = signal<string | null>(null);

  // Sigla manager editing state
  newSiglaCode = signal<string>('');
  newSiglaLabel = signal<string>('');
  newSiglaColor = signal<string>('#64748b');
  newSiglaTextColor = signal<string>('#ffffff');
  newSiglaDescription = signal<string>('');
  newSiglaComputaAusencia = signal<boolean>(false);
  editingSiglaCode = signal<string | null>(null);

  // New collaborator photo upload state
  newCollabPhotoData = signal<string | null>(null);

  // Lists for hour and minute dropdowns
  hoursList = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Hour/Minute selectors for shift creation/editing
  startHour = signal<string>('07');
  startMinute = signal<string>('00');
  endHour = signal<string>('16');
  endMinute = signal<string>('00');

  // Computed signal to calculate shift duration automatically (Entrance vs Exit)
  calculatedShiftHours = computed(() => {
    const sH = parseInt(this.startHour(), 10) || 0;
    const sM = parseInt(this.startMinute(), 10) || 0;
    const eH = parseInt(this.endHour(), 10) || 0;
    const eM = parseInt(this.endMinute(), 10) || 0;

    let totalMinutes = 0;
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;

    if (endTotal >= startTotal) {
      totalMinutes = endTotal - startTotal;
    } else {
      // Crosses midnight (e.g. 22:00 to 06:00)
      totalMinutes = (24 * 60 - startTotal) + endTotal;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const padMin = minutes.toString().padStart(2, '0');
    return `${hours}h${padMin}`;
  });

  // Selected collaborator and target shift for quick reallocation
  assignmentCollabId = signal<string>('');
  assignmentShiftCode = signal<string>('');

  // Portal do Colaborador (Frente C)
  selectedSimulatedCollabId = signal<string | null>(null);
  hasInitiallyLogged = signal<boolean>(false);
  collaboratorProfileDarkMode = signal<boolean>(true);

  // Permuta (Trade Shift) simulation state
  isPermutaModalOpen = signal<boolean>(false);
  permutaSelectedDay = signal<number>(1);
  permutaTargetCollabId = signal<string>('');
  permutaStatusMessage = signal<string>('');

  // Gemini Upload & Scan
  importingState = signal<'idle' | 'processing' | 'done'>('idle');
  scannedTextResult = signal<string>('');
  scannedDataParsed = signal<any[]>([]);
  unrecognizedCodes = signal<string[]>([]);

  constructor() {
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);
    this.showToast('Escala Easy VIBRA - Protótipo MVP Pronto');
    if (typeof document !== 'undefined') {
      document.body.classList.add('light-theme');
    }
    effect(() => {
      const collabs = this.scaleService.collaborators();
      if (collabs.length > 0 && !this.hasInitiallyLogged()) {
        // Auto select/log in the first collaborator only once at startup
        this.selectedSimulatedCollabId.set(collabs[0].id);
        this.hasInitiallyLogged.set(true);
      }
    });

    effect(() => {
      const month = this.selectedMonthIndex() + 1;
      this.scaleService.activeMonth.set(month);
      this.scaleService.activeYear.set(this.currentYear()); // Standard this.currentYear() year for UI
      if (this.scaleService.activeDb() === 'supabase') {
        this.scaleService.syncSupabase();
      }
    }, { allowSignalWrites: true });
  }

  // Clock Update Function
  private updateClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    this.currentTimeString.set(`${hh}:${mm}:${ss} BRT`);
  }

  // Toast Functionality
  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }

  // Role Simulator
  changeRole(role: 'SUPERVISOR' | 'LIDER' | 'OPERADOR') {
    this.scaleService.currentRole.set(role);
    this.showToast(`Perfil alterado para: ${role === 'LIDER' ? 'LÍDER DE TURNO' : role}`);
  }

  // Presentation Mode: Focus only on Night Shift ("Noite / Madrugada / N")
  onlyNightShift = signal<boolean>(true);

  unlockAllShifts(pin: string) {
    const cleanPin = (pin || '').trim().toLowerCase();
    if (cleanPin === 'vibra' || cleanPin === 'admin' || cleanPin === '1234' || cleanPin === 'noite') {
      this.onlyNightShift.set(false);
      this.showToast('Sucesso: Escalas de todos os turnos liberadas!');
    } else {
      this.showToast('Erro: PIN incorreto. Dica: Tente "vibra", "admin" ou "1234".');
    }
  }

  lockToNightShift() {
    this.onlyNightShift.set(true);
    this.showToast('Visualização restrita ao turno da Noite.');
  }

  // Filters computed list with custom ordering: LTs, Aeródromo, VIP's
  filteredCollaborators = computed(() => {
    const query = this.collabSearchQuery().toLowerCase().trim();
    const role = this.selectedFilterRole();
    const sector = this.selectedFilterSector();
    const shift = this.selectedFilterShift();
    const onlyNight = this.onlyNightShift();

    const filtered = this.scaleService.collaborators().filter(c => {
      // If presentation mode is restricted, filter only Night Shift
      if (onlyNight) {
        const cShift = (c.shift || '').toUpperCase().trim();
        const isNight = cShift === 'MADRUGADA' || cShift === 'NOITE' || cShift === 'N';
        if (!isNight) return false;
      }

      const matchesSearch = c.name.toLowerCase().includes(query) || c.group.toLowerCase().includes(query);
      const matchesRole = role === 'TODOS' || 
        (c.role || '').toUpperCase().trim() === role.toUpperCase().trim();
      const normCollabSector = (c.sector || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const normFilterSector = sector.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const matchesSector = sector === 'TODOS' || normCollabSector === normFilterSector;
      const matchesShift = shift === 'TODOS' || 
        (c.shift || '').toUpperCase().trim() === shift.toUpperCase().trim();
      return matchesSearch && matchesRole && matchesSector && matchesShift;
    });

    const sorted = [...filtered];
    sorted.sort((a, b) => {
      const getWeight = (c: any) => {
        if (c.role === 'LIDER') return 1; // LTs first
        const sec = (c.sector || '').toUpperCase().trim();
        if (sec === 'GERAL') return 2;
        if (sec === 'GESTÃO' || sec === 'GESTAO') return 3;
        if (sec === 'CENTRAL') return 4;
        if (sec === 'AERÓDROMO' || sec === 'AERODROMO') return 5;
        if (sec === 'VIP') return 6;
        if (sec === 'TESTE') return 7;
        if (sec === 'MANUTENÇÃO' || sec === 'MANUTENCAO') return 8;
        return 9; // Others
      };
      const wA = getWeight(a);
      const wB = getWeight(b);
      if (wA !== wB) return wA - wB;
      // Secondary sort alphabetically
      return a.name.localeCompare(b.name, 'pt-BR');
    });

    return sorted;
  });

  filteredCounts = computed(() => {
    const list = this.filteredCollaborators();
    const operadores = list.filter(c => c.role === 'OPERADOR').length;
    const lts = list.filter(c => c.role === 'LIDER').length;
    const vips = list.filter(c => {
      const sec = (c.sector || '').toUpperCase();
      return sec === 'VIP';
    }).length;
    return { operadores, lts, vips };
  });

  getCollabFunction(collab: any): string {
    if (!collab) return 'Operador';
    if (collab.role === 'LIDER') return 'LT';
    if (collab.role === 'SUPERVISOR') return 'Supervisor';
    if (collab.sector) {
      const sec = collab.sector.trim();
      if (sec.toUpperCase() === 'VIP') return 'VIP';
      return sec.charAt(0).toUpperCase() + sec.slice(1);
    }
    return collab.role || 'Operador';
  }

  getFunctionBadgeClass(collab: any): string {
    if (!collab) return 'text-slate-400';
    const isLight = this.isLightTheme();
    if (collab.role === 'LIDER') {
      return isLight ? 'text-amber-700' : 'text-amber-400';
    }
    if (collab.role === 'SUPERVISOR') {
      return isLight ? 'text-purple-700' : 'text-purple-400';
    }
    const sec = (collab.sector || '').toUpperCase().trim();
    if (sec === 'VIP') {
      return isLight ? 'text-cyan-700' : 'text-cyan-400';
    }
    if (sec === 'AERÓDROMO' || sec === 'AERODROMO') {
      return isLight ? 'text-emerald-700' : 'text-emerald-400';
    }
    if (sec === 'GESTÃO' || sec === 'GESTAO') {
      return isLight ? 'text-blue-700' : 'text-blue-400';
    }
    if (sec === 'CENTRAL') {
      return isLight ? 'text-indigo-700' : 'text-indigo-400';
    }
    if (sec === 'GERAL') {
      return isLight ? 'text-teal-700' : 'text-teal-400';
    }
    if (sec === 'TESTE') {
      return isLight ? 'text-rose-700' : 'text-rose-400';
    }
    if (sec === 'MANUTENÇÃO' || sec === 'MANUTENCAO') {
      return isLight ? 'text-orange-700' : 'text-orange-400';
    }
    return isLight ? 'text-slate-700' : 'text-slate-300';
  }

  // Filters computed list for Login Selection
  loginCollaborators = computed(() => {
    const onlyNight = this.onlyNightShift();
    return this.scaleService.collaborators().filter(c => {
      if (onlyNight) {
        const cShift = (c.shift || '').toUpperCase().trim();
        return cShift === 'MADRUGADA' || cShift === 'NOITE' || cShift === 'N';
      }
      return true;
    });
  });

  // Filters computed list for Admin Management with sorting, searching, and custom filters
  adminCollaborators = computed(() => {
    const query = this.adminSearchQuery().toLowerCase().trim();
    const role = this.adminFilterRole();
    const shift = this.adminFilterShift();
    const sort = this.adminSortOrder();
    const onlyNight = this.onlyNightShift();

    let list = this.scaleService.collaborators().filter(c => {
      if (onlyNight) {
        const cShift = (c.shift || '').toUpperCase().trim();
        const isNight = cShift === 'MADRUGADA' || cShift === 'NOITE' || cShift === 'N';
        if (!isNight) return false;
      }

      const matchesSearch = !query || 
        c.name.toLowerCase().includes(query) || 
        c.role.toLowerCase().includes(query) || 
        c.shift.toLowerCase().includes(query) || 
        c.sector.toLowerCase().includes(query);

      const matchesRole = role === 'TODOS' || 
        (c.role || '').toUpperCase().trim() === role.toUpperCase().trim();
      const matchesShift = shift === 'TODOS' || 
        (c.shift || '').toUpperCase().trim() === shift.toUpperCase().trim();

      return matchesSearch && matchesRole && matchesShift;
    });

    list.sort((a, b) => {
      const nameA = a.name.localeCompare(b.name, 'pt-BR');
      return sort === 'asc' ? nameA : -nameA;
    });

    return list;
  });

  // Get Day of Week Name
  getDayOfWeekLabel(day: number): string {
    const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
    const startDay = new Date(this.currentYear(), this.selectedMonthIndex(), 1).getDay();
    const index = (day - 1 + startDay) % 7; 
    return weekDays[index];
  }

  isDayWeekend(day: number): boolean {
    const startDay = new Date(this.currentYear(), this.selectedMonthIndex(), 1).getDay();
    const index = (day - 1 + startDay) % 7;
    return index === 6 || index === 0; // Saturday & Sunday
  }

  isDayHoliday(day: number): boolean {
    const month = this.selectedMonthIndex(); // 0-indexed (0 = Jan, 11 = Dec)
    if (month === 0 && day === 1) return true; // Ano Novo
    if (month === 3 && (day === 3 || day === 21)) return true; // Sexta-feira Santa, Tiradentes
    if (month === 4 && day === 1) return true; // Dia do Trabalho
    if (month === 5 && day === 4) return true; // Corpus Christi
    if (month === 8 && day === 7) return true; // Independência
    if (month === 9 && day === 12) return true; // Padroeira do Brasil
    if (month === 10 && (day === 2 || day === 15 || day === 20)) return true; // Finados, Proclamação da República, Consciência Negra
    if (month === 11 && day === 25) return true; // Natal
    return false;
  }

  isDaySpecial(day: number): boolean {
    return this.isDayWeekend(day) || this.isDayHoliday(day);
  }

  isToday(day: number): boolean {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === this.selectedMonthIndex() &&
           today.getFullYear() === this.currentYear();
  }

  getOffsetDaysArray(): number[] {
    const startDay = new Date(this.currentYear(), this.selectedMonthIndex(), 1).getDay();
    return Array.from({ length: startDay }, (_, i) => i);
  }

  getSpecialEventsForDay(collab: any, day: number): { icon: string; color: string; tooltip: string; shortLabel: string }[] {
    const events: { icon: string; color: string; tooltip: string; shortLabel: string }[] = [];
    if (!collab) return events;

    // 1. Birthday (Active selected month)
    if (collab.birthday) {
      const parts = collab.birthday.split('-');
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (m === (this.selectedMonthIndex() + 1) && d === day) {
          events.push({
            icon: 'cake',
            color: '#f43f5e', // pink/rose
            tooltip: `Aniversário de ${collab.name}`,
            shortLabel: 'Aniversário'
          });
        }
      }
    }

    // 2. Special Dates (Active selected month)
    if (collab.specialDates && Array.isArray(collab.specialDates)) {
      for (const sd of collab.specialDates) {
        if (!sd.date || !sd.description) continue;
        const parts = sd.date.split('-');
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (m === (this.selectedMonthIndex() + 1) && d === day) {
            const descLower = sd.description.toLowerCase();
            let icon = 'celebration';
            let color = '#f59e0b'; // amber
            let shortLabel = 'Especial';
            
            if (descLower.includes('casamento') || descLower.includes('aliança') || descLower.includes('alianca') || descLower.includes('wedding') || descLower.includes('bodas') || descLower.includes('marido') || descLower.includes('esposa') || descLower.includes('conjuge') || descLower.includes('cônjuge') || descLower.includes('noivado')) {
              icon = 'favorite'; // Heart icon representing marriage/anniversary/wedding
              color = '#e11d48'; // red-rose
              shortLabel = 'Casamento';
            } else if (descLower.includes('filho') || descLower.includes('filha') || descLower.includes('criança') || descLower.includes('crianca') || descLower.includes('bebe') || descLower.includes('bebê') || descLower.includes('nascimento') || descLower.includes('child') || descLower.includes('baby') || descLower.includes('maternidade') || descLower.includes('paternidade')) {
              icon = 'child_care';
              color = '#38bdf8'; // sky blue
              shortLabel = 'Família';
            } else if (descLower.includes('aniversário') || descLower.includes('aniversario') || descLower.includes('niver') || descLower.includes('bday') || descLower.includes('nasc')) {
              icon = 'cake';
              color = '#ec4899'; // pink
              shortLabel = 'Níver';
            } else if (descLower.includes('casa') || descLower.includes('mudança') || descLower.includes('mudanca') || descLower.includes('home') || descLower.includes('família') || descLower.includes('familia')) {
              icon = 'home';
              color = '#10b981'; // emerald
              shortLabel = 'Lar';
            } else if (descLower.includes('formatura') || descLower.includes('estudo') || descLower.includes('prova') || descLower.includes('aula') || descLower.includes('escola') || descLower.includes('faculdade')) {
              icon = 'school';
              color = '#6366f1'; // indigo
              shortLabel = 'Estudo';
            }

            events.push({
              icon,
              color,
              tooltip: `${sd.description} (Prioridade ${sd.priority})`,
              shortLabel
            });
          }
        }
      }
    }

    return events;
  }

  // Notification methods
  markAllNotificationsAsRead() {
    this.notifications.set(this.notifications().map(n => ({ ...n, read: true })));
    this.showToast('Todas as notificações marcadas como lidas.');
  }

  markNotificationAsRead(id: string) {
    this.notifications.set(this.notifications().map(n => n.id === id ? { ...n, read: true } : n));
  }

  // Paintbrush logic
  togglePaintbrushPanel() {
    this.showPaintbrushPanel.set(!this.showPaintbrushPanel());
    if (!this.showPaintbrushPanel()) {
      this.activePaintbrush.set(null);
    } else {
      this.showToast('Modo de Pintura Ativado: Clique em uma sigla e depois na célula da escala');
    }
  }

  selectPaintbrush(code: string) {
    this.activePaintbrush.set(code);
    this.showToast(`Pincel ativo: ${code}. Clique nas células para aplicar.`);
  }

  applyPaintbrush(collabId: string, day: number) {
    if (this.scaleService.currentRole() === 'OPERADOR') {
      this.showToast('Acesso negado: Apenas Líder ou Supervisor pode alterar escalas.');
      return;
    }

    const brush = this.activePaintbrush();
    if (!brush) return;

    const collab = this.scaleService.collaborators().find(c => c.id === collabId);
    if (collab) {
      const updatedCollab = {
        ...collab,
        scale: { ...collab.scale, [day]: brush }
      };
      this.scaleService.updateCollaborator(updatedCollab);
    }
  }

  // Row-level inline scale editing methods
  startRowScaleEdit(collab: Collaborator) {
    if (this.scaleService.currentRole() === 'OPERADOR') {
      this.showToast('Acesso negado: Apenas Líder ou Supervisor pode alterar escalas.');
      return;
    }
    // Automatically open the paintbrush panel so the user has the acronyms toolbar visible at the top
    this.showPaintbrushPanel.set(true);

    this.editingRowCollabId.set(collab.id);
    this.editingRowScaleDraft.set({ ...collab.scale });
    this.showToast(`Edição da linha de ${collab.name}. Selecione uma sigla no painel do topo e clique nos dias correspondentes.`);
  }

  cancelRowScale() {
    this.editingRowCollabId.set(null);
    this.editingRowScaleDraft.set({});
    this.showToast('Edição de linha cancelada.');
  }

  updateDraftCell(day: number, value: string) {
    this.editingRowScaleDraft.update(draft => ({ ...draft, [day]: value }));
  }

  paintDraftCell(day: number) {
    const active = this.activePaintbrush();
    if (!active) {
      this.showToast('Selecione um turno ou sigla no painel do topo para pintar.');
      return;
    }
    this.updateDraftCell(day, active);
  }

  saveRowScale(collab: Collaborator) {
    if (this.scaleService.currentRole() === 'OPERADOR') {
      this.showToast('Acesso negado.');
      return;
    }

    const draft = this.editingRowScaleDraft();
    const updatedCollab = {
      ...collab,
      scale: draft
    };

    this.scaleService.updateCollaborator(updatedCollab);
    this.editingRowCollabId.set(null);
    this.editingRowScaleDraft.set({});
    this.showToast(`Escala da linha de ${collab.name} salva com sucesso!`);

    this.scaleService.addAuditHistory(
      'EDITAR_ESCALA_LINHA',
      `Escala mensal do colaborador ${collab.name} editada via controle de linha direta.`
    );
  }

  // Manage custom shifts
  startEditingShift(shift: ShiftType) {
    this.editingShiftCode.set(shift.code);
    this.newShiftCode.set(shift.code);
    this.newShiftLabel.set(shift.label);
    this.newShiftHours.set(shift.hours);
    this.newShiftColor.set(shift.color);
    this.newShiftTextColor.set(shift.textColor || '#ffffff');
    
    // Parse startTime & endTime
    if (shift.startTime) {
      const parts = shift.startTime.split(':');
      if (parts.length === 2) {
        this.startHour.set(parts[0]);
        this.startMinute.set(parts[1]);
      }
    } else {
      this.startHour.set('07');
      this.startMinute.set('00');
    }

    if (shift.endTime) {
      const parts = shift.endTime.split(':');
      if (parts.length === 2) {
        this.endHour.set(parts[0]);
        this.endMinute.set(parts[1]);
      }
    } else {
      this.endHour.set('16');
      this.endMinute.set('00');
    }

    this.showToast(`Editando o turno "${shift.code}". Modifique os campos desejados.`);
  }

  cancelEditingShift() {
    this.editingShiftCode.set(null);
    this.newShiftCode.set('');
    this.newShiftLabel.set('');
    this.newShiftHours.set('7h20');
    this.newShiftColor.set('#3b82f6');
    this.newShiftTextColor.set('#ffffff');
    this.startHour.set('07');
    this.startMinute.set('00');
    this.endHour.set('16');
    this.endMinute.set('00');
  }

  saveShiftType() {
    const code = this.newShiftCode().trim().toUpperCase();
    const label = this.newShiftLabel().trim();
    if (!code || !label) {
      this.showToast('Erro: Código e Nome do turno são obrigatórios.');
      return;
    }

    const calculatedHours = this.calculatedShiftHours();
    const sTime = `${this.startHour()}:${this.startMinute()}`;
    const eTime = `${this.endHour()}:${this.endMinute()}`;

    const editCode = this.editingShiftCode();
    if (editCode) {
      // Edit existing shift type
      const targetShift = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === editCode);
      if (targetShift) {
        const updatedShift: ShiftType = {
          ...targetShift,
          label,
          hours: calculatedHours,
          color: this.newShiftColor(),
          textColor: this.newShiftTextColor(),
          startTime: sTime,
          endTime: eTime
        };
        this.scaleService.saveShiftType(updatedShift);
      }
      this.cancelEditingShift();
      this.showToast(`Turno "${code}" atualizado com sucesso.`);
      this.scaleService.addAuditHistory('EDITAR_TURNO', `Turno "${code}" editado pelo gestor.`);
    } else {
      // Create new shift type
      const exists = this.scaleService.shiftTypes().some(s => s.code.trim().toUpperCase() === code);
      if (exists) {
        this.showToast('Erro: Código de turno já cadastrado.');
        return;
      }

      const newShift: ShiftType = {
        code,
        label,
        hours: calculatedHours,
        color: this.newShiftColor(),
        textColor: this.newShiftTextColor(),
        startTime: sTime,
        endTime: eTime
      };

      this.scaleService.saveShiftType(newShift);
      this.cancelEditingShift();
      this.showToast(`Novo turno "${code}" criado com sucesso.`);
      this.scaleService.addAuditHistory('CRIAR_TURNO', `Novo turno "${code}" criado pelo gestor.`);
    }
  }

  removeShiftType(code: string) {
    // Check if any collaborator is currently assigned to this shift as their primary default shift
    const assignedCollabCount = this.getCollaboratorCountForShift(code);
    if (assignedCollabCount > 0) {
      this.showToast(`Erro: Há ${assignedCollabCount} colaborador(es) alocado(s) neste turno. Realoque-os primeiro.`);
      return;
    }

    this.scaleService.removeShiftType(code);
    this.showToast(`Sigla "${code}" removida.`);
    this.scaleService.addAuditHistory('REMOCAO_TURNO', `Turno com código "${code}" removido.`);
  }

  // Get real-time statistics for shift types
  getCollaboratorCountForShift(shiftCode: string): number {
    return this.scaleService.collaborators().filter(c => c.shift === shiftCode).length;
  }

  getScheduledDaysCountForShift(shiftCode: string): number {
    let count = 0;
    const days = this.daysInMonth();
    this.scaleService.collaborators().forEach(c => {
      const defaultCode = this.getShiftCode(c.shift);
      days.forEach(day => {
        const rawVal = c.scale[day] || '-';
        const val = (rawVal === '-') ? defaultCode : rawVal;
        if (val.trim().toUpperCase() === shiftCode.trim().toUpperCase()) {
          count++;
        }
      });
    });
    return count;
  }

  // Sigla management methods
  startEditingSigla(sigla: any) {
    this.editingSiglaCode.set(sigla.code);
    this.newSiglaCode.set(sigla.code);
    this.newSiglaLabel.set(sigla.label);
    this.newSiglaColor.set(sigla.color);
    this.newSiglaTextColor.set(sigla.textColor || '#ffffff');
    this.newSiglaDescription.set(sigla.description || '');
    this.newSiglaComputaAusencia.set(!!sigla.computaAusencia);
    this.showToast(`Editando a sigla "${sigla.code}". Modifique os campos desejados.`);
  }

  cancelEditingSigla() {
    this.editingSiglaCode.set(null);
    this.newSiglaCode.set('');
    this.newSiglaLabel.set('');
    this.newSiglaColor.set('#64748b');
    this.newSiglaTextColor.set('#ffffff');
    this.newSiglaDescription.set('');
    this.newSiglaComputaAusencia.set(false);
  }

  async saveSiglaType() {
    const code = this.newSiglaCode().trim().toUpperCase();
    const label = this.newSiglaLabel().trim();
    const color = this.newSiglaColor();
    const textColor = this.newSiglaTextColor();
    const desc = this.newSiglaDescription().trim();
    const computaAusencia = this.newSiglaComputaAusencia();

    if (!code || !label) {
      this.showToast('Erro: Código e Nome da sigla são obrigatórios.');
      return;
    }

    const oldCode = this.editingSiglaCode();

    try {
      if (oldCode) {
        // Edit existing
        if (oldCode !== code) {
          // Code changed! Check if new code already exists
          const codeExists = this.scaleService.siglaTypes().some(s => s.code.trim().toUpperCase() === code) ||
                             this.scaleService.shiftTypes().some(sh => sh.code.trim().toUpperCase() === code);
          if (codeExists) {
            this.showToast(`Erro: O código "${code}" já está em uso por outra sigla ou turno.`);
            return;
          }

          this.scaleService.isProcessing.set(true);
          // Call service to rename the code and update all reference scales
          await this.scaleService.updateSiglaTypeCode(oldCode, { code, label, color, description: desc, textColor, computaAusencia });
          this.scaleService.addAuditHistory('EDICAO_SIGLA_CODIGO', `Sigla "${oldCode}" renomeada para "${code}" pelo gestor.`);
          this.showToast(`Sigla "${oldCode}" alterada para "${code}" com sucesso.`);
        } else {
          // Standard edit of existing sigla
          const sigla = this.scaleService.siglaTypes().find(s => s.code.trim().toUpperCase() === oldCode);
          if (sigla) {
            const updatedSigla = { ...sigla, label, color, description: desc, textColor, computaAusencia };
            this.scaleService.isProcessing.set(true);
            await this.scaleService.saveSiglaType(updatedSigla);
            this.scaleService.addAuditHistory('EDICAO_SIGLA', `Sigla "${code}" editada pelo gestor.`);
            this.showToast(`Sigla "${code}" atualizada com sucesso.`);
          }
        }
        this.cancelEditingSigla();
      } else {
        // Create new
        const codeExists = this.scaleService.siglaTypes().some(s => s.code.trim().toUpperCase() === code) ||
                           this.scaleService.shiftTypes().some(sh => sh.code.trim().toUpperCase() === code);
        if (codeExists) {
          this.showToast('Erro: Código de sigla já cadastrado ou em uso por um turno.');
          return;
        }
        this.scaleService.isProcessing.set(true);
        await this.scaleService.addSiglaType(code, label, color, desc, textColor, computaAusencia);
        this.scaleService.addAuditHistory('CADASTRO_SIGLA', `Nova sigla "${code}" cadastrada.`);
        this.cancelEditingSigla();
        this.showToast(`Sigla "${code}" criada com sucesso.`);
      }
    } catch (err: any) {
      console.error('Error in saveSiglaType:', err);
      this.showToast(`Erro ao salvar sigla: ${err.message || err}`);
    } finally {
      this.scaleService.isProcessing.set(false);
    }
  }

  async removeSiglaType(code: string) {
    // Check if any scheduled days contain this sigla
    let count = 0;
    this.scaleService.collaborators().forEach(c => {
      Object.values(c.scale).forEach(val => {
        if (val === code) count++;
      });
    });

    if (count > 0) {
      const confirmForce = window.confirm(
        `A sigla "${code}" está sendo usada em ${count} dia(s) na escala atual.\n\n` +
        `Se você confirmar a exclusão, todos esses dias serão redefinidos para "-" (vazio/escala comum) e a sigla será removida definitivamente.\n\n` +
        `Deseja continuar com a exclusão?`
      );
      if (!confirmForce) return;

      this.scaleService.isProcessing.set(true);
      try {
        // Remove the sigla type itself and clear all references in the DB
        await this.scaleService.removeSiglaType(code, true);

        // Also ensure local collaborator scale states are updated
        const updatedCollabs = this.scaleService.collaborators().map(collab => {
          const updatedScale = { ...collab.scale };
          let changed = false;
          for (let d = 1; d <= 31; d++) {
            if (updatedScale[d] === code) {
              updatedScale[d] = '-';
              changed = true;
            }
          }
          return changed ? { ...collab, scale: updatedScale } : collab;
        });
        this.scaleService.collaborators.set(updatedCollabs);

        this.scaleService.addAuditHistory('REMOCAO_SIGLA_EM_USO', `Sigla "${code}" excluída e ${count} referências limpas na escala.`);
        this.showToast(`Sigla "${code}" e suas ${count} referências na escala foram excluídas com sucesso.`);
      } catch (err: any) {
        console.error('Error removing sigla in use:', err);
        this.showToast(`Erro ao excluir sigla: ${err.message || err}`);
      } finally {
        this.scaleService.isProcessing.set(false);
      }
    } else {
      const confirmDelete = window.confirm(`Deseja realmente excluir a sigla "${code}"?`);
      if (!confirmDelete) return;

      this.scaleService.isProcessing.set(true);
      try {
        await this.scaleService.removeSiglaType(code, false);
        this.scaleService.addAuditHistory('REMOCAO_SIGLA', `Sigla "${code}" excluída do sistema.`);
        this.showToast(`Sigla "${code}" excluída com sucesso.`);
      } catch (err: any) {
        console.error('Error removing sigla:', err);
        this.showToast(`Erro ao excluir sigla: ${err.message || err}`);
      } finally {
        this.scaleService.isProcessing.set(false);
      }
    }
  }

  // Dynamic colors for matrix rendering
  getShiftOrSiglaColor(code: string, day?: number): string {
    const upperCode = (code || '-').toUpperCase().trim();
    if (upperCode === '-' || upperCode === '?') {
      if (this.isLightTheme()) {
        return 'transparent';
      }
      return '#091524';
    }

    // Try finding in shiftTypes first
    const shift = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === upperCode || s.label.trim().toUpperCase() === upperCode);
    if (shift) {
      if (this.isLightTheme()) {
        return this.getLightVibrantColor(shift.color, upperCode);
      }
      return shift.color;
    }

    // Try finding in siglaTypes
    const sigla = this.scaleService.siglaTypes().find(s => s.code.trim().toUpperCase() === upperCode);
    if (sigla) {
      return sigla.color;
    }

    // Is it a numeric code like "7", "2", etc?
    const isNum = /^\d+$/.test(upperCode) || /^\d+[:.,hH]\d+$/.test(upperCode);
    if (isNum) {
      if (this.isLightTheme()) {
        return '#d1fae5'; // light emerald-100
      }
      return '#064e3b'; // dark emerald-900
    }

    // Standard Fallbacks if not registered in DB
    if (this.isLightTheme()) {
      if (upperCode === 'X') return '#f1f5f9';
      if (upperCode === 'F') return '#f59e0b';
      if (upperCode === 'LM') return '#ef4444';
      if (upperCode.startsWith('M')) return '#10b981';
      if (upperCode.startsWith('T')) return '#3b82f6';
      if (upperCode.startsWith('N')) return '#8b5cf6';
      if (upperCode === 'ADM') return '#06b6d4';
      return '#10b981';
    } else {
      if (upperCode === 'X') return '#475569';
      if (upperCode === 'F') return '#a855f7';
      if (upperCode === 'LM') return '#ef4444';
      return '#1e293b';
    }
  }

  getLightVibrantColor(dbColor: string, code: string): string {
    const hex = dbColor.replace('#', '').trim();
    // If database color is too dark, generate a beautiful vibrant one based on code name
    if (hex === '020813' || hex === '030a14' || hex === '071426' || hex === '000000' || hex.startsWith('0') || hex.startsWith('1')) {
      const upper = code.toUpperCase().trim();
      if (upper.startsWith('M')) return '#10b981';
      if (upper.startsWith('T')) return '#3b82f6';
      if (upper.startsWith('N')) return '#8b5cf6';
      if (upper === 'ADM') return '#06b6d4';
      if (upper === 'F') return '#f59e0b';
      if (upper === 'LM') return '#ef4444';
      
      let hash = 0;
      for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
      }
      const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#14b8a6', '#f43f5e'];
      return colors[Math.abs(hash) % colors.length];
    }
    return dbColor;
  }

  getShiftOrSiglaTextColor(code: string): string {
    const upperCode = (code || '-').toUpperCase().trim();
    if (upperCode === '-') {
      return '#475569';
    }
    if (upperCode === '?') {
      return '#ef4444';
    }

    // Try finding in shiftTypes first
    const shift = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === upperCode || s.label.trim().toUpperCase() === upperCode);
    if (shift && shift.textColor) {
      return shift.textColor;
    }

    // Try finding in siglaTypes
    const sigla = this.scaleService.siglaTypes().find(s => s.code.trim().toUpperCase() === upperCode);
    if (sigla && sigla.textColor) {
      return sigla.textColor;
    }

    // Is it a numeric code?
    const isNum = /^\d+$/.test(upperCode) || /^\d+[:.,hH]\d+$/.test(upperCode);
    if (isNum) {
      if (this.isLightTheme()) {
        return '#065f46'; // dark emerald text
      }
      return '#34d399'; // bright emerald text
    }

    if (this.isLightTheme()) {
      if (!sigla && !shift && upperCode === 'X') return '#334155';
    }

    return '#ffffff';
  }

  // Multi-employee Assignment & Movement logic
  assignEmployeeToShift() {
    const collabId = this.assignmentCollabId();
    const shiftCode = this.assignmentShiftCode();

    if (!collabId || !shiftCode) {
      this.showToast('Erro: Selecione um colaborador e o novo turno.');
      return;
    }

    const collab = this.scaleService.collaborators().find(c => c.id === collabId);
    const shiftType = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === shiftCode);

    if (!collab || !shiftType) {
      this.showToast('Erro: Seleção inválida.');
      return;
    }

    const oldShiftCode = collab.shift;

    const updatedScale = { ...collab.scale };
    for (let day = 1; day <= 30; day++) {
      if (updatedScale[day] === oldShiftCode) {
        updatedScale[day] = shiftCode;
      }
    }
    const updatedCollab = {
      ...collab,
      shift: shiftCode,
      hours: shiftType.hours,
      scale: updatedScale
    };

    this.scaleService.updateCollaborator(updatedCollab);
    this.showToast(`Colaborador ${collab.name} foi movido com sucesso para o turno "${shiftType.label}"!`);

    // Log this action to the official audit history
    this.scaleService.addAuditHistory(
      'ALOCACAO_TURNO',
      `Colaborador ${collab.name} movido do turno "${oldShiftCode}" para o turno "${shiftCode}" (${shiftType.hours}).`
    );

    // Reset fields
    this.assignmentCollabId.set('');
    this.assignmentShiftCode.set('');
  }

  // Auth Portal Simulation
  openAuthModal(mode: 'LOGIN' | 'SIGNUP') {
    this.authMode.set(mode);
    this.isAuthModalOpen.set(true);
  }

  submitAuth(nameInput: string, emailInput: string) {
    this.isAuthModalOpen.set(false);
    this.scaleService.selectedCollabName.set(nameInput || 'Anderson Pires');
    this.showToast(`Bem-vindo, ${nameInput || 'Anderson Pires'}! Autenticado com sucesso.`);
  }

  logout() {
    this.scaleService.selectedCollabName.set(null);
    this.selectedSimulatedCollabId.set(null);
    this.showToast('Sessão encerrada.');
  }

  loginAsCollab(id: string) {
    this.selectedSimulatedCollabId.set(id);
    const collab = this.scaleService.collaborators().find(c => c.id === id);
    if (collab) {
      this.scaleService.selectedCollabName.set(collab.name);
      this.scaleService.currentRole.set(collab.role);
      this.showToast(`Sessão simulada como ${collab.name}!`);
    } else {
      this.selectedSimulatedCollabId.set(null);
      this.scaleService.selectedCollabName.set('');
      this.scaleService.currentRole.set('SUPERVISOR');
    }
  }

  registerCollaborator(
    name: string,
    role: string,
    group: string,
    shift: string,
    sector: string,
    bh: number,
    score: number,
    photo?: string,
    birthday?: string,
    sd1Desc?: string, sd1Date?: string,
    sd2Desc?: string, sd2Date?: string,
    sd3Desc?: string, sd3Date?: string,
    sd4Desc?: string, sd4Date?: string,
    sd5Desc?: string, sd5Date?: string
  ) {
    const specialDates: SpecialDate[] = [];
    if (sd1Desc && sd1Date) specialDates.push({ description: sd1Desc, date: sd1Date, priority: 1 });
    if (sd2Desc && sd2Date) specialDates.push({ description: sd2Desc, date: sd2Date, priority: 2 });
    if (sd3Desc && sd3Date) specialDates.push({ description: sd3Desc, date: sd3Date, priority: 3 });
    if (sd4Desc && sd4Date) specialDates.push({ description: sd4Desc, date: sd4Date, priority: 4 });
    if (sd5Desc && sd5Date) specialDates.push({ description: sd5Desc, date: sd5Date, priority: 5 });

    const getShiftCode = (s: string): string => {
      const norm = (s || '').toUpperCase().trim();
      const st = this.scaleService.shiftTypes().find(x => x.code.toUpperCase().trim() === norm || x.label.toUpperCase().trim() === norm);
      return st ? st.code : norm;
    };

    const newShiftCode = getShiftCode(shift);
    const shiftType = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === newShiftCode);
    const newHours = shiftType ? shiftType.hours : (newShiftCode === 'ADM' ? '8h00' : '7h20');

    this.scaleService.addCollaborator(
      name,
      role,
      newHours,
      group,
      shift,
      sector,
      bh,
      score,
      photo,
      birthday,
      specialDates
    );
    this.isCollabModalOpen.set(false);
    this.isNewSectorMode.set(false);
    this.isNewRoleMode.set(false);
  }

  savePortalSpecialDates(birthday: string, specialDates: SpecialDate[]) {
    const collab = this.getLoggedCollab();
    if (!collab) {
      this.showToast('Selecione um colaborador na simulação primeiro.');
      return;
    }

    const validDates = specialDates.filter(d => d.date && d.description.trim());

    const updatedCollab: Collaborator = {
      ...collab,
      birthday: birthday || '',
      specialDates: validDates
    };

    this.scaleService.updateCollaborator(updatedCollab);
    this.showToast('Datas especiais atualizadas com sucesso!');
  }

  requestPortalFolga(date: string) {
    const collab = this.getLoggedCollab();
    if (!collab) {
      this.showToast('Selecione um colaborador na simulação primeiro.');
      return;
    }
    const result = this.scaleService.requestFolga(collab.id, date, this.simulatedDayOfMonth());
    this.showToast(result.message);
  }

  removePortalFolga(date: string) {
    const collab = this.getLoggedCollab();
    if (!collab) {
      this.showToast('Selecione um colaborador na simulação primeiro.');
      return;
    }
    const result = this.scaleService.removeFolga(collab.id, date, this.simulatedDayOfMonth());
    this.showToast(result.message);
  }

  getFolgaRequestCount(day: number): number {
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    let count = 0;
    for (const collab of this.scaleService.collaborators()) {
      if (collab.folgaRequests) {
        if (collab.folgaRequests.some(r => r.date === dateStr)) {
          count++;
        }
      }
    }
    return count;
  }

  getCollaboratorsForFolga(day: number): string[] {
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const names: string[] = [];
    for (const collab of this.scaleService.collaborators()) {
      if (collab.folgaRequests && collab.folgaRequests.some(r => r.date === dateStr)) {
        names.push(collab.name);
      }
    }
    return names;
  }

  isChosenByLogged(day: number): boolean {
    const collab = this.getLoggedCollab();
    if (!collab || !collab.folgaRequests) return false;
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return collab.folgaRequests.some(r => r.date === dateStr);
  }

  isPreSelectedByLogged(day: number): boolean {
    const collab = this.getLoggedCollab();
    if (!collab || !collab.folgaRequests) return false;
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return collab.folgaRequests.some(r => r.date === dateStr && r.isPreSelected);
  }

  getCalendarDayClass(isChosenByMe: boolean, count: number): string {
    const base = 'p-2.5 border rounded-lg flex flex-col justify-between gap-1 transition-all cursor-pointer h-16 min-w-0 outline-none text-left shadow-sm';
    if (this.isLightTheme()) {
      if (isChosenByMe) {
        return `${base} bg-emerald-600 border-emerald-700 text-white shadow-md shadow-emerald-500/10`;
      } else if (count >= 2) {
        return `${base} bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100/70`;
      } else {
        return `${base} bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50 text-slate-700`;
      }
    } else {
      if (isChosenByMe) {
        return `${base} bg-emerald-950/40 border-emerald-500 text-white`;
      } else if (count >= 2) {
        return `${base} bg-red-950/20 border-red-950/50 text-slate-300`;
      } else {
        return `${base} bg-[#071426] border-[#10213b] hover:border-slate-400 text-slate-300`;
      }
    }
  }

  requestPortalFolgaDay(day: number) {
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.requestPortalFolga(dateStr);
  }

  removePortalFolgaDay(day: number) {
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    this.removePortalFolga(dateStr);
  }

  isChosenByCollab(collab: Collaborator, day: number): boolean {
    if (!collab || !collab.folgaRequests) return false;
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return collab.folgaRequests.some(r => r.date === dateStr);
  }

  isPreSelectedByCollab(collab: Collaborator, day: number): boolean {
    if (!collab || !collab.folgaRequests) return false;
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return collab.folgaRequests.some(r => r.date === dateStr && r.isPreSelected);
  }

  requestCollabFolgaDay(collab: Collaborator, day: number) {
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const result = this.scaleService.requestFolga(collab.id, dateStr, this.simulatedDayOfMonth());
    if (!result.success) {
      this.showToast(result.message);
    } else {
      this.showToast(`Folga adicionada para ${collab.name}!`);
    }
  }

  removeCollabFolgaDay(collab: Collaborator, day: number) {
    const dateStr = `${this.currentYear()}-${String(this.selectedMonthIndex() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const result = this.scaleService.removeFolga(collab.id, dateStr, this.simulatedDayOfMonth());
    if (!result.success) {
      this.showToast(result.message);
    } else {
      this.showToast(`Folga removida para ${collab.name}!`);
    }
  }

  assignPortalCollabShift(collabId: string, shiftCode: string) {
    if (!collabId || !shiftCode) {
      this.showToast('Erro: Selecione um novo turno.');
      return;
    }

    const collab = this.scaleService.collaborators().find(c => c.id === collabId);
    const shiftType = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === shiftCode);

    if (!collab || !shiftType) {
      this.showToast('Erro: Seleção de turno inválida.');
      return;
    }

    const oldShiftCode = collab.shift;
    if (oldShiftCode === shiftCode) {
      this.showToast(`O colaborador já está alocado no turno "${shiftCode}".`);
      return;
    }

    const updatedScale = { ...collab.scale };
    for (let day = 1; day <= 30; day++) {
      if (updatedScale[day] === oldShiftCode) {
        updatedScale[day] = shiftCode;
      }
    }
    const updatedCollab = {
      ...collab,
      shift: shiftCode,
      hours: shiftType.hours,
      scale: updatedScale
    };

    this.scaleService.updateCollaborator(updatedCollab);
    this.showToast(`Turno de ${collab.name} atualizado com sucesso para "${shiftType.label}"!`);

    this.scaleService.addAuditHistory(
      'ALOCACAO_TURNO',
      `Turno de ${collab.name} alterado de "${oldShiftCode}" para "${shiftCode}" (${shiftType.hours}) via Portal.`
    );
  }

  // Simulated Portal Collaborator Info
  getLoggedCollab(): Collaborator | null {
    const id = this.selectedSimulatedCollabId();
    if (!id) return null;
    return this.scaleService.collaborators().find(c => c.id === id) || null;
  }

  // Shift swaps / Permutas logic
  openPermutaModal(day: number) {
    this.permutaSelectedDay.set(day);
    this.permutaTargetCollabId.set('');
    this.permutaStatusMessage.set('');
    this.isPermutaModalOpen.set(true);
  }

  // Colleagues matching same day sector but maybe different shift
  getPermutaCandidates(): Collaborator[] {
    const current = this.getLoggedCollab();
    if (!current) return [];
    return this.scaleService.collaborators().filter(c => c.id !== current.id && c.sector === current.sector);
  }

  requestPermuta() {
    const current = this.getLoggedCollab();
    const targetId = this.permutaTargetCollabId();
    const day = this.permutaSelectedDay();

    if (!current || !targetId) {
      this.permutaStatusMessage.set('Selecione um colega para permuta.');
      return;
    }

    const target = this.scaleService.collaborators().find(c => c.id === targetId);
    if (!target) return;

    const currentShiftRaw = current.scale[day] || '-';
    const currentShift = (currentShiftRaw === '-') ? this.getShiftCode(current.shift) : currentShiftRaw;

    const targetShiftRaw = target.scale[day] || '-';
    const targetShift = (targetShiftRaw === '-') ? this.getShiftCode(target.shift) : targetShiftRaw;

    if (currentShift === targetShift) {
      this.permutaStatusMessage.set('Erro: Vocês já possuem a mesma escala neste dia.');
      return;
    }

    const updatedCurrent = { ...current, scale: { ...current.scale, [day]: targetShift } };
    const updatedTarget = { ...target, scale: { ...target.scale, [day]: currentShift } };

    this.scaleService.updateCollaborator(updatedCurrent);
    this.scaleService.updateCollaborator(updatedTarget);
    this.isPermutaModalOpen.set(false);
    this.showToast(`Permuta realizada! Você assumiu o turno "${targetShift}" e ${target.name} assumiu "${currentShift}".`);

    // Add audit logs & notification
    this.scaleService.addAuditHistory(
      'PERMUTA_TURNO',
      `Permuta de escala no dia ${day}/06: ${current.name} (${currentShift} ⇄ ${targetShift}) com ${target.name}.`
    );

    const newNotif: AppNotification = {
      id: 'n_permuta_' + Math.random().toString(36).substring(2, 6),
      type: 'trade',
      message: `Permuta concluída: ${current.name} trocou o dia ${day} com ${target.name}.`,
      timestamp: 'Agora mesmo',
      read: false
    };
    this.notifications.set([newNotif, ...this.notifications()]);
  }

  // Simulated peer workers on same shift & day
  getConcomitantColegues(day: number): Collaborator[] {
    const current = this.getLoggedCollab();
    if (!current) return [];
    
    const currentShiftRaw = current.scale[day] || '-';
    const currentShift = (currentShiftRaw === '-') ? this.getShiftCode(current.shift) : currentShiftRaw;
    if (this.isSiglaAbsence(currentShift)) return []; // Off duty

    return this.scaleService.collaborators().filter(c => {
      if (c.id === current.id) return false;
      if (c.sector !== current.sector) return false;
      const cShiftRaw = c.scale[day] || '-';
      const cShift = (cShiftRaw === '-') ? this.getShiftCode(c.shift) : cShiftRaw;
      return cShift === currentShift;
    });
  }

  openDbConfigModal() {
    this.isDbModalOpen.set(true);
  }

  // Gemini IA Image Scaling Import Simulation
  openImportModal() {
    this.isImportModalOpen.set(true);
    this.importingState.set('idle');
    this.scannedTextResult.set('');
    this.scannedDataParsed.set([]);
    this.unrecognizedCodes.set([]);
  }

  async triggerAIScan(event: any) {
    const file = event.target?.files?.[0];
    if (!file) return;

    this.importingState.set('processing');
    this.showToast('IA lendo o arquivo de escala...');

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      const text = e.target?.result as string || '';
      const parsed: any[] = [];
      const lines = text.split('\n');
      const rawLines: string[] = [];
      
      const collabs = this.scaleService.collaborators();
      const validSiglas = new Set(this.scaleService.siglaTypes().map(s => s.code.toUpperCase()));
      validSiglas.add('X');
      validSiglas.add('-');
      validSiglas.add('F');
      validSiglas.add('LM');
      
      const validShifts = new Set(this.scaleService.shiftTypes().map(s => s.code.toUpperCase()));
      const unrecognizedSet = new Set<string>();

      const isKnown = (token: string): boolean => {
        const u = token.toUpperCase().trim();
        return u === '-' || u === '' || u === '?' || validSiglas.has(u) || validShifts.has(u);
      };
      
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        rawLines.push(trimmed);

        const lowerLine = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        let matchedCollab: Collaborator | null = null;
        for (const collab of collabs) {
          const collabLower = collab.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (lowerLine.includes(collabLower)) {
            matchedCollab = collab;
            break;
          }
        }
        
        if (!matchedCollab) {
           for (const collab of collabs) {
             const parts = collab.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ');
             if (parts.length >= 2) {
               const first = parts[0];
               const last = parts[parts.length - 1];
               if (lowerLine.includes(first) && lowerLine.includes(last)) {
                 matchedCollab = collab;
                 break;
               }
             }
           }
        }

        if (matchedCollab) {
          const scaleUpdates: { day: number, value: string }[] = [];
          
          if (trimmed.includes('|')) {
             const tokens = trimmed.split('|').map(s => s.trim().toUpperCase());
             // tokens[0] is name info. tokens[1..31] are the days.
             for(let d = 1; d <= 31 && d < tokens.length; d++) {
                let token = tokens[d];
                if (token === '' || token === '-') {
                  token = this.getShiftCode(matchedCollab.shift);
                } else {
                  // Check parts of this token to see if they are unrecognized
                  const parts = token.split(/[\s/,\-]+/).filter((p: string) => p !== '');
                  parts.forEach((p: string) => {
                    const u = p.toUpperCase().trim();
                    const isNum = /^\d+$/.test(u) || /^\d+[:.,hH]\d+$/.test(u);
                    if (u !== '-' && u !== '' && u !== '?' && !isNum && !validSiglas.has(u) && !validShifts.has(u)) {
                      unrecognizedSet.add(u);
                    }
                  });
                }
                scaleUpdates.push({ day: d, value: token });
             }
          } else {
             const tokens = trimmed.split(/[,;\t|\s]+/);
             let day = 1;
             for (let i = 0; i < tokens.length; i++) {
               let token = tokens[i].toUpperCase();
               
               // Allow anything that is a valid sigla, OR any 1-4 letter string if it looks like a symbol, or numeric code
               const isNum = /^\d+$/.test(token) || /^\d+[:.,hH]\d+$/.test(token);
               if (validSiglas.has(token) || isNum || (token.length >= 1 && token.length <= 4 && /^[A-Z0-9\-]+$/.test(token))) {
                  // Only take up to 31 tokens. 
                  // Heuristic: scale values usually come after name.
                  if (day <= 31) {
                    if (token === '' || token === '-') {
                      token = this.getShiftCode(matchedCollab.shift);
                    }
                    const parts = token.split(/[\s/,\-]+/).filter((p: string) => p !== '');
                    parts.forEach((p: string) => {
                      const u = p.toUpperCase().trim();
                      const isPartNum = /^\d+$/.test(u) || /^\d+[:.,hH]\d+$/.test(u);
                      if (u !== '-' && u !== '' && u !== '?' && !isPartNum && !validSiglas.has(u) && !validShifts.has(u)) {
                        unrecognizedSet.add(u);
                      }
                    });
                    scaleUpdates.push({ day, value: token });
                    day++;
                  }
               }
             }
          }
          
          if (scaleUpdates.length > 0) {
            parsed.push({
              collab: matchedCollab,
              updates: scaleUpdates
            });
          }
        }
      });
      
      this.unrecognizedCodes.set(Array.from(unrecognizedSet).sort());
      
      if (parsed.length === 0) {
        const rawLog = `[PROCESSO DE LEITURA]
Arquivo carregado: ${file.name} (${Math.round(file.size / 1024)} KB)

Aviso: Nenhum colaborador cadastrado foi encontrado nas linhas do arquivo.
O leitor requer um arquivo contendo os nomes dos colaboradores já cadastrados no banco de dados e os dados da escala na mesma linha.
Verifique se os nomes no PDF correspondem aos nomes no sistema.`;

        this.scannedTextResult.set(rawLog);
        this.scannedDataParsed.set([]);
        this.showToast('Nenhum colaborador válido encontrado no arquivo.');
      } else {
        const summary = parsed.map(p => `- ${p.collab.name}: ${p.updates.length} dias lidos`).join('\n');
        this.scannedTextResult.set(
          `[LEITURA DINÂMICA CONCLUÍDA]:\nArquivo processado: ${file.name}\nTotal de linhas lidas: ${lines.length}\nColaboradores extraídos: ${parsed.length}\n\nResumo:\n${summary}`
        );
        this.scannedDataParsed.set(parsed);
      }
      
      this.importingState.set('done');
      this.showToast('Escala importada e processada com sucesso!');
    };
    
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const arrayBufferReader = new FileReader();
      arrayBufferReader.onload = async (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
          let text = '';
          let dayXs: number[] = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            const lineMap = new Map<number, any[]>();
            content.items.forEach((item: any) => {
              if (item.str && item.str.trim() !== '') {
                const y = Math.round(item.transform[5] / 2) * 2;
                if (!lineMap.has(y)) {
                  lineMap.set(y, []);
                }
                lineMap.get(y)!.push(item);
              }
            });

            const sortedYs = Array.from(lineMap.keys()).sort((a, b) => b - a);
            
            sortedYs.forEach(y => {
              const items = lineMap.get(y)!;
              items.sort((a, b) => a.transform[4] - b.transform[4]);
              const strs = items.map(i => i.str.trim()).filter(s => s !== '');
              
              if (strs.includes('1') && strs.includes('15') && strs.includes('31')) {
                 let currentDay = 1;
                 let tempXs: number[] = [];
                 for(let i=0; i<items.length; i++) {
                    if (items[i].str.trim() === currentDay.toString()) {
                       tempXs[currentDay] = items[i].transform[4];
                       currentDay++;
                    }
                 }
                 if (currentDay > 31) {
                    dayXs = tempXs; 
                 }
              }
            });

            sortedYs.forEach(y => {
              const itemsOnLine = lineMap.get(y)!;
              itemsOnLine.sort((a, b) => a.transform[4] - b.transform[4]);
              
              if (dayXs.length === 32) {
                 const infoItems = itemsOnLine.filter(item => item.transform[4] < dayXs[1] - 10);
                 const infoStr = infoItems.map(i => i.str.trim()).join(' ').trim();
                 
                 if (infoStr.length > 2) {
                    const dayValues: string[] = [];
                    for(let d=1; d<=31; d++) {
                       const targetX = dayXs[d];
                       const itemForDay = itemsOnLine.find(item => Math.abs(item.transform[4] - targetX) < 12);
                       if (itemForDay && itemForDay.str.trim() !== '') {
                         dayValues.push(itemForDay.str.trim());
                       } else {
                         dayValues.push('-');
                       }
                    }
                    text += infoStr + ' | ' + dayValues.join(' | ') + '\n';
                 } else {
                    text += itemsOnLine.map(item => item.str.trim()).join('   ') + '\n';
                 }
              } else {
                 text += itemsOnLine.map(item => item.str.trim()).join('   ') + '\n';
              }
            });
          }
          // Pass the extracted text to the existing reader logic
          reader.onload!({ target: { result: text } } as any);
        } catch (err) {
          console.error('Error reading PDF:', err);
          reader.onload!({ target: { result: '' } } as any);
        }
      };
      arrayBufferReader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain' || file.type === 'text/csv' || file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      setTimeout(() => {
        reader.onload!({ target: { result: '' } } as any);
      }, 1800);
    }
  }

  async commitAIScannedUsers() {
    const parsedData = this.scannedDataParsed();
    if (parsedData.length === 0) return;

    this.showToast(`Atualizando escala para ${parsedData.length} colaboradores...`);

    const registeredSiglas = new Set(this.scaleService.siglaTypes().map(s => s.code.toUpperCase()));
    registeredSiglas.add('X');
    registeredSiglas.add('-');
    registeredSiglas.add('F');
    registeredSiglas.add('LM');
    const registeredShifts = new Set(this.scaleService.shiftTypes().map(s => s.code.toUpperCase()));
    
    // We will collect the updated collabs and bulk save them
    const updatedCollabs = this.scaleService.collaborators().map(collab => {
      const match = parsedData.find(p => p.collab.id === collab.id);
      if (match) {
        const newScale = { ...collab.scale };
        match.updates.forEach((upd: any) => {
          let val = (upd.value || '').toUpperCase().trim();
          if (val === '-' || val === '') {
            val = this.getShiftCode(collab.shift);
          }
          if (val !== '-' && val !== '' && val !== '?') {
            const parts = val.split(/[\s/,\-]+/).filter((p: string) => p !== '');
            const allKnown = parts.every((p: string) => {
              const u = p.trim();
              const isNum = /^\d+$/.test(u) || /^\d+[:.,hH]\d+$/.test(u);
              return u === '-' || u === '' || u === '?' || isNum || registeredSiglas.has(u) || registeredShifts.has(u);
            });
            if (!allKnown) {
              val = '?';
            }
          }
          newScale[upd.day] = val;
        });
        return { ...collab, scale: newScale };
      }
      return collab;
    });

    await this.scaleService.saveUpdatedListToDb(updatedCollabs, 'IMPORTACAO_ESCALA', 'Importação em lote de arquivo da escala.');

    this.isImportModalOpen.set(false);
    this.showToast(`A escala de ${parsedData.length} colaboradores foi atualizada com sucesso!`);
  }

  async registerUnrecognizedCodes() {
    const codes = this.unrecognizedCodes();
    if (codes.length === 0) return;

    this.showToast(`Cadastrando ${codes.length} sigla(s) no dicionário...`);

    const colors = [
      '#ef4444', // Red
      '#ec4899', // Pink
      '#f59e0b', // Amber/Orange
      '#3b82f6', // Blue
      '#8b5cf6', // Violet
      '#06b6d4', // Cyan
      '#14b8a6', // Teal
      '#10b981', // Emerald
      '#a855f7'  // Purple
    ];

    try {
      for (let i = 0; i < codes.length; i++) {
        const code = codes[i].toUpperCase().trim();
        // Generate a random pleasant color based on index or code
        let hash = 0;
        for (let j = 0; j < code.length; j++) {
          hash = code.charCodeAt(j) + ((hash << 5) - hash);
        }
        const color = colors[Math.abs(hash) % colors.length];

        const newSigla = {
          code: code,
          label: `Importada (${code})`,
          color: color,
          description: 'Gerada automaticamente via Leitor Inteligente de PDF.',
          textColor: '#ffffff'
        };

        await this.scaleService.saveSiglaType(newSigla);
      }

      this.unrecognizedCodes.set([]); // Clear unrecognized list
      this.showToast('Siglas cadastradas com sucesso! Dicionário de Siglas atualizado.');
    } catch (err: any) {
      console.error('Error auto-registering siglas:', err);
      this.showToast(`Falha ao cadastrar: ${err.message || err}`);
    }
  }

  startEditingCollab(collab: Collaborator) {
    this.editingCollab.set(collab);
    this.newCollabPhotoData.set(collab.photo || null);
    this.isCollabModalOpen.set(true);
    this.isNewSectorMode.set(false);
    this.isNewRoleMode.set(false);
    this.showToast(`Modo Edição: Editando ${collab.name}`);
  }

  cancelEditingCollab() {
    this.editingCollab.set(null);
    this.newCollabPhotoData.set(null);
    this.isCollabModalOpen.set(false);
    this.isNewSectorMode.set(false);
    this.isNewRoleMode.set(false);
  }

  saveEditedCollaborator(
    id: string,
    name: string,
    role: string,
    group: string,
    shift: string,
    sector: string,
    bh: number,
    score: number,
    photo?: string | null,
    birthday?: string,
    sd1Desc?: string, sd1Date?: string,
    sd2Desc?: string, sd2Date?: string,
    sd3Desc?: string, sd3Date?: string,
    sd4Desc?: string, sd4Date?: string,
    sd5Desc?: string, sd5Date?: string
  ) {
    if (!name.trim()) {
      this.showToast('O nome completo do colaborador é obrigatório.');
      return;
    }

    const specialDates: SpecialDate[] = [];
    if (sd1Desc && sd1Date) specialDates.push({ description: sd1Desc, date: sd1Date, priority: 1 });
    if (sd2Desc && sd2Date) specialDates.push({ description: sd2Desc, date: sd2Date, priority: 2 });
    if (sd3Desc && sd3Date) specialDates.push({ description: sd3Desc, date: sd3Date, priority: 3 });
    if (sd4Desc && sd4Date) specialDates.push({ description: sd4Desc, date: sd4Date, priority: 4 });
    if (sd5Desc && sd5Date) specialDates.push({ description: sd5Desc, date: sd5Date, priority: 5 });

    const target = this.scaleService.collaborators().find(c => c.id === id);
    if (!target) {
      this.showToast('Erro: Colaborador não encontrado.');
      return;
    }

    const getShiftCode = (s: string): string => {
      const norm = (s || '').toUpperCase().trim();
      const st = this.scaleService.shiftTypes().find(x => x.code.toUpperCase().trim() === norm || x.label.toUpperCase().trim() === norm);
      return st ? st.code : norm;
    };

    const oldShiftCode = getShiftCode(target.shift);
    const newShiftCode = getShiftCode(shift);
    const shiftType = this.scaleService.shiftTypes().find(s => s.code.trim().toUpperCase() === newShiftCode);
    const newHours = shiftType ? shiftType.hours : (newShiftCode === 'ADM' ? '8h00' : '7h20');

    const updatedScale = { ...target.scale };
    let shiftReallocated = false;

    if (oldShiftCode !== newShiftCode) {
      shiftReallocated = true;
      for (let day = 1; day <= 31; day++) {
        if (updatedScale[day] === oldShiftCode) {
          updatedScale[day] = newShiftCode;
        }
      }
    }

    const updatedCollab: Collaborator = {
      ...target,
      name,
      role,
      group,
      shift,
      hours: newHours,
      sector,
      bhBalance: bh,
      score,
      photo: photo || target.photo,
      birthday: birthday || '',
      specialDates,
      scale: updatedScale
    };

    this.scaleService.updateCollaborator(updatedCollab);

    if (shiftReallocated) {
      this.scaleService.addAuditHistory(
        'ALOCACAO_TURNO',
        `Colaborador ${target.name} reallocado do turno "${target.shift}" para "${shift}" (${newHours}) via atualização cadastral.`
      );
      this.showToast(`Colaborador atualizado e reallocado para o turno "${shift}"!`);
    } else {
      this.showToast('Colaborador atualizado com sucesso!');
    }

    this.cancelEditingCollab();
  }

  onCollabPhotoSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 120;
        const MAX_HEIGHT = 120;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          this.newCollabPhotoData.set(dataUrl);
        } else {
          this.newCollabPhotoData.set(e.target.result);
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}
