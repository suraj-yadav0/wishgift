import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// 1. Migrate Turso DB
async function migrateTurso() {
  const url = process.env.DATABASE_URL;
  if (!url) return;

  try {
    console.log('--- Migrating Turso Database ---');
    const client = createClient({ url });
    const info = await client.execute("PRAGMA table_info('Follow')");
    const hasStatus = info.rows.some(r => r.name === 'status');
    if (!hasStatus) {
      console.log('Adding status column to Turso Follow table...');
      await client.execute("ALTER TABLE Follow ADD COLUMN status TEXT DEFAULT 'PENDING'");
    } else {
      console.log('status column already exists on Turso Follow table.');
    }
    const result = await client.execute("UPDATE Follow SET status = 'ACCEPTED' WHERE status IS NULL OR status = 'PENDING'");
    console.log(`Updated ${result.rowsAffected} legacy follow records to ACCEPTED on Turso.`);
    client.close();
  } catch (err) {
    console.error('Turso migration notice:', err.message || err);
  }
}

// 2. Migrate Local custom.db if it exists
async function migrateLocalSqlite() {
  const localDbPath = path.join(process.cwd(), 'db', 'custom.db');
  if (!fs.existsSync(localDbPath)) {
    console.log('No local db/custom.db file found.');
    return;
  }

  try {
    console.log('--- Migrating Local db/custom.db ---');
    const client = createClient({ url: `file:${localDbPath}` });
    const info = await client.execute("PRAGMA table_info('Follow')");
    const hasStatus = info.rows.some(r => r.name === 'status');
    if (!hasStatus) {
      console.log('Adding status column to local custom.db Follow table...');
      await client.execute("ALTER TABLE Follow ADD COLUMN status TEXT DEFAULT 'PENDING'");
    } else {
      console.log('status column already exists on local custom.db Follow table.');
    }
    const result = await client.execute("UPDATE Follow SET status = 'ACCEPTED' WHERE status IS NULL OR status = 'PENDING'");
    console.log(`Updated ${result.rowsAffected} legacy follow records to ACCEPTED on local custom.db.`);
    client.close();
  } catch (err) {
    console.error('Local db migration notice:', err.message || err);
  }
}

async function main() {
  await migrateTurso();
  await migrateLocalSqlite();
  console.log('--- Database Migration Complete ---');
}

main();
