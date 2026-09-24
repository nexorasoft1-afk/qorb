
import { config } from "dotenv";
import { Client } from "pg";

config({ path: ".env.local" });

async function test() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌ DATABASE_URL غير موجود في .env.local");
    return;
  }

  try {
    const url = new URL(connectionString);

    console.log("🔎 Host:", url.hostname);
    console.log("🔎 Port:", url.port);
    console.log("🔎 User:", decodeURIComponent(url.username));
    console.log("🔎 Database:", url.pathname.replace("/", ""));

    const client = new Client({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000,
    });

    await client.connect();

    const result = await client.query(`
      SELECT
        current_database() AS database,
        version() AS version,
        extensions.postgis_version() AS postgis
    `);

    console.log("✅ Connected");
    console.log("✅ Database:", result.rows[0].database);
    console.log("✅ PostgreSQL:", result.rows[0].version);
    console.log("✅ PostGIS:", result.rows[0].postgis);

    await client.end();
  } catch (error: unknown) {
    console.error("❌ Connection failed");

    if (error instanceof Error) {
      console.error("Name:", error.name);
      console.error("Message:", error.message);
    } else {
      console.error("Unknown error:", error);
    }

    const dbError = error as {
      code?: string;
      cause?: unknown;
      errors?: unknown[];
    };

    if (dbError.code) {
      console.error("Code:", dbError.code);
    }

    if (dbError.cause) {
      console.error("Cause:", dbError.cause);
    }

    if (Array.isArray(dbError.errors)) {
      console.error("Sub-errors:");

      for (const item of dbError.errors) {
        if (item instanceof Error) {
          console.error({
            name: item.name,
            message: item.message,
          });
        } else {
          console.error(item);
        }
      }
    }
  }
}

test();

