import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://vefyegxmvjficncbetyp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c");
async function test() {
  const queryCollabs = supabase.from('colaboradores').select('*');
  const querySiglas = supabase.from('sigla_types').select('*');
  const queryShifts = supabase.from('shift_types').select('*');
  const queryAudit = supabase.from('audit_history').select('*');
  
  const [collabs, siglas, shifts, audit] = await Promise.all([queryCollabs, querySiglas, queryShifts, queryAudit]);
  console.log("Collabs Error:", collabs.error);
  console.log("Siglas Error:", siglas.error);
  console.log("Shifts Error:", shifts.error);
  console.log("Audit Error:", audit.error);
}
test();
