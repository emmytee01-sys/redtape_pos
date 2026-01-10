import { Response } from 'express';
import { UserModel } from '../models/User';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middlewares/auth';

export class UserController {
  static async getAllUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await UserModel.findAll();
      const usersWithoutPassword = users.map((user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name,
        is_active: user.is_active,
        created_at: user.created_at,
      }));
      res.json(usersWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch users' });
    }
  }

  static async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { username, email, password, full_name, role } = req.body;

      if (!username || !email || !password || !full_name || !role) {
        res.status(400).json({
          error: 'Username, email, password, full_name, and role are required',
        });
        return;
      }

      // Check if username or email already exists
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        res.status(400).json({ error: 'Username already exists' });
        return;
      }

      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        res.status(400).json({ error: 'Email already exists' });
        return;
      }

      const roleId = await UserModel.getRoleId(role);
      if (!roleId) {
        res.status(400).json({ error: 'Invalid role' });
        return;
      }

      const password_hash = await AuthService.hashPassword(password);
      const userId = await UserModel.create({
        username,
        email,
        password_hash,
        full_name,
        role_id: roleId,
      });

      res.status(201).json({
        id: userId,
        username,
        email,
        full_name,
        role,
        message: 'User created successfully',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create user' });
    }
  }

  static async updateUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { username, email, full_name, role, is_active } = req.body;

      const updates: any = {};
      if (username !== undefined) updates.username = username;
      if (email !== undefined) updates.email = email;
      if (full_name !== undefined) updates.full_name = full_name;
      if (is_active !== undefined) updates.is_active = is_active;
      if (role !== undefined) {
        const roleId = await UserModel.getRoleId(role);
        if (!roleId) {
          res.status(400).json({ error: 'Invalid role' });
          return;
        }
        updates.role_id = roleId;
      }

      await UserModel.update(parseInt(id), updates);
      res.json({ message: 'User updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update user' });
    }
  }
}

