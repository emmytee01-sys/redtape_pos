import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/login', AuthController.login);
router.get('/profile', authenticate, AuthController.getProfile);

export default router;

