import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
});

export async function query(text: string, params?: unknown[]) {
  const res = await pool.query(text, params);
  return res;
}

export default pool;
