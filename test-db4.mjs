import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://vefyegxmvjficncbetyp.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c");
async function test() {
  const { data, error } = await supabase.from('escala_diaria').select('*').eq('month', 7).eq('year', 2026).range(2000, 2999);
  console.log("Error:", error);
  console.log("Data count:", data?.length);
}
test();
