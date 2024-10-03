import { Client } from "pg";
import { environment } from "./src/environments/environment.test";

async function clearTestDatabase(): Promise<boolean> {
  const client = new Client({
    host: environment.dbConfig.host,
    port: environment.dbConfig.port,
    user: environment.dbConfig.user,
    password: environment.dbConfig.password,
    database: environment.dbConfig.database,
  });

  try {
    await client.connect();

    // Get all table names
    const res = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    `);

    // Truncate all tables
    for (let row of res.rows) {
      await client.query(
        `TRUNCATE TABLE "${row.tablename}" RESTART IDENTITY CASCADE`,
      );
    }

    console.log("Test database cleared successfully");
  } catch (err) {
    console.error("Error clearing test database:", err);
    return false;
  } finally {
    await client.end();
  }

  return Promise.resolve(true);
}

export default clearTestDatabase;
