import { Injectable, signal } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, getFirestore, collection, doc, onSnapshot, setDoc, deleteDoc } from 'firebase/firestore';
import { firebaseConfig } from './firebase-config';
import { createClient } from '@supabase/supabase-js';
import { supabaseEnv } from './supabase-env';

declare const process: any;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export interface SpecialDate {
  description: string;
  date: string; // "YYYY-MM-DD" or "MM-DD"
  priority: number; // 1 (inegociável) to 5
}

export interface FolgaRequest {
  date: string; // "YYYY-MM-DD"
  isPreSelected?: boolean;
}

export interface Collaborator {
  id: string;
  name: string;
  role: 'OPERADOR' | 'LIDER' | 'SUPERVISOR';
  hours: string;
  group: string;
  shift: string;
  sector: 'AERÓDROMO' | 'VIP' | 'TREINAMENTO';
  bhBalance: number;
  score: number;
  photoUrl?: string;
  scale: { [day: number]: string }; // Day 1 to 30 of June 2026
  photo?: string;
  birthday?: string; // Format: "YYYY-MM-DD"
  specialDates?: SpecialDate[];
  folgaRequests?: FolgaRequest[];
}

export interface ShiftType {
  code: string;
  label: string;
  hours: string;
  color: string;
  startTime?: string;
  endTime?: string;
}

export interface SiglaType {
  code: string;
  label: string;
  color: string;
  description?: string;
  textColor?: string;
}

export interface BackupHistory {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScaleService {
  // Selected state signals
  selectedCollabName = signal<string | null>(null);
  currentRole = signal<'SUPERVISOR' | 'LIDER' | 'OPERADOR'>('SUPERVISOR');

  // Real-time synchronization lists via signals
  collaborators = signal<Collaborator[]>([]);
  shiftTypes = signal<ShiftType[]>([]);
  siglaTypes = signal<SiglaType[]>([]);
  auditHistory = signal<BackupHistory[]>([]);
  isProcessing = signal<boolean>(false);

  // Helper to resolve initial Supabase URL
  private getInitialSupabaseUrl(): string {
    const stored = localStorage.getItem('supabase_url');
    if (stored) return stored;

    if (supabaseEnv && supabaseEnv.url) {
      return supabaseEnv.url;
    }

    const windowUrl = (window as any)['SUPABASE_URL'] || (window as any)['env']?.['SUPABASE_URL'];
    if (windowUrl) {
      localStorage.setItem('supabase_url', windowUrl);
      return windowUrl;
    }

    const processUrl = typeof process !== 'undefined' ? process?.env?.['SUPABASE_URL'] || process?.env?.['NG_APP_SUPABASE_URL'] : '';
    if (processUrl) {
      localStorage.setItem('supabase_url', processUrl);
      return processUrl;
    }

    const importMetaUrl = (import.meta as any).env?.['SUPABASE_URL'] || (import.meta as any).env?.['NG_APP_SUPABASE_URL'] || (import.meta as any).env?.['VITE_SUPABASE_URL'];
    if (importMetaUrl) {
      localStorage.setItem('supabase_url', importMetaUrl);
      return importMetaUrl;
    }

    return 'https://vefyegxmvjficncbetyp.supabase.co';
  }

  // Helper to resolve initial Supabase Key
  private getInitialSupabaseKey(): string {
    const stored = localStorage.getItem('supabase_key');
    if (stored) return stored;

    if (supabaseEnv && supabaseEnv.key) {
      return supabaseEnv.key;
    }

    const windowKey = (window as any)['SUPABASE_KEY'] || (window as any)['env']?.['SUPABASE_KEY'];
    if (windowKey) {
      localStorage.setItem('supabase_key', windowKey);
      return windowKey;
    }

    const processKey = typeof process !== 'undefined' ? process?.env?.['SUPABASE_KEY'] || process?.env?.['NG_APP_SUPABASE_KEY'] : '';
    if (processKey) {
      localStorage.setItem('supabase_key', processKey);
      return processKey;
    }

    const importMetaKey = (import.meta as any).env?.['SUPABASE_KEY'] || (import.meta as any).env?.['NG_APP_SUPABASE_KEY'] || (import.meta as any).env?.['VITE_SUPABASE_KEY'];
    if (importMetaKey) {
      localStorage.setItem('supabase_key', importMetaKey);
      return importMetaKey;
    }

    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c';
  }

  // Database Connection Configuration
  activeDb = signal<'firebase' | 'supabase'>(
    (localStorage.getItem('active_db') as 'firebase' | 'supabase') || 'supabase'
  );
  supabaseUrl = signal<string>(this.getInitialSupabaseUrl());
  supabaseKey = signal<string>(this.getInitialSupabaseKey());
  databaseError = signal<string | null>(null);

  // Firebase Initialization - Defensive getFirestore to avoid any initialization or undefined databaseId crash
  private app = initializeApp(firebaseConfig);
  private db = (() => {
    try {
      if (firebaseConfig.databaseId) {
        return initializeFirestore(this.app, {
          experimentalForceLongPolling: true
        }, firebaseConfig.databaseId);
      } else {
        return initializeFirestore(this.app, {
          experimentalForceLongPolling: true
        });
      }
    } catch (e) {
      console.warn('Fallback to standard getFirestore:', e);
      return getFirestore(this.app);
    }
  })();

  // Supabase Client Reference
  private supabase: any = null;
  private firebaseUnsubscribes: (() => void)[] = [];

  constructor() {
    const storedDb = localStorage.getItem('active_db');
    if (storedDb === 'firebase' || storedDb === 'supabase') {
      this.activeDb.set(storedDb);
    } else if (supabaseEnv && supabaseEnv.url && supabaseEnv.key) {
      this.activeDb.set('supabase');
      localStorage.setItem('active_db', 'supabase');
    } else {
      this.activeDb.set('firebase');
      localStorage.setItem('active_db', 'firebase');
    }
    
    if (this.activeDb() === 'firebase') {
      this.initFirebaseSync();
    } else {
      this.initSupabase();
    }
  }

  setDatabaseProvider(provider: 'firebase' | 'supabase') {
    this.activeDb.set(provider);
    localStorage.setItem('active_db', provider);
    this.databaseError.set(null);
    if (provider === 'supabase') {
      this.clearFirebaseSync();
      this.initSupabase();
    } else {
      this.initFirebaseSync();
    }
  }

  setSupabaseConfig(url: string, key: string) {
    this.supabaseUrl.set(url);
    this.supabaseKey.set(key);
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_key', key);
    this.setDatabaseProvider('supabase');
  }

  initSupabase() {
    const url = this.supabaseUrl();
    const key = this.supabaseKey();
    if (url && key) {
      try {
        this.supabase = createClient(url, key);
        this.databaseError.set(null);
        this.syncSupabase();
      } catch (err: any) {
        console.error('Erro ao inicializar Supabase:', err);
        this.databaseError.set(err.message || 'Erro ao inicializar cliente Supabase');
      }
    } else {
      this.supabase = null;
      if (this.activeDb() === 'supabase') {
        this.databaseError.set('URL ou Chave Anon do Supabase não configurados.');
        this.collaborators.set([]);
        this.shiftTypes.set([]);
        this.siglaTypes.set([]);
        this.auditHistory.set([]);
      }
    }
  }

  async fetchAllScaleRows(month: number, year: number): Promise<any[]> {
    if (!this.supabase) return [];
    let allRows: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await this.supabase
        .from('escala_diaria')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .range(from, from + step - 1);

      if (error) {
        console.error('Error fetching paginated scale rows:', error);
        throw error;
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }

    return allRows;
  }

  async syncSupabase(): Promise<void> {
    if (!this.supabase) return;
    this.databaseError.set(null);

    try {
      // Fetch from table systems on Supabase (colaboradores, escala_diaria, sigla_types, shift_types, audit_history)
      const queryCollabs = this.supabase.from('colaboradores').select('*');
      const querySiglas = this.supabase.from('sigla_types').select('*');
      const queryShifts = this.supabase.from('shift_types').select('*');
      const queryAudit = this.supabase.from('audit_history').select('*');

      const [collabsResult, siglasResult, shiftsResult, auditResult, escalaData] = await Promise.all([
        queryCollabs,
        querySiglas,
        queryShifts,
        queryAudit,
        this.fetchAllScaleRows(7, 2026)
      ]);

      if (this.activeDb() !== 'supabase') return;

      const collabsError = collabsResult.error;
      const collabsData = collabsResult.data;

      if (collabsError) {
        console.error('Supabase colaboradores error:', collabsError);
        this.databaseError.set(`Erro ao carregar colaboradores do Supabase: ${collabsError.message}`);
        this.collaborators.set([]);
        return;
      }

      // 1. Sync Siglas
      const siglasError = siglasResult?.error;
      const siglasData = siglasResult?.data;
      if (siglasError) {
        console.error('Supabase sigla_types error:', siglasError);
        this.siglaTypes.set([]);
      } else {
        this.siglaTypes.set(siglasData || []);
      }

      // 2. Sync Shift Types
      const shiftsError = shiftsResult?.error;
      const shiftsData = shiftsResult?.data;
      if (shiftsError) {
        console.error('Supabase shift_types error:', shiftsError);
        this.shiftTypes.set([]);
      } else {
        this.shiftTypes.set(shiftsData || []);
      }

      // 3. Sync Audit History
      const auditError = auditResult?.error;
      const auditData = auditResult?.data;
      if (auditError) {
        console.error('Supabase audit_history error:', auditError);
        this.auditHistory.set([]);
      } else {
        const sortedAudit = [...(auditData || [])];
        sortedAudit.sort((a: any, b: any) => b.timestamp.localeCompare(a.timestamp));
        this.auditHistory.set(sortedAudit);
      }

      // 4. Sync Collaborators & Daily Scales
      if (!collabsData || collabsData.length === 0) {
        this.collaborators.set([]);
      } else {
        // Group scales by collaborator_id
        const scaleMap: { [collabId: string]: { [day: number]: string } } = {};
        if (escalaData) {
          escalaData.forEach((row: any) => {
            if (!scaleMap[row.collaborator_id]) {
              scaleMap[row.collaborator_id] = {};
            }
            scaleMap[row.collaborator_id][row.day] = row.value || 'X';
          });
        }

        // Map database records to Collaborator interface
        const mappedCollabs: Collaborator[] = collabsData.map((row: any) => {
          // Ensure all 31 days are filled
          const scale = scaleMap[row.id] || {};
          for (let d = 1; d <= 31; d++) {
            if (scale[d] === undefined) {
              scale[d] = '-';
            }
          }

          return {
            id: row.id,
            name: row.name || 'Sem Nome',
            role: row.role || 'OPERADOR',
            hours: row.schedule || '7h20',
            group: row.grupo || (
              row.role === 'LIDER' ? 'Líderes' :
              row.sector === 'VIP' ? 'VIP' :
              row.sector === 'TREINAMENTO' ? 'Treinamento' :
              row.shift === 'MANHÃ' ? 'Manhã' :
              row.shift === 'TARDE' ? 'Tarde' :
              row.shift === 'MADRUGADA' || row.shift === 'NOITE' ? 'Noite' :
              row.shift === 'ADMINISTRATIVO' ? 'Administrativo' : 'Corporativo'
            ),
            shift: (row.shift === 'MADRUGADA' ? 'NOITE' : (row.shift || 'NOITE')),
            sector: row.sector || 'AERÓDROMO',
            bhBalance: row.bh_balance || 0,
            score: row.score || 90,
            scale: scale,
            birthday: row.birthday || '',
            specialDates: typeof row.special_dates === 'string' ? JSON.parse(row.special_dates) : (row.special_dates || []),
            folgaRequests: typeof row.folga_requests === 'string' ? JSON.parse(row.folga_requests) : (row.folga_requests || [])
          };
        });

        mappedCollabs.sort((a, b) => a.id.localeCompare(b.id));
        console.log('Supabase sync loaded colaboradores count:', mappedCollabs.length);
        this.collaborators.set(mappedCollabs);
      }
    } catch (err: any) {
      console.error('Error syncing Supabase:', err);
      if (this.activeDb() === 'supabase') {
        this.databaseError.set(`Erro de conexão com o Supabase: ${err.message || err}`);
        this.collaborators.set([]);
        this.shiftTypes.set([]);
        this.siglaTypes.set([]);
        this.auditHistory.set([]);
      }
    }
  }

  private initFirebaseSync() {
    this.clearFirebaseSync();
    if (this.activeDb() !== 'firebase') return;

    // 1. Listen to Collaborators
    const collCollab = collection(this.db, 'collaborators');
    const unsubCollab = onSnapshot(collCollab, (snapshot) => {
      if (this.activeDb() !== 'firebase') return;
      const list: Collaborator[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Collaborator);
      });
      list.sort((a, b) => a.id.localeCompare(b.id));
      this.collaborators.set(list);
    }, (error) => {
      if (this.activeDb() === 'firebase') {
        handleFirestoreError(error, OperationType.GET, 'collaborators');
      }
    });
    this.firebaseUnsubscribes.push(unsubCollab);

    // 2. Listen to Shift Types
    const collShifts = collection(this.db, 'shiftTypes');
    const unsubShifts = onSnapshot(collShifts, (snapshot) => {
      if (this.activeDb() !== 'firebase') return;
      const list: ShiftType[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ShiftType);
      });
      this.shiftTypes.set(list);
    }, (error) => {
      if (this.activeDb() === 'firebase') {
        handleFirestoreError(error, OperationType.GET, 'shiftTypes');
      }
    });
    this.firebaseUnsubscribes.push(unsubShifts);

    // 3. Listen to Sigla Types
    const collSiglas = collection(this.db, 'siglaTypes');
    const unsubSiglas = onSnapshot(collSiglas, (snapshot) => {
      if (this.activeDb() !== 'firebase') return;
      const list: SiglaType[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as SiglaType);
      });
      this.siglaTypes.set(list);
    }, (error) => {
      if (this.activeDb() === 'firebase') {
        handleFirestoreError(error, OperationType.GET, 'siglaTypes');
      }
    });
    this.firebaseUnsubscribes.push(unsubSiglas);

    // 4. Listen to Audit History
    const collAudit = collection(this.db, 'auditHistory');
    const unsubAudit = onSnapshot(collAudit, (snapshot) => {
      if (this.activeDb() !== 'firebase') return;
      const list: BackupHistory[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as BackupHistory);
      });
      list.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      this.auditHistory.set(list);
    }, (error) => {
      if (this.activeDb() === 'firebase') {
        handleFirestoreError(error, OperationType.GET, 'auditHistory');
      }
    });
    this.firebaseUnsubscribes.push(unsubAudit);
  }

  private clearFirebaseSync() {
    this.firebaseUnsubscribes.forEach(unsub => {
      try {
        unsub();
      } catch (e) {}
    });
    this.firebaseUnsubscribes = [];
  }

  // Database operations
  getAutoPreSelectedFolgas(collab: Collaborator): FolgaRequest[] {
    const preSelected: FolgaRequest[] = [];
    
    // 1. Check birthday (Month 7 - July)
    if (collab.birthday) {
      const parts = collab.birthday.split('-'); // YYYY-MM-DD
      if (parts.length === 3) {
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (m === 7) { // July
          preSelected.push({
            date: `2026-07-${String(d).padStart(2, '0')}`,
            isPreSelected: true
          });
        }
      }
    }
    
    // 2. Check special dates (Month 7 - July)
    if (collab.specialDates && Array.isArray(collab.specialDates)) {
      const sorted = [...collab.specialDates].sort((a, b) => a.priority - b.priority);
      for (const sd of sorted) {
        if (!sd.date) continue;
        const parts = sd.date.split('-');
        if (parts.length === 3) {
          const m = parseInt(parts[1], 10);
          const d = parseInt(parts[2], 10);
          if (m === 7) {
            const dateStr = `2026-07-${String(d).padStart(2, '0')}`;
            if (!preSelected.some(p => p.date === dateStr)) {
              preSelected.push({
                date: dateStr,
                isPreSelected: true
              });
            }
          }
        }
      }
    }
    
    return preSelected.slice(0, 3);
  }

  refreshPreSelectedFolgas(collab: Collaborator, forceApplyToScale = false): Collaborator {
    const preSelected = this.getAutoPreSelectedFolgas(collab);
    const manualRequests = (collab.folgaRequests || []).filter(r => !r.isPreSelected);
    const newList: FolgaRequest[] = [...preSelected];
    
    for (const req of manualRequests) {
      if (newList.length < 3) {
        if (!newList.some(p => p.date === req.date)) {
          newList.push(req);
        }
      }
    }
    
    const updatedScale = { ...collab.scale };
    if (forceApplyToScale) {
      newList.forEach(req => {
        const parts = req.date.split('-');
        if (parts.length === 3) {
          const d = parseInt(parts[2], 10);
          updatedScale[d] = 'X';
        }
      });
    }

    return {
      ...collab,
      folgaRequests: newList,
      scale: updatedScale
    };
  }

  requestFolga(collabId: string, date: string, simulatedDay: number): { success: boolean, message: string } {
    if (simulatedDay > 10) {
      return { success: false, message: 'Escolha indisponível. Solicitações de folga são permitidas apenas do dia 1 ao dia 10 do mês anterior.' };
    }

    const collabs = this.collaborators();
    const targetCollab = collabs.find(c => c.id === collabId);
    if (!targetCollab) {
      return { success: false, message: 'Colaborador não encontrado.' };
    }

    const currentRequests = targetCollab.folgaRequests || [];
    
    if (currentRequests.some(r => r.date === date)) {
      return { success: false, message: 'Você já solicitou folga para este dia.' };
    }

    if (currentRequests.length >= 3) {
      return { success: false, message: 'Limite de 3 folgas mensais atingido.' };
    }

    // Check count of other collabs requesting the same day
    const count = collabs.filter(c => (c.folgaRequests || []).some(r => r.date === date)).length;
    if (count >= 2) {
      return { success: false, message: 'Data indisponível. O limite de 2 colaboradores para esta data já foi atingido.' };
    }

    const updatedRequests = [...currentRequests, { date, isPreSelected: false }];
    let updatedCollab: Collaborator = { ...targetCollab, folgaRequests: updatedRequests };

    const parts = date.split('-');
    if (parts.length === 3) {
      const dayNum = parseInt(parts[2], 10);
      updatedCollab.scale = { ...targetCollab.scale, [dayNum]: 'X' };
    }

    updatedCollab = this.refreshPreSelectedFolgas(updatedCollab);
    this.updateCollaborator(updatedCollab);
    this.addAuditHistory('SOLICITACAO_FOLGA', `Colaborador ${targetCollab.name} solicitou folga para o dia ${date}.`);
    
    return { success: true, message: 'Folga solicitada com sucesso!' };
  }

  removeFolga(collabId: string, date: string, simulatedDay: number): { success: boolean, message: string } {
    if (simulatedDay > 10) {
      return { success: false, message: 'Escolha indisponível. Solicitações de folga são permitidas apenas do dia 1 ao dia 10 do mês anterior.' };
    }

    const collabs = this.collaborators();
    const targetCollab = collabs.find(c => c.id === collabId);
    if (!targetCollab) {
      return { success: false, message: 'Colaborador não encontrado.' };
    }

    const currentRequests = targetCollab.folgaRequests || [];
    const targetRequest = currentRequests.find(r => r.date === date);
    if (!targetRequest) {
      return { success: false, message: 'Solicitação não encontrada.' };
    }

    if (targetRequest.isPreSelected) {
      return { success: false, message: 'Não é possível remover folga pré-selecionada de aniversário ou data magna.' };
    }

    const updatedRequests = currentRequests.filter(r => r.date !== date);
    let updatedCollab: Collaborator = { ...targetCollab, folgaRequests: updatedRequests };

    const parts = date.split('-');
    if (parts.length === 3) {
      const dayNum = parseInt(parts[2], 10);
      updatedCollab.scale = { ...targetCollab.scale, [dayNum]: '-' };
    }

    updatedCollab = this.refreshPreSelectedFolgas(updatedCollab);
    this.updateCollaborator(updatedCollab);
    this.addAuditHistory('SOLICITACAO_FOLGA_REMOVIDA', `Colaborador ${targetCollab.name} removeu folga de ${date}.`);
    
    return { success: true, message: 'Folga removida com sucesso!' };
  }

  async addCollaborator(
    name: string,
    role: 'OPERADOR' | 'LIDER' | 'SUPERVISOR',
    hours: string,
    group: string,
    shift: string,
    sector: 'AERÓDROMO' | 'VIP' | 'TREINAMENTO',
    bh: number,
    score: number,
    photo?: string,
    birthday?: string,
    specialDates?: SpecialDate[],
    folgaRequests?: FolgaRequest[]
  ) {
    if (!name.trim()) return;
    const id = 'collab_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    
    // Initialize standard scale (5 days work, 2 days off) for July 2026
    const initialScale: { [day: number]: string } = {};
    for (let d = 1; d <= 31; d++) {
      const dayOfWeek = (d + 2) % 7; // July 1st, 2026 is a Wednesday (Index 3)
      if (dayOfWeek === 6 || dayOfWeek === 0) {
        initialScale[d] = 'X';
      } else {
        initialScale[d] = '-';
      }
    }

    let newCollab: Collaborator = {
      id,
      name,
      role,
      hours,
      group,
      shift,
      sector,
      bhBalance: bh,
      score,
      scale: initialScale,
      photo: photo || undefined,
      birthday: birthday || '',
      specialDates: specialDates || [],
      folgaRequests: folgaRequests || []
    };

    newCollab = this.refreshPreSelectedFolgas(newCollab, true);

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const dbRow = {
          id: newCollab.id,
          name: newCollab.name,
          role: newCollab.role,
          schedule: newCollab.hours,
          shift: newCollab.shift,
          sector: newCollab.sector,
          bh_balance: newCollab.bhBalance,
          score: newCollab.score,
          birthday: newCollab.birthday || null,
          special_dates: newCollab.specialDates || null,
          folga_requests: newCollab.folgaRequests || null
        };
        const upRes = await this.supabase.from('colaboradores').upsert(dbRow);
        if (upRes.error) throw upRes.error;

        const scaleRows = [];
        for (let d = 1; d <= 31; d++) {
          scaleRows.push({
            collaborator_id: newCollab.id,
            day: d,
            month: 7,
            year: 2026,
            value: newCollab.scale[d] || 'X'
          });
        }
        const upScaleRes = await this.supabase.from('escala_diaria').upsert(scaleRows);
        if (upScaleRes.error) throw upScaleRes.error;

        this.syncSupabase();
        this.addAuditHistory('CADASTRO_COLABORADOR', `Colaborador ${name} cadastrado no Supabase.`);
      } catch (err: any) {
        console.error(err);
        this.databaseError.set(`Falha ao salvar no Supabase: ${err.message || err}`);
      }
    } else {
      setDoc(doc(this.db, 'collaborators', id), newCollab).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `collaborators/${id}`);
      });
      this.addAuditHistory('CADASTRO_COLABORADOR', `Colaborador ${name} cadastrado no Firebase.`);
    }
  }

  async removeCollaborator(id: string) {
    const target = this.collaborators().find(c => c.id === id);
    if (!target) return;

    // Update local state optimistically
    const list = this.collaborators();
    this.collaborators.set(list.filter(c => c.id !== id));

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const delScaleRes = await this.supabase.from('escala_diaria').delete().eq('collaborator_id', id);
        if (delScaleRes.error) throw delScaleRes.error;

        const delCollabRes = await this.supabase.from('colaboradores').delete().eq('id', id);
        if (delCollabRes.error) throw delCollabRes.error;

        this.syncSupabase();
        this.addAuditHistory('REMOCAO_COLABORADOR', `Colaborador ${target.name} removido do Supabase.`);
      } catch (err: any) {
        console.error(err);
        // Rollback on error
        this.collaborators.set(list);
        this.databaseError.set(`Falha ao remover colaborador: ${err.message || err}`);
      }
    } else {
      deleteDoc(doc(this.db, 'collaborators', id))
        .then(() => {
          this.addAuditHistory('REMOCAO_COLABORADOR', `Colaborador ${target.name} removido do Firebase.`);
        })
        .catch((err) => {
          // Rollback on error
          this.collaborators.set(list);
          handleFirestoreError(err, OperationType.DELETE, `collaborators/${id}`);
        });
    }
  }

  async updateCollaborator(col: Collaborator) {
    const refreshedCol = this.refreshPreSelectedFolgas(col);

    // Optimistically update local state to make the UI instant and prevent concurrent click race conditions
    const list = this.collaborators();
    const index = list.findIndex(c => c.id === col.id);
    if (index !== -1) {
      const updated = [...list];
      updated[index] = refreshedCol;
      this.collaborators.set(updated);
    }

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const dbRow = {
          id: refreshedCol.id,
          name: refreshedCol.name,
          role: refreshedCol.role,
          schedule: refreshedCol.hours,
          shift: refreshedCol.shift,
          sector: refreshedCol.sector,
          bh_balance: refreshedCol.bhBalance,
          score: refreshedCol.score,
          birthday: refreshedCol.birthday || null,
          special_dates: refreshedCol.specialDates || null,
          folga_requests: refreshedCol.folgaRequests || null
        };
        const upRes = await this.supabase.from('colaboradores').upsert(dbRow);
        if (upRes.error) throw upRes.error;

        const scaleRows = [];
        for (let d = 1; d <= 31; d++) {
          scaleRows.push({
            collaborator_id: refreshedCol.id,
            day: d,
            month: 7,
            year: 2026,
            value: refreshedCol.scale[d] || 'X'
          });
        }
        const upScaleRes = await this.supabase.from('escala_diaria').upsert(scaleRows);
        if (upScaleRes.error) throw upScaleRes.error;

        this.syncSupabase();
      } catch (err: any) {
        console.error('Error in updateCollaborator:', err);
        this.databaseError.set(`Falha ao atualizar colaborador: ${err.message || err.details || err.hint || JSON.stringify(err)}`);
        // Rollback state on error
        this.syncSupabase();
      }
    } else {
      setDoc(doc(this.db, 'collaborators', refreshedCol.id), refreshedCol).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `collaborators/${refreshedCol.id}`);
      });
    }
  }

  async clearAllScales() {
    const list = this.collaborators();
    if (!list || list.length === 0) return;

    this.isProcessing.set(true);

    const updatedList = list.map(collab => {
      const emptyScale: { [day: number]: string } = {};
      for (let d = 1; d <= 31; d++) {
        emptyScale[d] = '-';
      }
      return { ...collab, folgaRequests: [], scale: emptyScale };
    });
    this.collaborators.set(updatedList);

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const collabRows: any[] = [];
        
        updatedList.forEach(refreshed => {
          collabRows.push({
            id: refreshed.id,
            name: refreshed.name,
            role: refreshed.role,
            schedule: refreshed.hours,
            shift: refreshed.shift,
            sector: refreshed.sector,
            bh_balance: refreshed.bhBalance,
            score: refreshed.score,
            birthday: refreshed.birthday || null,
            special_dates: refreshed.specialDates || null,
            folga_requests: []
          });
        });

        const COLLAB_CHUNK_SIZE = 100;
        for (let i = 0; i < collabRows.length; i += COLLAB_CHUNK_SIZE) {
          const chunk = collabRows.slice(i, i + COLLAB_CHUNK_SIZE);
          const { error: upErr } = await this.supabase.from('colaboradores').upsert(chunk);
          if (upErr) throw upErr;
        }

        const scaleRows: any[] = [];
        updatedList.forEach(refreshed => {
          for (let d = 1; d <= 31; d++) {
            scaleRows.push({
              collaborator_id: refreshed.id,
              day: d,
              month: 7,
              year: 2026,
              value: '-'
            });
          }
        });

        const SCALE_CHUNK_SIZE = 400;
        for (let i = 0; i < scaleRows.length; i += SCALE_CHUNK_SIZE) {
          const chunk = scaleRows.slice(i, i + SCALE_CHUNK_SIZE);
          const { error: scaleErr } = await this.supabase.from('escala_diaria').upsert(chunk);
          if (scaleErr) throw scaleErr;
        }

        await this.syncSupabase();
        this.addAuditHistory('LIMPAR_ESCALA', 'Toda a escala mensal de trabalho foi redefinida para Sem Definição (-).');
      } catch (err: any) {
        console.error('Error in clearAllScales:', err);
        this.databaseError.set(`Falha ao limpar escala: ${err.message || err.details || err.hint || JSON.stringify(err)}`);
      } finally {
        this.isProcessing.set(false);
      }
    } else {
      const promises = updatedList.map(refreshed => {
        return setDoc(doc(this.db, 'collaborators', refreshed.id), refreshed);
      });

      Promise.all(promises)
        .then(() => {
          this.addAuditHistory('LIMPAR_ESCALA', 'Toda a escala mensal de trabalho foi redefinida para Sem Definição (-).');
        })
        .catch((err) => {
          console.error('Error clearing scales in Firebase:', err);
        })
        .finally(() => {
          this.isProcessing.set(false);
        });
    }
  }

  async saveUpdatedListToDb(updatedList: Collaborator[], action: string, description: string) {
    this.isProcessing.set(true);
    this.collaborators.set(updatedList);

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const scaleRows: any[] = [];
        const collabRows: any[] = [];
        
        updatedList.forEach(refreshed => {
          for (let d = 1; d <= 31; d++) {
            scaleRows.push({
              collaborator_id: refreshed.id,
              day: d,
              month: 7,
              year: 2026,
              value: refreshed.scale[d] || '-'
            });
          }
          
          collabRows.push({
            id: refreshed.id,
            name: refreshed.name,
            role: refreshed.role,
            schedule: refreshed.hours,
            shift: refreshed.shift,
            sector: refreshed.sector,
            bh_balance: refreshed.bhBalance,
            score: refreshed.score,
            birthday: refreshed.birthday || null,
            special_dates: refreshed.specialDates || null,
            folga_requests: refreshed.folgaRequests || null
          });
        });

        // 1. Chunked saving of collaborators (100 in each chunk)
        const COLLAB_CHUNK_SIZE = 100;
        for (let i = 0; i < collabRows.length; i += COLLAB_CHUNK_SIZE) {
          const chunk = collabRows.slice(i, i + COLLAB_CHUNK_SIZE);
          const { error: collabErr } = await this.supabase.from('colaboradores').upsert(chunk);
          if (collabErr) throw collabErr;
        }

        // 2. Chunked saving of scale rows (400 in each chunk)
        const SCALE_CHUNK_SIZE = 400;
        for (let i = 0; i < scaleRows.length; i += SCALE_CHUNK_SIZE) {
          const chunk = scaleRows.slice(i, i + SCALE_CHUNK_SIZE);
          const { error: scaleErr } = await this.supabase.from('escala_diaria').upsert(chunk);
          if (scaleErr) throw scaleErr;
        }

        // 3. Robust Verification Algorithm to ensure ALL collaborators are saved in Supabase with retry logic
        let attempts = 0;
        let missingCollabs: Collaborator[] = [];
        let incompleteCollabs: Collaborator[] = [];
        
        while (attempts < 3) {
          const { data: dbCollabs, error: verifyCollabErr } = await this.supabase
            .from('colaboradores')
            .select('id');
          if (verifyCollabErr) throw verifyCollabErr;

          const dbCollabIds = new Set(dbCollabs.map((c: any) => c.id));
          missingCollabs = updatedList.filter(c => !dbCollabIds.has(c.id));

          const dbScales = await this.fetchAllScaleRows(7, 2026);

          // Group scales by collaborator ID to verify they each have all 31 days
          const scaleCountMap = new Map<string, number>();
          dbScales.forEach((row: any) => {
            scaleCountMap.set(row.collaborator_id, (scaleCountMap.get(row.collaborator_id) || 0) + 1);
          });

          incompleteCollabs = updatedList.filter(c => (scaleCountMap.get(c.id) || 0) < 31);

          if (missingCollabs.length === 0 && incompleteCollabs.length === 0) {
            break; // Success! Verified perfectly
          }

          attempts++;
          if (attempts < 3) {
            // Wait 500ms for Supabase replication index to settle
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        if (missingCollabs.length > 0) {
          throw new Error(`Erro de verificação: ${missingCollabs.length} colaboradores não foram gravados no Supabase.`);
        }

        if (incompleteCollabs.length > 0) {
          throw new Error(`Erro de verificação: Escalas incompletas na base de dados para: ${incompleteCollabs.map(c => c.name).join(', ')}`);
        }

        await this.syncSupabase();
        this.addAuditHistory(action, description);
        this.databaseError.set(null); // Clear errors
        
        // Only release loading when successfully complete and completely verified
        this.isProcessing.set(false);
      } catch (err: any) {
        console.error(`Error in saveUpdatedListToDb for ${action}:`, err);
        this.databaseError.set(`Falha ao salvar alterações: ${err.message || err.details || err.hint || JSON.stringify(err)}`);
        // We do NOT set isProcessing to false to keep the screen locked in case of verify failures
      }
    } else {
      // Firebase Integration
      const promises = updatedList.map(refreshed => {
        return setDoc(doc(this.db, 'collaborators', refreshed.id), refreshed);
      });

      Promise.all(promises)
        .then(() => {
          this.addAuditHistory(action, description);
          this.isProcessing.set(false);
        })
        .catch((err) => {
          console.error(`Error saving to Firebase in ${action}:`, err);
        });
    }
  }

  async generateDobradinhas() {
    const list = this.collaborators();
    if (!list || list.length === 0) return;

    const weekends = [
      { sat: 4, sun: 5 },
      { sat: 11, sun: 12 },
      { sat: 18, sun: 19 },
      { sat: 25, sun: 26 }
    ];

    const updatedList = list.map((collab, index) => {
      const updatedScale = { ...collab.scale };
      if (collab.role === 'OPERADOR') {
        // Clear any previous Saturday/Sunday 'X' to generate a clean, single Dobradinha
        for (const w of weekends) {
          if (updatedScale[w.sat] === 'X') updatedScale[w.sat] = '-';
          if (updatedScale[w.sun] === 'X') updatedScale[w.sun] = '-';
        }
        
        const weekend = weekends[index % weekends.length];
        updatedScale[weekend.sat] = 'X';
        updatedScale[weekend.sun] = 'X';
      }
      return { ...collab, scale: updatedScale };
    });

    await this.saveUpdatedListToDb(
      updatedList,
      'GERAR_DOBRADINHAS',
      'Dobradinhas de Sábado e Domingo distribuídas com sucesso para os operadores.'
    );
  }

  async generateSabados() {
    const list = this.collaborators();
    if (!list || list.length === 0) return;

    const allSaturdays = [4, 11, 18, 25];
    const weekends = [
      { sat: 4, sun: 5 },
      { sat: 11, sun: 12 },
      { sat: 18, sun: 19 },
      { sat: 25, sun: 26 }
    ];

    const updatedList = list.map((collab, index) => {
      const updatedScale = { ...collab.scale };
      
      // Clean previously generated single Saturdays (keeping Dobradinhas intact)
      allSaturdays.forEach(sat => {
        const w = weekends.find(wk => wk.sat === sat);
        const isDobr = w && updatedScale[w.sat] === 'X' && updatedScale[w.sun] === 'X';
        if (!isDobr && updatedScale[sat] === 'X') {
          updatedScale[sat] = '-';
        }
      });

      // Avoid weekends that are already Dobradinhas
      const dobradinhaSats = new Set<number>();
      weekends.forEach(w => {
        if (updatedScale[w.sat] === 'X' && updatedScale[w.sun] === 'X') {
          dobradinhaSats.add(w.sat);
        }
      });

      const allowedSats = allSaturdays.filter(sat => {
        if (dobradinhaSats.has(sat)) return false;
        return updatedScale[sat] === '-';
      });
      
      if (allowedSats.length > 0) {
        // Distribute mathematically stable Saturdays using the index offset
        const chosenSat = allowedSats[index % allowedSats.length];
        updatedScale[chosenSat] = 'X';
      }

      return { ...collab, scale: updatedScale };
    });

    await this.saveUpdatedListToDb(
      updatedList,
      'GERAR_SABADOS',
      'Sábados adicionais distribuídos com sucesso, evitando as dobradinhas.'
    );
  }

  async generateDomingos() {
    const list = this.collaborators();
    if (!list || list.length === 0) return;

    const allSundays = [5, 12, 19, 26];
    const weekends = [
      { sat: 4, sun: 5 },
      { sat: 11, sun: 12 },
      { sat: 18, sun: 19 },
      { sat: 25, sun: 26 }
    ];

    const updatedList = list.map((collab, index) => {
      const updatedScale = { ...collab.scale };
      
      // Clean previously generated single Sundays (keeping Dobradinhas intact)
      allSundays.forEach(sun => {
        const w = weekends.find(wk => wk.sun === sun);
        const isDobr = w && updatedScale[w.sat] === 'X' && updatedScale[w.sun] === 'X';
        if (!isDobr && updatedScale[sun] === 'X') {
          updatedScale[sun] = '-';
        }
      });

      // Mathematically select a Sunday that is completely separate and distant from Saturdays off
      const allowedSuns = allSundays.filter(sun => {
        const w = weekends.find(wk => wk.sun === sun);
        if (!w) return false;

        const satVal = updatedScale[w.sat];
        const sunVal = updatedScale[w.sun];

        // 1. Saturday of this weekend cannot be off (to avoid creating any double dobradinha)
        const isSatOff = satVal === 'X' || satVal === 'LP' || satVal === 'F';
        if (isSatOff) return false;

        // 2. Sunday itself cannot already be off
        const isSunOff = sunVal === 'X' || sunVal === 'LP' || sunVal === 'F';
        if (isSunOff) return false;

        return true;
      });
      
      if (allowedSuns.length > 0) {
        // Distribute mathematically stable Sundays using the index offset
        const chosenSun = allowedSuns[index % allowedSuns.length];
        updatedScale[chosenSun] = 'X';
      }

      return { ...collab, scale: updatedScale };
    });

    await this.saveUpdatedListToDb(
      updatedList,
      'GERAR_DOMINGOS',
      'Domingos adicionais distribuídos com sucesso, evitando as dobradinhas.'
    );
  }

  async generateAutoScale() {
    const list = this.collaborators();
    if (!list || list.length === 0) return;

    this.isProcessing.set(true);
    try {
      const weekends = [
        { sat: 4, sun: 5 },
        { sat: 11, sun: 12 },
        { sat: 18, sun: 19 },
        { sat: 25, sun: 26 }
      ];

      // 1. Reset scale and generate Dobradinhas for Operators
      let updatedList = list.map((collab, index) => {
        const updatedScale: { [day: number]: string } = {};
        for (let d = 1; d <= 31; d++) {
          updatedScale[d] = '-';
        }
        if (collab.role === 'OPERADOR') {
          const weekend = weekends[index % weekends.length];
          updatedScale[weekend.sat] = 'X';
          updatedScale[weekend.sun] = 'X';
        }
        return { ...collab, scale: updatedScale };
      });

      // 2. Generate Saturdays for everyone
      const allSaturdays = [4, 11, 18, 25];
      updatedList = updatedList.map((collab, index) => {
        const updatedScale = { ...collab.scale };
        const dobradinhaSats = new Set<number>();
        weekends.forEach(w => {
          if (updatedScale[w.sat] === 'X' && updatedScale[w.sun] === 'X') {
            dobradinhaSats.add(w.sat);
          }
        });

        const allowedSats = allSaturdays.filter(sat => {
          if (dobradinhaSats.has(sat)) return false;
          return updatedScale[sat] === '-';
        });

        if (allowedSats.length > 0) {
          const chosenSat = allowedSats[index % allowedSats.length];
          updatedScale[chosenSat] = 'X';
        }
        return { ...collab, scale: updatedScale };
      });

      // 3. Generate Sundays for everyone (strictly non-overlapping)
      const allSundays = [5, 12, 19, 26];
      updatedList = updatedList.map((collab, index) => {
        const updatedScale = { ...collab.scale };
        const allowedSuns = allSundays.filter(sun => {
          const w = weekends.find(wk => wk.sun === sun);
          if (!w) return false;
          
          const satVal = updatedScale[w.sat];
          const sunVal = updatedScale[w.sun];

          const isSatOff = satVal === 'X' || satVal === 'LP' || satVal === 'F';
          if (isSatOff) return false;

          const isSunOff = sunVal === 'X' || sunVal === 'LP' || sunVal === 'F';
          if (isSunOff) return false;

          return true;
        });

        if (allowedSuns.length > 0) {
          const chosenSun = allowedSuns[index % allowedSuns.length];
          updatedScale[chosenSun] = 'X';
        }
        return { ...collab, scale: updatedScale };
      });

      // 4. Auto apply birthday and special holiday requests
      updatedList = updatedList.map(collab => {
        return this.refreshPreSelectedFolgas(collab, true);
      });

      await this.saveUpdatedListToDb(
        updatedList,
        'GERAR_AUTO',
        'Escala automatizada inteligente gerada para dobradinhas, sábados e domingos.'
      );
    } finally {
      this.isProcessing.set(false);
    }
  }

  getShiftDetails(code: string, collabShift: string): { hours: number, factor: number } {
    const shiftType = this.shiftTypes().find(s => s.code.trim().toUpperCase() === code);
    
    let hours = 9; // default 9h
    let startTime = '06:00'; // default daytime
    
    if (shiftType) {
      if (shiftType.hours) {
        const hStr = shiftType.hours.toString().toLowerCase().trim();
        if (hStr.includes('h')) {
          const parts = hStr.split('h');
          const hh = parseFloat(parts[0]) || 0;
          const mm = parseFloat(parts[1]) || 0;
          hours = hh + (mm / 60);
        } else {
          hours = parseFloat(hStr) || 9;
        }
      }
      if (shiftType.startTime) {
        startTime = shiftType.startTime;
      } else {
        if (shiftType.code === 'M') startTime = '06:00';
        else if (shiftType.code === 'T') startTime = '14:00';
        else if (shiftType.code === 'N') startTime = '22:00';
        else if (shiftType.code === 'ADM') startTime = '08:00';
      }
    } else {
      const normCode = code.toUpperCase().trim();
      if (normCode === 'M') {
        hours = 9;
        startTime = '06:00';
      } else if (normCode === 'T') {
        hours = 8.8;
        startTime = '14:42';
      } else if (normCode === 'N') {
        hours = 8;
        startTime = '22:00';
      } else if (normCode === 'ADM') {
        hours = 9;
        startTime = '08:00';
      } else {
        const baseShift = (collabShift || '').toUpperCase().trim();
        if (baseShift === 'MANHÃ') {
          hours = 9;
          startTime = '06:00';
        } else if (baseShift === 'TARDE') {
          hours = 8.8;
          startTime = '14:42';
        } else if (baseShift === 'NOITE' || baseShift === 'MADRUGADA') {
          hours = 8;
          startTime = '22:00';
        } else if (baseShift === 'ADMINISTRATIVO' || baseShift === 'ADM') {
          hours = 9;
          startTime = '08:00';
        }
      }
    }
    
    let factor = 1.0;
    const match = startTime.match(/^(\d+):(\d+)/);
    if (match) {
      const hr = parseInt(match[1]);
      if (hr >= 5 && hr <= 13) {
        factor = 1.0;
      } else if (hr >= 14 && hr <= 20) {
        factor = 1.15;
      } else {
        factor = 1.4;
      }
    }
    
    return { hours, factor };
  }

  calculateEnergyAndFatigue(collab: Collaborator) {
    const scale = collab.scale || {};
    let energy = 100;
    let consecutiveWorkDays = 0;
    let maxConsecutiveWorkDays = 0;
    let bankHours = collab.bhBalance || 0;
    let totalHoursWorked = 0;
    let alertaLimite = false;
    const daysCount = 30; // June 2026 has 30 days
    
    for (let d = 1; d <= daysCount; d++) {
      const val = (scale[d] || '-').toUpperCase().trim();
      const isRest = val === 'X' || val === 'BH' || val === 'F' || val === 'LM' || val === 'CP' || val === 'AT' || val === 'W' || val === 'FO' || val === 'P' || val === 'R' || val === 'EX';
      
      if (isRest) {
        consecutiveWorkDays = 0;
        if (val === 'F') {
          energy = 100;
        } else {
          energy = Math.min(100, energy + 50);
        }
      } else {
        consecutiveWorkDays++;
        if (consecutiveWorkDays > maxConsecutiveWorkDays) {
          maxConsecutiveWorkDays = consecutiveWorkDays;
        }
        
        const { hours, factor } = this.getShiftDetails(val, collab.shift);
        totalHoursWorked += hours;
        
        const desgasteDia = (hours / 9) * 20 * factor;
        energy = energy - desgasteDia;
      }
      
      if (consecutiveWorkDays >= 5) {
        alertaLimite = true;
      }
    }
    
    const displayEnergy = Math.max(0, Math.round(energy));
    const isDeficit = energy < 0;
    const deficitValue = isDeficit ? Math.abs(Math.round(energy)) : 0;
    
    let colorClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    let badgeColor = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    let energyStatus: 'Excelente' | 'Bom' | 'Alerta' | 'Crítico' = 'Excelente';
    
    if (displayEnergy < 30) {
      colorClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      badgeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';
      energyStatus = 'Crítico';
    } else if (displayEnergy <= 60) {
      colorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
      energyStatus = 'Alerta';
    } else {
      if (displayEnergy >= 85) {
        energyStatus = 'Excelente';
      } else {
        energyStatus = 'Bom';
      }
    }
    
    return {
      energy: displayEnergy,
      energyRaw: energy,
      isDeficit,
      deficitValue,
      consecutiveWorkDays,
      maxConsecutiveWorkDays,
      totalHoursWorked: parseFloat(totalHoursWorked.toFixed(1)),
      alertaLimite,
      colorClass,
      badgeColor,
      energyStatus,
      bankHours
    };
  }

  getDailyEnergyArray(collab: Collaborator): number[] {
    const scale = collab.scale || {};
    let energy = 100;
    const result: number[] = [];
    const daysCount = 30;
    
    for (let d = 1; d <= daysCount; d++) {
      const val = (scale[d] || '-').toUpperCase().trim();
      const isRest = val === 'X' || val === 'BH' || val === 'F' || val === 'LM' || val === 'CP' || val === 'AT' || val === 'W' || val === 'FO' || val === 'P' || val === 'R' || val === 'EX';
      
      if (isRest) {
        if (val === 'F') {
          energy = 100;
        } else {
          energy = Math.min(100, energy + 50);
        }
      } else {
        const { hours, factor } = this.getShiftDetails(val, collab.shift);
        const desgasteDia = (hours / 9) * 20 * factor;
        energy = energy - desgasteDia;
      }
      result.push(Math.max(0, Math.round(energy)));
    }
    return result;
  }

  ordenarPorAptidao(collabs: Collaborator[]): any[] {
    const collabsWithEnergy = collabs.map(collab => {
      const energyData = this.calculateEnergyAndFatigue(collab);
      
      let lastRestStreak = 0;
      const scale = collab.scale || {};
      for (let d = 30; d >= 1; d--) {
        const val = (scale[d] || '-').toUpperCase().trim();
        const isRest = val === 'X' || val === 'BH' || val === 'F' || val === 'LM' || val === 'CP' || val === 'AT' || val === 'W' || val === 'FO' || val === 'P' || val === 'R' || val === 'EX';
        if (isRest) {
          lastRestStreak++;
        } else {
          break;
        }
      }
      
      return {
        collab,
        energyData,
        lastRestStreak
      };
    });
    
    collabsWithEnergy.sort((a, b) => {
      if (b.energyData.energy !== a.energyData.energy) {
        return b.energyData.energy - a.energyData.energy;
      }
      if (b.lastRestStreak !== a.lastRestStreak) {
        return b.lastRestStreak - a.lastRestStreak;
      }
      if (a.energyData.bankHours !== b.energyData.bankHours) {
        return a.energyData.bankHours - b.energyData.bankHours;
      }
      return a.collab.name.localeCompare(b.collab.name);
    });
    
    return collabsWithEnergy;
  }

  async addSiglaType(code: string, label: string, color: string, description: string, textColor?: string) {
    if (!code || !label) return;
    const upperCode = code.toUpperCase().trim();
    const newSigla: SiglaType = {
      code: upperCode,
      label,
      color,
      description,
      ...(textColor ? { textColor } : {})
    };

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const payload = {
          code: newSigla.code,
          label: newSigla.label,
          color: newSigla.color,
          description: newSigla.description
        };
        const res = await this.supabase.from('sigla_types').upsert(payload);
        if (res.error) throw res.error;
        this.syncSupabase();
        this.addAuditHistory('CADASTRO_SIGLA', `Nova sigla ${upperCode} cadastrada no Supabase.`);
      } catch (err: any) {
        console.error(err);
      }
    } else {
      setDoc(doc(this.db, 'siglaTypes', upperCode), newSigla).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `siglaTypes/${upperCode}`);
      });
      this.addAuditHistory('CADASTRO_SIGLA', `Nova sigla ${upperCode} cadastrada no Firebase.`);
    }
  }

  async removeSiglaType(code: string) {
    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const res = await this.supabase.from('sigla_types').delete().eq('code', code);
        if (res.error) throw res.error;
        this.syncSupabase();
        this.addAuditHistory('REMOCAO_SIGLA', `Sigla ${code} removida do Supabase.`);
      } catch (err: any) {
        console.error(err);
      }
    } else {
      deleteDoc(doc(this.db, 'siglaTypes', code)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `siglaTypes/${code}`);
      });
      this.addAuditHistory('REMOCAO_SIGLA', `Sigla ${code} removida do Firebase.`);
    }
  }

  async saveSiglaType(sigla: SiglaType) {
    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const payload = {
          code: sigla.code,
          label: sigla.label,
          color: sigla.color,
          description: sigla.description
        };
        const res = await this.supabase.from('sigla_types').upsert(payload);
        if (res.error) throw res.error;
        await this.syncSupabase();
      } catch (err: any) {
        console.error('Error in saveSiglaType (Supabase):', err);
        throw err;
      }
    } else {
      try {
        await setDoc(doc(this.db, 'siglaTypes', sigla.code), sigla);
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `siglaTypes/${sigla.code}`);
        throw err;
      }
    }
  }

  async updateSiglaTypeCode(oldCode: string, newSigla: SiglaType) {
    const newCode = newSigla.code.toUpperCase().trim();
    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        // 1. Insert the new sigla type
        const payload = {
          code: newSigla.code,
          label: newSigla.label,
          color: newSigla.color,
          description: newSigla.description
        };
        const insRes = await this.supabase.from('sigla_types').insert(payload);
        if (insRes.error) throw insRes.error;

        // 2. Update all escala_diaria rows where value === oldCode to newCode
        const updRes = await this.supabase
          .from('escala_diaria')
          .update({ value: newCode })
          .eq('value', oldCode);
        if (updRes.error) throw updRes.error;

        // 3. Delete the old sigla type
        const delRes = await this.supabase
          .from('sigla_types')
          .delete()
          .eq('code', oldCode);
        if (delRes.error) throw delRes.error;

        // 4. Update the local collaborator scales in memory
        const updatedCollabs = this.collaborators().map(collab => {
          const updatedScale = { ...collab.scale };
          let changed = false;
          for (let d = 1; d <= 31; d++) {
            if (updatedScale[d] === oldCode) {
              updatedScale[d] = newCode;
              changed = true;
            }
          }
          return changed ? { ...collab, scale: updatedScale } : collab;
        });
        this.collaborators.set(updatedCollabs);

        // 5. Sync and log
        await this.syncSupabase();
      } catch (err: any) {
        console.error('Error renaming sigla code in Supabase:', err);
        throw err;
      }
    } else {
      // Firebase Integration
      try {
        // 1. Save new sigla doc
        await setDoc(doc(this.db, 'siglaTypes', newCode), newSigla);

        // 2. Update all collaborators in Firebase
        const updatedCollabs = this.collaborators().map(collab => {
          const updatedScale = { ...collab.scale };
          let changed = false;
          for (let d = 1; d <= 31; d++) {
            if (updatedScale[d] === oldCode) {
              updatedScale[d] = newCode;
              changed = true;
            }
          }
          return changed ? { ...collab, scale: updatedScale } : collab;
        });

        const promises = updatedCollabs.map(collab => {
          return setDoc(doc(this.db, 'collaborators', collab.id), collab);
        });
        await Promise.all(promises);

        // 3. Delete old sigla doc
        await deleteDoc(doc(this.db, 'siglaTypes', oldCode));

        // 4. Update state and log
        this.collaborators.set(updatedCollabs);
      } catch (err: any) {
        console.error('Error renaming sigla code in Firebase:', err);
        throw err;
      }
    }
  }

  async saveShiftType(shift: ShiftType) {
    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const res = await this.supabase.from('shift_types').upsert(shift);
        if (res.error) throw res.error;
        this.syncSupabase();
      } catch (err: any) {
        console.error(err);
      }
    } else {
      setDoc(doc(this.db, 'shiftTypes', shift.code), shift).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `shiftTypes/${shift.code}`);
      });
    }
  }

  async removeShiftType(code: string) {
    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const res = await this.supabase.from('shift_types').delete().eq('code', code);
        if (res.error) throw res.error;
        this.syncSupabase();
      } catch (err: any) {
        console.error(err);
      }
    } else {
      deleteDoc(doc(this.db, 'shiftTypes', code)).catch((err) => {
        handleFirestoreError(err, OperationType.DELETE, `shiftTypes/${code}`);
      });
    }
  }

  async addAuditHistory(action: string, description: string) {
    const now = new Date();
    const ts = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const id = 'bk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const newHistory: BackupHistory = {
      id,
      timestamp: ts,
      author: this.selectedCollabName() || 'ADMINISTRADOR',
      action,
      description
    };

    if (this.activeDb() === 'supabase' && this.supabase) {
      try {
        const res = await this.supabase.from('audit_history').upsert(newHistory);
        if (res.error) throw res.error;
        this.syncSupabase();
      } catch (err: any) {
        console.error(err);
      }
    } else {
      setDoc(doc(this.db, 'auditHistory', id), newHistory).catch((err) => {
        handleFirestoreError(err, OperationType.WRITE, `auditHistory/${id}`);
      });
    }
  }

}
