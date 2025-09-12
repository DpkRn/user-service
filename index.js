const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = 5000;

app.use(express.json());

//this configuration will work only when your server is also running on docker
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'myuser',
  password: process.env.DB_PASSWORD || 'mypassword',
  database: process.env.DB_NAME || 'mydb',
  port: 5432
});

//this configuration would work when your server is running on local and your postgres running on docker having mapping for localhost on 5432
// const pool = new Pool({
//   host: 'localhost',
//   user: 'myuser',
//   password: 'mypassword',
//   database: 'mydb',
//   port: 5432
// });

// Test connection
pool.connect((err, client, release) => {
  if (err) console.error('DB connection error', err.stack);
  else console.log('Connected to PostgreSQL database');
  release();
});

// CRUD Endpoints
app.get('/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});

app.post('/users', async (req, res) => {
  const { name, email } = req.body;
  const result = await pool.query('INSERT INTO users(name, email) VALUES($1, $2) RETURNING *', [name, email]);
  res.json(result.rows[0]);
});

app.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;
  const result = await pool.query('UPDATE users SET name=$1, email=$2 WHERE id=$3 RETURNING *', [name, email, id]);
  res.json(result.rows[0]);
});

app.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM users WHERE id=$1', [id]);
  res.sendStatus(204);
});

app.get('/',(req,res)=>{
    res.json({"sucess":true,"message":"yeah user-service is working fine"});
})

app.listen(port, () => console.log(`Server running on port ${port}`));
