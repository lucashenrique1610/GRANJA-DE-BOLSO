
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
  }
} catch (e) {
  console.log('Error loading .env.local', e);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .limit(1);

  if (error) {
    console.error(`Error querying ${tableName}:`, error.message);
    return;
  }

  console.log(`Table ${tableName} exists.`);
  if (data && data.length > 0) {
    console.log(`Columns in ${tableName}:`, Object.keys(data[0]));
  } else {
    // If empty, try to insert a dummy to see errors, or just assume it exists.
    // Better: use rpc if possible, but standard select is easiest to check columns if row exists.
    // If no rows, we can't easily see columns with JS client without using metadata API which might not be exposed.
    console.log(`Table ${tableName} is empty, cannot verify columns via select.`);
  }
}

async function run() {
  await checkTable('clientes');
  await checkTable('backups');
  await checkTable('subscriptions');
  await checkTable('pix_transactions');
  await checkTable('profiles');
}

run();
