import postgres from 'postgres';
const sql = postgres('postgres://urbanmg:U4VqBQ8mmtTS4BGdyd45GmYI7oO0Lqe@localhost:5432/postgres', { max: 1 });
const rows = await sql`SELECT datname FROM pg_database ORDER BY datname`;
console.log(rows.map((r) => r.datname));
await sql.end();
