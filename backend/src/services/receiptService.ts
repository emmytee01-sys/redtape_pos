import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { OrderWithItems } from '../models/Order';
import { PaymentWithDetails } from '../models/Payment';
import { SettingsModel } from '../models/Settings';
import { v4 as uuidv4 } from 'uuid';

export class ReceiptService {
  static async generateReceipt(
    order: OrderWithItems,
    payment: PaymentWithDetails
  ): Promise<string> {
    const receiptNumber = `RCP-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const receiptsDir = path.join(process.cwd(), 'receipts');

    // Create receipts directory if it doesn't exist
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // Get settings
    const receiptName = (await SettingsModel.getSetting('receipt_name')) || 'Receipt';
    const storeAddress = await SettingsModel.getSetting('store_address');
    const storePhone = await SettingsModel.getSetting('store_phone');
    const logoPath = await SettingsModel.getSetting('logo_path');
    const accountNumbers = await SettingsModel.getAllAccountNumbers();
    const activeAccountNumbers = accountNumbers.filter((acc) => acc.is_active);

    const filePath = path.join(receiptsDir, `${receiptNumber}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(fs.createWriteStream(filePath));

    // Logo at top (if exists)
    const pageWidth = doc.page.width;
    const pageMargin = 50;

    if (logoPath) {
      const logoFilePath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(logoFilePath)) {
        try {
          const logoWidth = 100;
          const logoHeight = 100;
          const logoX = (pageWidth - logoWidth) / 2;
          doc.image(logoFilePath, logoX, pageMargin, { width: logoWidth, height: logoHeight, fit: [logoWidth, logoHeight] });
          doc.y = pageMargin + logoHeight + 20;
        } catch (error) {
          console.error('Failed to load logo:', error);
          doc.y = pageMargin + 20;
        }
      } else {
        doc.y = pageMargin + 20;
      }
    } else {
      doc.y = pageMargin + 20;
    }

    // Header
    doc.fontSize(24).text(receiptName.toUpperCase(), { align: 'center' });
    if (storeAddress) doc.fontSize(10).text(storeAddress, { align: 'center' });
    if (storePhone) doc.fontSize(10).text(`Tel: ${storePhone}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Receipt Number: ${receiptNumber}`, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(0.5);

    // Status - PAID
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#10b981');
    doc.text('STATUS: PAID', { align: 'center' });
    doc.fillColor('black').font('Helvetica');
    doc.moveDown();

    // Order Details
    doc.fontSize(14).text('Order Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Order Number: ${order.order_number}`);
    doc.text(`Customer: ${order.customer_name || 'Walk-in Customer'}`);
    if (order.customer_email) {
      doc.text(`Email: ${order.customer_email}`);
    }
    if (order.customer_phone) {
      doc.text(`Phone: ${order.customer_phone}`);
    }
    doc.moveDown();

    // Items
    doc.fontSize(14).text('Items', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    // Table header
    doc.text('Item', 50, doc.y);
    doc.text('Qty', 250, doc.y);
    doc.text('Price', 300, doc.y);
    doc.text('Subtotal', 400, doc.y);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.3);

    // Items
    order.items.forEach((item) => {
      const startY = doc.y;
      doc.text(item.product_name || `SKU: ${item.product_sku}`, 50, startY);
      doc.text(item.quantity.toString(), 250, startY);
      doc.text(`₦${Number(item.unit_price).toFixed(2)}`, 300, startY);
      doc.text(`₦${Number(item.subtotal).toFixed(2)}`, 400, startY);
      doc.moveDown(0.5);
    });

    doc.moveDown();

    // Totals
    doc.moveTo(300, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.3);
    doc.text('Subtotal:', 300);
    doc.text(`₦${Number(order.subtotal).toFixed(2)}`, 400);
    doc.moveDown(0.3);
    doc.text('Tax:', 300);
    doc.text(`₦${Number(order.tax).toFixed(2)}`, 400);
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total:', 300);
    doc.text(`₦${Number(order.total).toFixed(2)}`, 400);
    doc.font('Helvetica').fontSize(10);
    doc.moveDown(2);

    // Payment Details
    doc.fontSize(14).text('Payment Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);

    // Map payment method to display format
    let paymentMethodDisplay = payment.payment_method.toUpperCase();
    // Already using 'pos' in database, but handle legacy 'card' if exists
    if (paymentMethodDisplay === 'CARD') {
      paymentMethodDisplay = 'POS';
    }

    doc.text(`Payment Method: ${paymentMethodDisplay}`);
    doc.text(`Amount Paid: ₦${Number(payment.amount).toFixed(2)}`);
    doc.text(`Confirmed By: ${payment.accountant_name || 'N/A'}`);
    doc.text(`Payment Date: ${payment.confirmed_at ? new Date(payment.confirmed_at).toLocaleString() : new Date().toLocaleString()}`);
    doc.moveDown(2);

    // Footer
    doc.fontSize(8).text('Thank you for your business!', { align: 'center' });

    doc.end();

    // Wait for PDF to be written
    await new Promise((resolve) => {
      doc.on('end', resolve);
    });

    // Return relative path for storage in database
    return `receipts/${receiptNumber}.pdf`;
  }

  static async generateInvoice(order: OrderWithItems): Promise<string> {
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const receiptsDir = path.join(process.cwd(), 'receipts');

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    // Get settings
    const receiptName = (await SettingsModel.getSetting('receipt_name')) || 'Invoice';
    const storeAddress = await SettingsModel.getSetting('store_address');
    const storePhone = await SettingsModel.getSetting('store_phone');
    const logoPath = await SettingsModel.getSetting('logo_path');
    const accountNumbers = await SettingsModel.getAllAccountNumbers();
    const activeAccountNumbers = accountNumbers.filter((acc) => acc.is_active);

    const filePath = path.join(receiptsDir, `${invoiceNumber}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    doc.pipe(fs.createWriteStream(filePath));

    // Watermark - PENDING (Low opacity)
    doc.save();
    doc.fontSize(100).fillColor('grey', 0.1).rotate(-45, { origin: [300, 400] });
    doc.text('PENDING', 50, 400, { align: 'center' });
    doc.restore();

    // Restore fill color for normal content
    doc.fillColor('black');

    const pageWidth = doc.page.width;
    const pageMargin = 50;

    if (logoPath) {
      const logoFilePath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(logoFilePath)) {
        try {
          const logoWidth = 100;
          const logoHeight = 100;
          const logoX = (pageWidth - logoWidth) / 2;
          doc.image(logoFilePath, logoX, pageMargin, { width: logoWidth, height: logoHeight, fit: [logoWidth, logoHeight] });
          doc.y = pageMargin + logoHeight + 20;
        } catch (error) {
          console.error('Failed to load logo:', error);
          doc.y = pageMargin + 20;
        }
      } else {
        doc.y = pageMargin + 20;
      }
    } else {
      doc.y = pageMargin + 20;
    }

    // Header
    doc.fontSize(24).text(receiptName.toUpperCase(), { align: 'center' });
    if (storeAddress) doc.fontSize(10).text(storeAddress, { align: 'center' });
    if (storePhone) doc.fontSize(10).text(`Tel: ${storePhone}`, { align: 'center' });
    doc.moveDown();
    doc.font('Helvetica-Bold').fontSize(12).text(`PROFORMA INVOICE`, { align: 'center' });
    doc.font('Helvetica');
    doc.text(`Invoice Number: ${invoiceNumber}`, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(0.5);

    // Status - PENDING
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#f59e0b');
    doc.text('STATUS: PENDING / AWAITING PAYMENT', { align: 'center' });
    doc.fillColor('black').font('Helvetica');
    doc.moveDown();

    // Order Details
    doc.fontSize(14).text('Order Details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Order Number: ${order.order_number}`);
    doc.text(`Customer: ${order.customer_name || 'Walk-in Customer'}`);
    if (order.customer_email) doc.text(`Email: ${order.customer_email}`);
    if (order.customer_phone) doc.text(`Phone: ${order.customer_phone}`);
    doc.moveDown();

    // Items Table
    doc.fontSize(14).text('Items', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text('Item', 50, doc.y);
    doc.text('Qty', 250, doc.y);
    doc.text('Price', 300, doc.y);
    doc.text('Subtotal', 400, doc.y);
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.3);

    order.items.forEach((item) => {
      const startY = doc.y;
      doc.text(item.product_name || `SKU: ${item.product_sku}`, 50, startY);
      doc.text(item.quantity.toString(), 250, startY);
      doc.text(`₦${Number(item.unit_price).toFixed(2)}`, 300, startY);
      doc.text(`₦${Number(item.subtotal).toFixed(2)}`, 400, startY);
      doc.moveDown(0.5);
    });
    doc.moveDown();

    // Totals
    doc.moveTo(300, doc.y).lineTo(500, doc.y).stroke();
    doc.moveDown(0.3);
    doc.text('Subtotal:', 300);
    doc.text(`₦${Number(order.subtotal).toFixed(2)}`, 400);
    doc.moveDown(0.3);
    doc.text('Tax:', 300);
    doc.text(`₦${Number(order.tax).toFixed(2)}`, 400);
    doc.moveDown(0.3);
    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Total to Pay:', 300);
    doc.text(`₦${Number(order.total).toFixed(2)}`, 400);
    doc.font('Helvetica').fontSize(10);
    doc.moveDown(2);

    // Account Details
    if (activeAccountNumbers.length > 0) {
      doc.fontSize(14).text('Payment Instructions', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text('Please pay to any of the following accounts:');
      doc.moveDown(0.3);
      activeAccountNumbers.forEach((account) => {
        doc.text(`${account.bank_name}: ${account.account_number} - ${account.account_name}`);
      });
      doc.moveDown(1);
      doc.font('Helvetica-BoldOblique').text('Kindly take this invoice to the Accountant after payment for confirmation.');
      doc.font('Helvetica');
      doc.moveDown(2);
    }

    // Footer
    doc.fontSize(8).text('This is a proforma invoice. Goods will be released upon payment confirmation.', { align: 'center' });

    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    return `receipts/${invoiceNumber}.pdf`;
  }
}

