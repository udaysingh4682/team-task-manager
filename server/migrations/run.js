const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '001_initial.sql'),
      'utf8'
    );
    await db.query(sql);
    console.log('Migrations ran successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

runMigrations();
