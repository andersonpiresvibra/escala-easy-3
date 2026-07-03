const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vefyegxmvjficncbetyp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c";
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching colaboradores...');
  const { data, error } = await supabase.from('colaboradores').select('*').limit(1);
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}
run();
