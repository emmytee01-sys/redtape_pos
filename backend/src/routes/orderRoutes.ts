import { Router } from 'express';
import { OrderController } from '../controllers/orderController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

// Sales reps can create orders
router.post('/', authorize('sales_rep', 'admin', 'manager'), OrderController.createOrder);
router.get('/', OrderController.getAllOrders);
router.get('/:id', OrderController.getOrder);
router.post('/:id/submit', authorize('sales_rep', 'admin'), OrderController.submitOrder);
router.get('/:id/invoice', OrderController.getOrderInvoice);
router.put('/:id', authorize('sales_rep', 'admin', 'manager'), OrderController.updateOrder);
router.delete('/:id', authorize('sales_rep', 'admin', 'manager'), OrderController.deleteOrder);

export default router;

