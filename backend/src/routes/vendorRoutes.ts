import { Router } from 'express';
import { VendorController, upload } from '../controllers/vendorController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin', 'manager')); // Admin and manager can manage vendors

router.get('/', VendorController.getAllVendors);
router.get('/:id', VendorController.getVendor);
router.post('/', VendorController.createVendor);
router.put('/:id', VendorController.updateVendor);
router.delete('/:id', VendorController.deleteVendor);

router.post('/:vendorId/products/:productId', VendorController.linkProduct);
router.delete('/:vendorId/products/:productId', VendorController.unlinkProduct);
router.get('/products/:productId', VendorController.getProductVendors);

router.post('/upload', upload.single('file'), VendorController.uploadVendors);

router.post('/invoices/generate', VendorController.generateOutOfStockInvoice);
router.get('/invoices', VendorController.getAllInvoices);
router.get('/invoices/:id', VendorController.getInvoice);

export default router;

