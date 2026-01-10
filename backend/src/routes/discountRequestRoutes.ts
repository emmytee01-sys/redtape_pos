import { Router } from 'express';
import { DiscountRequestController } from '../controllers/discountRequestController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', DiscountRequestController.getAllRequests);
router.get('/:id', DiscountRequestController.getRequest);
router.post('/', DiscountRequestController.createRequest);

// Only admin/manager can approve/reject
router.post('/:id/approve', authorize('admin', 'manager'), DiscountRequestController.approveRequest);
router.post('/:id/reject', authorize('admin', 'manager'), DiscountRequestController.rejectRequest);

export default router;

