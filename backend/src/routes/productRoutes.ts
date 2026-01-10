import { Router } from 'express';
import { ProductController, upload } from '../controllers/productController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);

router.get('/', ProductController.getAllProducts);
router.get('/low-stock', ProductController.getLowStockItems);
router.get('/:id', ProductController.getProduct);

// Only managers can create/update products
router.post('/', authorize('manager', 'admin'), ProductController.createProduct);
router.put('/:id', authorize('manager', 'admin'), ProductController.updateProduct);
router.post(
  '/upload-csv',
  authorize('manager', 'admin'),
  upload.single('file'),
  ProductController.uploadCSV
);

export default router;

