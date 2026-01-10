import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { SettingsModel } from '../models/Settings';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Ensure public/uploads directory exists
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, publicUploadsDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    const fileName = `logo_${Date.now()}${fileExt}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export class SettingsController {
  // Account Numbers
  static async getAllAccountNumbers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const accounts = await SettingsModel.getAllAccountNumbers();
      res.json(accounts);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch account numbers' });
    }
  }

  static async createAccountNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { account_number, account_name, bank_name } = req.body;

      if (!account_number || !account_name || !bank_name) {
        res.status(400).json({ error: 'Account number, account name, and bank name are required' });
        return;
      }

      const id = await SettingsModel.createAccountNumber({
        account_number,
        account_name,
        bank_name,
      });

      const account = await SettingsModel.getAccountNumberById(id);
      res.status(201).json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to create account number' });
    }
  }

  static async updateAccountNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates: any = {};

      if (req.body.account_number !== undefined) updates.account_number = req.body.account_number;
      if (req.body.account_name !== undefined) updates.account_name = req.body.account_name;
      if (req.body.bank_name !== undefined) updates.bank_name = req.body.bank_name;
      if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;

      await SettingsModel.updateAccountNumber(parseInt(id), updates);
      const account = await SettingsModel.getAccountNumberById(parseInt(id));
      res.json(account);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update account number' });
    }
  }

  static async deleteAccountNumber(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await SettingsModel.deleteAccountNumber(parseInt(id));
      res.json({ message: 'Account number deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to delete account number' });
    }
  }

  // System Settings
  static async getSettings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const settings = await SettingsModel.getAllSettings();
      const settingsObj: Record<string, string> = {};
      settings.forEach((s) => {
        settingsObj[s.setting_key] = s.setting_value || '';
      });
      res.json(settingsObj);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to fetch settings' });
    }
  }

  static async updateSetting(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { key, value } = req.body;

      if (!key) {
        res.status(400).json({ error: 'Setting key is required' });
        return;
      }

      await SettingsModel.setSetting(key, value || '');
      res.json({ message: 'Setting updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to update setting' });
    }
  }

  static async uploadLogo(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // File is already saved by multer, just get the filename
      const fileName = req.file.filename;

      // Save logo path to settings
      const logoPath = `/uploads/${fileName}`;
      await SettingsModel.setSetting('logo_path', logoPath);

      res.json({ logo_path: logoPath, message: 'Logo uploaded successfully' });
    } catch (error: any) {
      // Clean up file if it exists
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message || 'Failed to upload logo' });
    }
  }
}

export { upload };

