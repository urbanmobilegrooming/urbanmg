import postgres from 'postgres';

// Connect to default postgres db as urbanmg, and try to create urbanmg database
const sql = postgres({
  host: 'localhost',
  port: 5432,
  user: 'urbanmg',
  password: 'U4VqBQ8mmtTS4BGdyd45GmYI7oO0Lqe',
  database: 'postgres',
  max: 1,
  idle_timeout: 2,
});

try {
  const [{ current_user }] = await sql`SELECT current_user`;
  const [{ rolcreatedb }] = await sql`SELECT rolcreatedb FROM pg_roles WHERE rolname = current_user`;
  console.log('Connected as:', current_user, 'CREATEDB:', rolcreatedb);
  await sql.unsafe('DROP DATABASE IF EXISTS urbanmg');
  await sql.unsafe('CREATE DATABASE urbanmg OWNER urbanmg');
  console.log('Database urbanmg recreated.');
} finally {
  await sql.end();
}
