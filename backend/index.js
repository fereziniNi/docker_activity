const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "postgres",
  database: process.env.DB_NAME || "counter_db",
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS counter (
        id SERIAL PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      )
    `);
    const result = await client.query("SELECT COUNT(*) FROM counter");
    if (parseInt(result.rows[0].count) === 0) {
      await client.query("INSERT INTO counter (count) VALUES (0)");
    }
    console.log("✅ Database initialized");
  } finally {
    client.release();
  }
}

app.get("/api/count", async (req, res) => {
  try {
    const result = await pool.query("SELECT count FROM counter WHERE id = 1");
    res.json({ count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/count", async (req, res) => {
  try {
    const result = await pool.query(
      "UPDATE counter SET count = count + 1 WHERE id = 1 RETURNING count"
    );
    res.json({ count: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

async function waitForDB(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      return true;
    } catch {
      console.log(`⏳ Waiting for DB... (${i + 1}/${retries})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("Could not connect to database");
}

const PORT = process.env.PORT || 3001;

waitForDB()
  .then(initDB)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  });
