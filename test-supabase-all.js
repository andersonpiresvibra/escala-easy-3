const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vefyegxmvjficncbetyp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const tables = ['colaboradores', 'escala_diaria', 'sigla_types', 'shift_types', 'audit_history'];
  for (const table of tables) {
    console.log(`\n--- Fetching from: ${table} ---`);
    const { data, error } = await supabase.from(table).select('*').limit(2);
    if (error) {
      console.error(`Error in ${table}:`, error);
    } else {
      console.log(`Success in ${table}. Count: ${data.length}`);
      if (data.length > 0) {
        console.log('Sample data:', data[0]);
      }
    }
  }
}
run();
