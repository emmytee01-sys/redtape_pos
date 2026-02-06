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

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const receiptName = (await SettingsModel.getSetting('receipt_name')) || 'Receipt';
    const storeAddress = await SettingsModel.getSetting('store_address');
    const storePhone = await SettingsModel.getSetting('store_phone');
    const logoPath = await SettingsModel.getSetting('logo_path');

    const filePath = path.join(receiptsDir, `${receiptNumber}.pdf`);

    // POS Receipt width is usually 80mm (approx 226 points)
    const pageWidth = 226;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Initial estimate for height, will be auto-adjusted if needed or we use a long strip
    const doc = new PDFDocument({
      size: [pageWidth, 800], // Long strip for POS
      margin: margin
    });

    doc.pipe(fs.createWriteStream(filePath));

    // Logo
    let currentY = margin;
    if (logoPath) {
      const logoFilePath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(logoFilePath)) {
        try {
          doc.image(logoFilePath, (pageWidth - 60) / 2, currentY, { width: 60 });
          currentY += 70;
        } catch (error) {
          console.error('Failed to load logo:', error);
        }
      }
    }

    // Header
    doc.font('Helvetica-Bold').fontSize(14).text(receiptName.toUpperCase(), margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 2;

    doc.font('Helvetica').fontSize(8);
    if (storeAddress) {
      doc.text(storeAddress, margin, currentY, { align: 'center', width: contentWidth });
      currentY = doc.y + 2;
    }
    if (storePhone) {
      doc.text(`Tel: ${storePhone}`, margin, currentY, { align: 'center', width: contentWidth });
      currentY = doc.y + 5;
    }

    // Separator line
    const drawDivider = (y: number) => {
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).dash(2, { space: 2 }).stroke().undash();
      return y + 10;
    };

    currentY = drawDivider(currentY);

    // Receipt Info
    doc.font('Helvetica-Bold').fontSize(9).text('SALES RECEIPT', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;

    doc.font('Helvetica').fontSize(8);
    doc.text(`Receipt #: ${receiptNumber}`, margin, currentY);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, doc.y + 2);
    doc.text(`Customer: ${order.customer_name || 'Walk-in'}`, margin, doc.y + 2);
    currentY = doc.y + 10;

    currentY = drawDivider(currentY);

    // Items Header
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('ITEM DESCRIPTION', margin, currentY);
    doc.text('TOTAL', margin + 140, currentY, { width: 55, align: 'right' });
    currentY = doc.y + 5;

    // Items List
    doc.font('Helvetica').fontSize(8);
    let totalItemsCount = 0;
    order.items.forEach((item) => {
      const itemName = item.product_name || `SKU: ${item.product_sku}`;
      const itemY = currentY;
      totalItemsCount += item.quantity;

      // Main item name
      doc.font('Helvetica-Bold').text(itemName.toUpperCase(), margin, itemY, { width: 140 });
      const mainTextHeight = doc.y - itemY;

      // Price breakdown on next line
      doc.font('Helvetica').fontSize(7).text(`${item.quantity} x ₦${Number(item.unit_price).toLocaleString()}`, margin, doc.y);

      // Subtotal for this item (aligned to first line)
      const itemSubtotal = `₦${Number(item.subtotal).toLocaleString()}`;
      doc.font('Helvetica-Bold').fontSize(8).text(itemSubtotal, margin + 140, itemY, { width: 55, align: 'right' });

      currentY = Math.max(doc.y, itemY + mainTextHeight + 10) + 5;
    });

    currentY = drawDivider(currentY);

    // Totals
    doc.font('Helvetica').fontSize(8);
    doc.text(`Total Items: ${totalItemsCount}`, margin, currentY);
    currentY = doc.y + 10;

    const drawTotalRow = (label: string, value: string, isBold = false) => {
      if (isBold) doc.font('Helvetica-Bold').fontSize(10);
      doc.text(label, margin + 80, currentY, { width: 60, align: 'left' });
      doc.text(value, margin + 140, currentY, { width: 55, align: 'right' });
      doc.font('Helvetica').fontSize(8);
      currentY = doc.y + 5;
    };

    drawTotalRow('Subtotal:', `₦${Number(order.subtotal).toLocaleString()}`);
    drawTotalRow('Tax (10%):', `₦${Number(order.tax).toLocaleString()}`);
    currentY += 2;
    drawTotalRow('TOTAL:', `₦${Number(order.total).toLocaleString()}`, true);

    currentY += 10;
    currentY = drawDivider(currentY);

    // Payment Info
    doc.font('Helvetica-Bold').fontSize(8).text('PAYMENT DETAILS', margin, currentY);
    currentY = doc.y + 5;
    doc.font('Helvetica').fontSize(8);
    doc.text(`Method: ${payment.payment_method.toUpperCase()}`, margin, currentY);
    doc.text(`Paid: ₦${Number(payment.amount).toLocaleString()}`, margin, doc.y + 2);
    doc.text(`Cashier: ${payment.accountant_name || 'System'}`, margin, doc.y + 2);
    doc.text(`Sales Rep: ${order.sales_rep_name || 'N/A'}`, margin, doc.y + 2);
    currentY = doc.y + 10;

    // Customer Notes (if any)
    if (order.notes) {
      doc.font('Helvetica-Bold').text('NOTES:', margin, currentY);
      doc.font('Helvetica').fontSize(7).text(order.notes, margin, doc.y + 2, { width: contentWidth });
      currentY = doc.y + 15;
    } else {
      currentY += 5;
    }

    // Footer
    doc.font('Helvetica-Bold').fontSize(9).text('THANK YOU FOR YOUR PATRONAGE!', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;
    doc.font('Helvetica').fontSize(7).text('Items once sold are not returnable. Thank you!', margin, currentY, { align: 'center', width: contentWidth });

    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    return `receipts/${receiptNumber}.pdf`;
  }

  static async generateInvoice(order: OrderWithItems): Promise<string> {
    const invoiceNumber = `INV-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    const receiptsDir = path.join(process.cwd(), 'receipts');

    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }

    const receiptName = (await SettingsModel.getSetting('receipt_name')) || 'Invoice';
    const storeAddress = await SettingsModel.getSetting('store_address');
    const storePhone = await SettingsModel.getSetting('store_phone');
    const logoPath = await SettingsModel.getSetting('logo_path');
    const accountNumbers = await SettingsModel.getAllAccountNumbers();
    const activeAccountNumbers = accountNumbers.filter((acc) => acc.is_active);

    const filePath = path.join(receiptsDir, `${invoiceNumber}.pdf`);

    // POS width 80mm
    const pageWidth = 226;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    const doc = new PDFDocument({
      size: [pageWidth, 900],
      margin: margin
    });

    doc.pipe(fs.createWriteStream(filePath));

    // Watermark - PROFORMA
    doc.save();
    doc.fontSize(30).fillColor('grey', 0.1).rotate(-45, { origin: [113, 450] });
    doc.text('PROFORMA', 0, 450, { align: 'center', width: pageWidth });
    doc.restore();
    doc.fillColor('black');

    let currentY = margin;

    // Logo
    if (logoPath) {
      const logoFilePath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(logoFilePath)) {
        try {
          doc.image(logoFilePath, (pageWidth - 60) / 2, currentY, { width: 60 });
          currentY += 70;
        } catch (error) {
          console.error('Failed to load logo:', error);
        }
      }
    }

    // Header
    doc.font('Helvetica-Bold').fontSize(14).text(receiptName.toUpperCase(), margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 2;
    doc.font('Helvetica').fontSize(8);
    if (storeAddress) doc.text(storeAddress, margin, currentY, { align: 'center', width: contentWidth });
    if (storePhone) doc.text(`Tel: ${storePhone}`, margin, doc.y + 2, { align: 'center', width: contentWidth });
    currentY = doc.y + 10;

    const drawDivider = (y: number) => {
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).dash(2, { space: 2 }).stroke().undash();
      return y + 10;
    };

    // Invoice Info
    currentY = drawDivider(currentY);
    doc.font('Helvetica-Bold').fontSize(9).text('PROFORMA INVOICE', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;
    doc.font('Helvetica').fontSize(8);
    doc.text(`Invoice #: ${invoiceNumber}`, margin, currentY);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, doc.y + 2);
    doc.text(`Customer: ${order.customer_name || 'Walk-in'}`, margin, doc.y + 2);
    currentY = doc.y + 10;

    currentY = drawDivider(currentY);

    // Items Header
    doc.font('Helvetica-Bold').fontSize(8);
    doc.text('ITEM DESCRIPTION', margin, currentY);
    doc.text('TOTAL', margin + 140, currentY, { width: 55, align: 'right' });
    currentY = doc.y + 5;

    // Items List
    doc.font('Helvetica').fontSize(8);
    let totalItemsCount = 0;
    order.items.forEach((item) => {
      const startY = currentY;
      totalItemsCount += item.quantity;

      doc.font('Helvetica-Bold').text((item.product_name || `SKU: ${item.product_sku}`).toUpperCase(), margin, startY, { width: 140 });
      const nameHeight = doc.y - startY;

      doc.font('Helvetica').fontSize(7).text(`${item.quantity} x ₦${Number(item.unit_price).toLocaleString()}`, margin, doc.y);

      doc.font('Helvetica-Bold').fontSize(8).text(`₦${Number(item.subtotal).toLocaleString()}`, margin + 140, startY, { width: 55, align: 'right' });

      currentY = Math.max(doc.y, startY + nameHeight + 10) + 5;
    });

    currentY = drawDivider(currentY);

    doc.font('Helvetica').fontSize(8);
    doc.text(`Total Items: ${totalItemsCount}`, margin, currentY);
    currentY = doc.y + 10;

    // Totals
    const drawTotalRow = (label: string, value: string, isBold = false) => {
      if (isBold) doc.font('Helvetica-Bold').fontSize(10);
      doc.text(label, margin + 80, currentY, { width: 60, align: 'left' });
      doc.text(value, margin + 140, currentY, { width: 55, align: 'right' });
      doc.font('Helvetica').fontSize(8);
      currentY = doc.y + 5;
    };

    drawTotalRow('Subtotal:', `₦${Number(order.subtotal).toLocaleString()}`);
    drawTotalRow('Tax (10%):', `₦${Number(order.tax).toLocaleString()}`);
    currentY += 2;
    drawTotalRow('TOTAL:', `₦${Number(order.total).toLocaleString()}`, true);

    currentY += 10;
    currentY = drawDivider(currentY);

    // Banking Details
    if (activeAccountNumbers.length > 0) {
      doc.font('Helvetica-Bold').fontSize(8).text('BANKING DETAILS', margin, currentY);
      currentY = doc.y + 5;
      doc.font('Helvetica').fontSize(7);
      activeAccountNumbers.forEach((acc) => {
        doc.text(`${acc.bank_name}: ${acc.account_number}`, margin, currentY);
        doc.text(`Name: ${acc.account_name}`, margin, doc.y + 1);
        currentY = doc.y + 5;
      });
      currentY += 5;
    }

    // Sales Rep and Notes
    doc.font('Helvetica').fontSize(8);
    doc.text(`Sales Rep: ${order.sales_rep_name || 'N/A'}`, margin, currentY);
    currentY = doc.y + 10;

    if (order.notes) {
      doc.font('Helvetica-Bold').text('NOTES:', margin, currentY);
      doc.font('Helvetica').fontSize(7).text(order.notes, margin, doc.y + 2, { width: contentWidth });
      currentY = doc.y + 15;
    }

    // Footer
    doc.font('Helvetica-Bold').fontSize(8).text('AWAITING PAYMENT', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;
    doc.font('Helvetica').fontSize(7).text('Valid for 24 hours only.', margin, currentY, { align: 'center', width: contentWidth });

    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    return `receipts/${invoiceNumber}.pdf`;
  }
}

