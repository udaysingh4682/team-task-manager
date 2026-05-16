const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  try {
    // Log connection info for debugging (mask password)
    const dbUrl = process.env.DATABASE_URL || 'NOT SET';
    const maskedUrl = dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('DATABASE_URL:', maskedUrl);

    const sql = fs.readFileSync(
      path.join(__dirname, '001_initial.sql'),
      'utf8'
    );
    await db.query(sql);
    console.log('Migrations ran successfully');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    // Exit with 0 so the server still starts (tables may already exist)
    process.exit(0);
  }
}

runMigrations();

