import { Router } from 'express';
import { CustomerController } from '../controllers/customerController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.post('/', CustomerController.create);
router.get('/', CustomerController.getAll);
router.get('/search', CustomerController.search);

export default router;
