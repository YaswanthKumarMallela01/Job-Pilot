const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://msuqyvvkirpxspkwzkyo.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zdXF5dnZraXJweHNwa3d6a3lvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODMwNDE5OCwiZXhwIjoyMDkzODgwMTk4fQ.J3Jo98djhd5a4TizMtbjawvIGtZ8u7p3MKU_q74jIaM'
);

async function migrate() {
  // Test if the column already exists by doing an update
  const { data, error } = await supabase
    .from('user_preferences')
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error:', error.message);
    return;
  }
  console.log('Connection OK. Found', data?.length, 'rows');
  console.log('');
  console.log('=== MANUAL STEP REQUIRED ===');
  console.log('Go to Supabase Dashboard -> SQL Editor and run:');
  console.log('');
  console.log("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'any';");
  console.log('');
}

migrate();
