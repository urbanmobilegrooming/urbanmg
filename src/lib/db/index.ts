import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is not set');

declare global {
  // eslint-disable-next-line no-var
  var __urbanmg_pg: ReturnType<typeof postgres> | undefined;
}

const client = globalThis.__urbanmg_pg ?? postgres(connectionString, { max: 10 });
if (process.env.NODE_ENV !== 'production') globalThis.__urbanmg_pg = client;

export const db = drizzle(client, { schema });
export { client as pgClient };
export { schema };
