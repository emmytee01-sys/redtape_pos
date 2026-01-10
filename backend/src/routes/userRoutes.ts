import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', UserController.getAllUsers);
router.post('/', UserController.createUser);
router.put('/:id', UserController.updateUser);

export default router;

