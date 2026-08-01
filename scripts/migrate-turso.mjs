import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is missing in environment');
  process.exit(1);
}

console.log('Connecting to Turso/LibSQL database...');

const client = createClient({
  url: process.env.DATABASE_URL,
});

async function main() {
  try {
    console.log('Checking Follow table columns...');
    const info = await client.execute("PRAGMA table_info('Follow')");
    console.log('Columns in Follow table:', info.rows.map(r => r.name));

    const hasStatus = info.rows.some(r => r.name === 'status');
    if (!hasStatus) {
      console.log('Adding status column to Follow table...');
      await client.execute("ALTER TABLE Follow ADD COLUMN status TEXT DEFAULT 'PENDING'");
      console.log('Successfully added status column to Follow table!');
    } else {
      console.log('status column already exists on Follow table.');
    }

    console.log('Updating legacy follow records to ACCEPTED status...');
    const result = await client.execute("UPDATE Follow SET status = 'ACCEPTED' WHERE status IS NULL OR status = 'PENDING'");
    console.log(`Updated ${result.rowsAffected} legacy follow records to ACCEPTED status.`);
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.close();
  }
}

main();
