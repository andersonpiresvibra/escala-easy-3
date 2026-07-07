const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vefyegxmvjficncbetyp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c";
const supabase = createClient(supabaseUrl, supabaseKey);

function getShiftCode(s) {
  const norm = (s || '').toUpperCase().trim();
  if (norm === 'MANHÃ' || norm === 'M') return 'M';
  if (norm === 'TARDE' || norm === 'T') return 'T';
  if (norm === 'NOITE' || norm === 'MADRUGADA' || norm === 'N') return 'N';
  if (norm === 'ADMINISTRATIVO' || norm === 'ADM') return 'ADM';
  return 'M';
}

function isWorkStatus(code) {
  if (!code) return false;
  const upper = code.trim().toUpperCase();
  if (upper === '-' || upper === '' || upper === '?') return false;
  if (upper === 'T') return true;
  const isNum = /^\d+$/.test(upper) || /^\d+[:.,hH]\d+$/.test(upper);
  if (isNum) return true;
  const shiftCodes = ['M', 'T', 'N', 'T2'];
  if (shiftCodes.includes(upper)) return true;
  const offCodes = ['X', 'F', 'LM', 'CP', 'AT', 'W', 'FO', 'P', 'R', 'EX', 'BH'];
  if (offCodes.includes(upper)) return false;
  return true;
}

async function run() {
  const { data: collabs } = await supabase.from('colaboradores').select('*');
  const { data: escala } = await supabase.from('escala_diaria').select('*');

  const scaleMap = {};
  escala.forEach(e => {
    if (e.month === 7 && e.year === 2026) {
      if (!scaleMap[e.collaborator_id]) scaleMap[e.collaborator_id] = {};
      scaleMap[e.collaborator_id][e.day] = e.value;
    }
  });

  const aeroOps = collabs.filter(c => c.sector === 'AERÓDROMO' && c.role === 'OPERADOR');
  let countWorking = 0;
  console.log(`Total AERODROMO Operators in db: ${aeroOps.length}`);
  
  aeroOps.forEach(c => {
    const rawVal = (scaleMap[c.id] && scaleMap[c.id][1]) || '-';
    const cellVal = (rawVal === '-') ? getShiftCode(c.shift) : rawVal;
    const isWorking = isWorkStatus(cellVal);
    if (isWorking) {
      countWorking++;
      console.log(`Collab: ${c.id}, shift: ${c.shift}, val: ${cellVal}, working: ${isWorking}`);
    }
  });

  console.log(`Working AERODROMO Operators on July 1st: ${countWorking}`);
}
run();
