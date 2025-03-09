import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { check, validationResult } from 'express-validator';
import pool from '../POSTGRESdb';

const router = Router();

// Register route
router.post('/register', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').isLength({ min: 6 })
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { username, password } = req.body;

  try {
    const userExists = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      res.status(400).json({ msg: 'User already exists' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, hashedPassword]
    );

    const payload = { user: { id: newUser.rows[0].id } };
    jwt.sign(payload, 'your_jwt_secret', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error('Unknown error');
    }
    res.status(500).send('Server error');
  }
});

// Login route
router.post('/login', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').exists()
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return
  }     

  const { username, password } = req.body;

  try {
    const user = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (user.rows.length === 0) {
        res.status(400).json({ msg: 'Invalid credentials' });
        return;
    }

    const isMatch = await bcrypt.compare(password, user.rows[0].password);
    if (!isMatch) {
        res.status(400).json({ msg: 'Invalid credentials' });
        return;
    }

    const payload = { user: { id: user.rows[0].id } };
    jwt.sign(payload, 'your_jwt_secret', { expiresIn: 360000 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    if (err instanceof Error) {
        console.error(err.message);
    } else {
        console.error('Unknown error');
    }
    res.status(500).send('Server error');
  }
});

export default router;