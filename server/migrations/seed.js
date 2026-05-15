const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  try {
    const existing = await db.query("SELECT id FROM users WHERE email = 'admin@example.com'");
    if (existing.rows.length) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    const hashed = await bcrypt.hash('admin123', 10);
    await db.query(
      "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@example.com', $1, 'admin')",
      [hashed]
    );
    console.log('Admin user created: admin@example.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
