const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = "https://vefyegxmvjficncbetyp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlZnllZ3htdmpmaWNuY2JldHlwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyNjYwMjksImV4cCI6MjA5Nzg0MjAyOX0.ioaZkwS98123Jb2xw2l6vev3FgoLwIVwsitg7pTew7c";
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
  try {
    const month = 7;
    const year = 2026;
    let allRows = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;

    while (hasMore) {
      console.log(`Fetching with range [${from}, ${from + step - 1}]...`);
      const { data, error } = await supabase
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
        console.log(`Fetched ${data.length} rows. Total so far: ${allRows.length}`);
        if (data.length < step) {
          hasMore = false;
        } else {
          from += step;
        }
      } else {
        hasMore = false;
      }
    }
    console.log(`Fetch success! Total rows: ${allRows.length}`);
  } catch (err) {
    console.error('Test Fetch Failed:', err);
  }
}

testFetch();
