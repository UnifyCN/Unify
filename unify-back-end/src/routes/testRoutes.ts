import { Router } from 'express';
import pool from '../db';

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

<<<<<<< HEAD
export default router;
=======

// // Connecting to mongo
// connectDB();

// // Get all users (just a test for querying mongo)
// router.get('/MongoUsers', async (req, res) => {
//   try {
//       const users = await User.find();
//       res.json(users);
//   } catch (error) {
//       res.status(500).json({ message: 'Server error' });
//   }
// });


export default router;
>>>>>>> a68631b1811fc5f89aec99403b8b6f73af0f6904
