const express = require('express');
const { Pool } = require('pg');
const logger = require('./logger');

const app = express();
const port = 5000;

app.use(express.json());

/* ---------------- REQUEST LOGGING MIDDLEWARE ---------------- */

app.use((req, res, next) => {
  const start = Date.now();

  logger.info("Incoming Request", {
    method: req.method,
    url: req.url,
    body: req.body
  });

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info("Request Completed", {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration_ms: duration
    });
  });

  next();
});

/* ---------------- DATABASE CONFIG ---------------- */

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'mydb',
  port: 5432
});

// Test DB connection
pool.connect((err, client, release) => {
  if (err) logger.error('DB connection error', { error: err.stack });
  else logger.info('Connected to PostgreSQL database');
  release();
});

/* ---------------- ROUTES ---------------- */

app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    logger.info("Fetched users", { count: result.rows.length });
    res.json(result.rows);
  } catch (err) {
    logger.error("Error fetching users", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    const { username, email, password_hash } = req.body;

    const result = await pool.query(
      'INSERT INTO users(username, email, password_hash) VALUES($1, $2, $3) RETURNING *',
      [username, email, password_hash]
    );

    logger.info("User created", { user: result.rows[0] });

    res.json(result.rows[0]);
  } catch (err) {
    logger.error("Error creating user", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const result = await pool.query(
      'UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *',
      [name, email, id]
    );

    logger.info("User updated", { id, result: result.rows[0] });

    res.json(result.rows[0]);
  } catch (err) {
    logger.error("Error updating user", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM users WHERE id=$1', [id]);

    logger.info("User deleted", { id });

    res.sendStatus(204);
  } catch (err) {
    logger.error("Error deleting user", { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  logger.info("Health check called");
  res.json({ success: true, message: "user-service is working fine" });
});

/* ---------------- GLOBAL ERROR HANDLER ---------------- */

app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack
  });
  res.status(500).send("Internal Server Error");
});

/* ---------------- SERVER START ---------------- */

app.listen(port, () => {
  logger.info(`User service running on port ${port}`);
});
