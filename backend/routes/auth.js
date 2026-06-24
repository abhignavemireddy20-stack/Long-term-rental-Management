import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRole } from '../middleware/auth.js';
import supabase from '../config/supabase.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sd_digitals_super_secret_key_12345';

// Login User
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data: user, error } = await supabase
      .from('User')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Audit log
    await supabase.from('AuditLog').insert([{
      userId: user.id,
      action: `Logged in to the system`,
    }]);

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
});

// Get Current User Session Info
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('User')
      .select('id, name, email, role, createdAt')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Admin-Only: List All Users
router.get('/users', authenticateToken, authorizeRole('Admin'), async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('User')
      .select('id, name, email, role, createdAt')
      .order('createdAt', { ascending: false });

    if (error) throw error;
    res.json(users || []);
  } catch (error) {
    next(error);
  }
});

// Admin-Only: Register a New Staff/Admin User
router.post('/register', authenticateToken, authorizeRole('Admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'Admin' && role !== 'Staff') {
      return res.status(400).json({ error: 'Role must be Admin or Staff' });
    }

    const { data: existing } = await supabase.from('User').select('id').eq('email', email).single();
    if (existing) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const { data: newUser, error } = await supabase
      .from('User')
      .insert([{ name, email, password: hashedPassword, role }])
      .select('id, name, email, role, createdAt')
      .single();

    if (error) throw error;

    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Created user ${name} (${role})`,
    }]);

    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// Admin-Only: Update User Role/Name
router.put('/users/:id', authenticateToken, authorizeRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (role) {
      if (role !== 'Admin' && role !== 'Staff') {
        return res.status(400).json({ error: 'Role must be Admin or Staff' });
      }
      updateData.role = role;
    }

    const { data: updated, error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', id)
      .select('id, name, email, role, createdAt')
      .single();

    if (error) throw error;

    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Updated user ${updated.name} — role set to ${updated.role}`,
    }]);

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// Admin-Only: Delete a User
router.delete('/users/:id', authenticateToken, authorizeRole('Admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete yourself' });
    }

    const { data: userToDelete, error: findErr } = await supabase
      .from('User')
      .select('id, name, role')
      .eq('id', id)
      .single();

    if (findErr || !userToDelete) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error: deleteErr } = await supabase.from('User').delete().eq('id', id);
    if (deleteErr) throw deleteErr;

    await supabase.from('AuditLog').insert([{
      userId: req.user.id,
      action: `Deleted user ${userToDelete.name} (${userToDelete.role})`,
    }]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
