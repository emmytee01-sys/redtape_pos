import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', authorize('accountant', 'admin', 'manager'), PaymentController.getAllPayments);
router.get('/:id', authorize('accountant', 'admin', 'manager'), PaymentController.getPayment);
router.post('/', authorize('accountant', 'admin'), PaymentController.createPayment);
router.post('/:id/confirm', authorize('accountant', 'admin'), PaymentController.confirmPayment);
router.get('/receipt/:payment_id', authorize('accountant', 'admin', 'sales_rep'), PaymentController.getReceipt);

export default router;

