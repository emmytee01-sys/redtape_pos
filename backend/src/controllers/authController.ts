import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middlewares/auth';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      const result = await AuthService.login(username, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Login failed' });
    }
  }

  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await UserModel.findById(req.user!.id);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role_name || '',
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get profile' });
    }
  }
}

