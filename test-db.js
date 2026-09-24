require("dotenv").config({ path: ".env.local" });
const { Client } = require("pg");

async function test() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();

    const result = await client.query(`
      SELECT
        current_database() AS database,
        version() AS version,
        PostGIS_Version() AS postgis
    `);

    console.log("✅ Database:", result.rows[0].database);
    console.log("✅ PostgreSQL:", result.rows[0].version.split(" ")[1]);
    console.log("✅ PostGIS:", result.rows[0].postgis);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.end();
  }
}

test();