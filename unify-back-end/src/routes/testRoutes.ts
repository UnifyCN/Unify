import { Router } from 'express';
import pool from '../POSTGRESdb';
import connectDB from '../MONGOdb';

const router = Router();

// Test route, this is just for testing express
router.get('/test', (req, res) => {
  res.json({ message: 'API is working!!' });
});

router.get('/test1', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (err) {    
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).json({ error: 'Cant query the db', details: err.message });
    } else {
      console.error('db error:', err);
      res.status(500).json({ error: 'Error occurred' });
    }
  }
});

// Just a test from the test user table in the db
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.json(result.rows);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
      res.status(500).json({ error: 'Failed to fetch users', details: err.message });
    } else {
      console.error('db error:', err);
      res.status(500).json({ error: 'Error occurred' });
    }
  }
});


// Connecting to mongo
connectDB();
export default router;
