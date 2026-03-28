import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { OrderWithItems } from '../models/Order';
import { PaymentWithDetails } from '../models/Payment';
import { SettingsModel } from '../models/Settings';
import { v4 as uuidv4 } from 'uuid';

export class ReceiptService {
  private static FONT_REGULAR = path.join(__dirname, '../assets/fonts/Roboto-Regular.ttf');
  private static FONT_BOLD = path.join(__dirname, '../assets/fonts/Roboto-Bold.ttf');

  private static getFont(bold = false) {
    if (bold) {
      return fs.existsSync(this.FONT_BOLD) ? 'RobotoBold' : 'Helvetica-Bold';
    }
    return fs.existsSync(this.FONT_REGULAR) ? 'RobotoRegular' : 'Helvetica';
  }

  private static registerCustomFonts(doc: PDFKit.PDFDocument) {
    if (fs.existsSync(this.FONT_REGULAR)) doc.registerFont('RobotoRegular', this.FONT_REGULAR);
    if (fs.existsSync(this.FONT_BOLD)) doc.registerFont('RobotoBold', this.FONT_BOLD);
  }

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

    // POS Receipt width is usually 80mm
    const pageWidth = 226;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);

    const doc = new PDFDocument({
      size: [pageWidth, 800], 
      margin: margin,
      bufferPages: true
    });

    this.registerCustomFonts(doc);
    const font = (bold = false) => this.getFont(bold);

    doc.pipe(fs.createWriteStream(filePath));

    // Logo
    let currentY = margin;
    if (logoPath) {
      const logoFilePath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(logoFilePath)) {
        try {
          const logoWidth = 100;
          doc.image(logoFilePath, (pageWidth - logoWidth) / 2, currentY, { width: logoWidth });
          currentY += 85; 
        } catch (error) {
          console.error('Failed to load logo:', error);
          currentY += 5;
        }
      }
    }

    // Header
    doc.font(font(true)).fontSize(14).text(receiptName.toUpperCase(), margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 2;

    doc.font(font()).fontSize(8);
    if (storeAddress) {
      doc.text(storeAddress, margin, currentY, { align: 'center', width: contentWidth });
      currentY = doc.y + 2;
    }
    if (storePhone) {
      doc.text(`Tel: ${storePhone}`, margin, currentY, { align: 'center', width: contentWidth });
      currentY = doc.y + 5;
    }

    const drawDivider = (y: number) => {
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).dash(2, { space: 2 }).stroke().undash();
      return y + 10;
    };

    currentY = drawDivider(currentY);

    // Receipt Info
    doc.font(font(true)).fontSize(9).text('SALES RECEIPT', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;

    doc.font(font()).fontSize(8);
    doc.text(`Receipt #: ${receiptNumber}`, margin, currentY);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, doc.y + 2);
    doc.text(`Customer: ${order.customer_name || 'Walk-in'}`, margin, doc.y + 2);
    currentY = doc.y + 10;

    currentY = drawDivider(currentY);

    // Items List
    doc.font(font(true)).fontSize(8).text('ITEM DESCRIPTION', margin, currentY);
    doc.text('TOTAL', margin + 140, currentY, { width: 55, align: 'right' });
    currentY = doc.y + 5;

    let totalItemsCount = 0;
    order.items.forEach((item) => {
      const itemName = item.product_name || `SKU: ${item.product_sku}`;
      const itemY = currentY;
      totalItemsCount += item.quantity;
      doc.font(font(true)).fontSize(8).text(itemName.toUpperCase(), margin, itemY, { width: 140 });
      const mainTextHeight = doc.y - itemY;
      doc.font(font()).fontSize(7).text(`${item.quantity} x ₦${Number(item.unit_price).toLocaleString()}`, margin, doc.y);
      doc.font(font(true)).fontSize(8).text(`₦${Number(item.subtotal).toLocaleString()}`, margin + 140, itemY, { width: 55, align: 'right' });
      currentY = Math.max(doc.y, itemY + mainTextHeight + 10) + 5;
    });

    currentY = drawDivider(currentY);

    // Totals
    doc.font(font()).fontSize(8).text(`Total Items: ${totalItemsCount}`, margin, currentY);
    currentY = doc.y + 10;

    const drawTotalRow = (label: string, value: string, isBold = false) => {
      doc.font(font(isBold)).fontSize(isBold ? 10 : 8);
      doc.text(label, margin + 80, currentY, { width: 60, align: 'left' });
      doc.text(value, margin + 140, currentY, { width: 55, align: 'right' });
      currentY = doc.y + 5;
    };

    drawTotalRow('Subtotal:', `₦${Number(order.subtotal).toLocaleString()}`);
    currentY += 2;
    drawTotalRow('TOTAL:', `₦${Number(order.total).toLocaleString()}`, true);

    currentY += 10;
    currentY = drawDivider(currentY);

    // Payment Info
    doc.font(font(true)).fontSize(8).text('PAYMENT DETAILS', margin, currentY);
    currentY = doc.y + 6;
    doc.font(font()).fontSize(8);
    let methodLabel = payment.payment_method.toUpperCase();
    let methodValue = '';

    if (payment.payment_method === 'pos') {
      methodLabel = `POS (${payment.pos_bank_name || 'POS'})`;
      methodValue = payment.pos_terminal_number ? `Terminal: ${payment.pos_terminal_number}` : '';
    } else if (payment.payment_method === 'bank_transfer') {
      methodLabel = `TRANSFER (${payment.bank_name || 'BANK'})`;
      methodValue = payment.bank_account_number ? `A/C: ${payment.bank_account_number}` : '';
    }

    doc.text(`Method: ${methodLabel}`, margin, currentY);
    if (methodValue) doc.text(methodValue, margin, doc.y + 2);
    doc.text(`Paid: ₦${Number(payment.amount).toLocaleString()}`, margin, doc.y + 2);
    doc.text(`Cashier: ${payment.accountant_name || 'System'}`, margin, doc.y + 2);
    doc.text(`Sales Rep: ${order.sales_rep_name || 'N/A'}`, margin, doc.y + 2);
    currentY = doc.y + 10;

    if (order.notes) {
      doc.font(font(true)).text('NOTES:', margin, currentY);
      doc.font(font()).fontSize(7).text(order.notes, margin, doc.y + 2, { width: contentWidth });
      currentY = doc.y + 15;
    }

    // Footer
    doc.font(font(true)).fontSize(9).text('THANK YOU FOR YOUR PATRONAGE!', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;
    doc.font(font()).fontSize(7).text('Items once sold are not returnable. Thank you!', margin, currentY, { align: 'center', width: contentWidth });

    // Dynamic height adjustment
    const finalHeight = currentY + margin + 10;
    (doc.page as any).height = finalHeight;
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
    const activeAccountNumbers = (await SettingsModel.getAllAccountNumbers()).filter(a => a.is_active);

    const filePath = path.join(receiptsDir, `${invoiceNumber}.pdf`);
    const pageWidth = 226;
    const margin = 12;
    const contentWidth = pageWidth - (margin * 2);

    const doc = new PDFDocument({
      size: [pageWidth, 900],
      margin: margin,
      bufferPages: true
    });

    this.registerCustomFonts(doc);
    const font = (bold = false) => this.getFont(bold);
    doc.pipe(fs.createWriteStream(filePath));

    // Watermark
    doc.save().fontSize(30).fillColor('grey', 0.1).rotate(-45, { origin: [113, 450] })
       .text('PROFORMA', 0, 450, { align: 'center', width: pageWidth }).restore().fillColor('black');

    let currentY = margin;
    if (logoPath) {
      const logoFilePath = path.join(process.cwd(), 'public', logoPath);
      if (fs.existsSync(logoFilePath)) {
        try {
          const logoWidth = 100;
          doc.image(logoFilePath, (pageWidth - logoWidth) / 2, currentY, { width: logoWidth });
          currentY += 85; 
        } catch (error) {
          console.error('Failed to load logo:', error);
          currentY += 5;
        }
      }
    }

    doc.font(font(true)).fontSize(14).text(receiptName.toUpperCase(), margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 2;
    doc.font(font()).fontSize(8);
    if (storeAddress) doc.text(storeAddress, margin, currentY, { align: 'center', width: contentWidth });
    if (storePhone) doc.text(`Tel: ${storePhone}`, margin, doc.y + 2, { align: 'center', width: contentWidth });
    
    currentY = doc.y + 10;
    const drawDivider = (y: number) => {
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).dash(2, { space: 2 }).stroke().undash();
      return y + 10;
    };

    currentY = drawDivider(currentY);
    doc.font(font(true)).fontSize(9).text('PROFORMA INVOICE', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;
    doc.font(font()).fontSize(8).text(`Invoice #: ${invoiceNumber}`, margin, currentY);
    doc.text(`Date: ${new Date().toLocaleString()}`, margin, doc.y + 2);
    doc.text(`Customer: ${order.customer_name || 'Walk-in'}`, margin, doc.y + 2);
    currentY = doc.y + 10;

    currentY = drawDivider(currentY);
    doc.font(font(true)).fontSize(8).text('ITEM DESCRIPTION', margin, currentY);
    doc.text('TOTAL', margin + 140, currentY, { width: 55, align: 'right' });
    currentY = doc.y + 5;

    let totalItemsCount = 0;
    order.items.forEach((item) => {
      totalItemsCount += item.quantity;
      const startY = currentY;
      doc.font(font(true)).text((item.product_name || `SKU: ${item.product_sku}`).toUpperCase(), margin, startY, { width: 140 });
      const nH = doc.y - startY;
      doc.font(font()).fontSize(7).text(`${item.quantity} x ₦${Number(item.unit_price).toLocaleString()}`, margin, doc.y);
      doc.font(font(true)).fontSize(8).text(`₦${Number(item.subtotal).toLocaleString()}`, margin + 140, startY, { width: 55, align: 'right' });
      currentY = Math.max(doc.y, startY + nH + 10) + 5;
    });

    currentY = drawDivider(currentY);
    doc.font(font()).fontSize(8).text(`Total Items: ${totalItemsCount}`, margin, currentY);
    currentY = doc.y + 10;

    const drawTotalRow = (label: string, value: string, isBold = false) => {
      doc.font(font(isBold)).fontSize(isBold ? 10 : 8);
      doc.text(label, margin + 80, currentY, { width: 60, align: 'left' });
      doc.text(value, margin + 140, currentY, { width: 55, align: 'right' });
      currentY = doc.y + 5;
    };

    drawTotalRow('Subtotal:', `₦${Number(order.subtotal).toLocaleString()}`);
    currentY += 2;
    drawTotalRow('TOTAL:', `₦${Number(order.total).toLocaleString()}`, true);
    
    currentY += 10;
    currentY = drawDivider(currentY);

    if (activeAccountNumbers.length > 0) {
      doc.font(font(true)).fontSize(8).text('BANKING DETAILS', margin, currentY);
      currentY = doc.y + 5;
      doc.font(font()).fontSize(7);
      activeAccountNumbers.forEach((acc) => {
        doc.text(`${acc.bank_name}: ${acc.account_number}`, margin, currentY);
        doc.text(`Name: ${acc.account_name}`, margin, doc.y + 1);
        currentY = doc.y + 5;
      });
      currentY += 5;
    }

    doc.font(font()).fontSize(8).text(`Sales Rep: ${order.sales_rep_name || 'N/A'}`, margin, currentY);
    currentY = doc.y + 10;

    if (order.notes) {
      doc.font(font(true)).text('NOTES:', margin, currentY);
      doc.font(font()).fontSize(7).text(order.notes, margin, doc.y + 2, { width: contentWidth });
      currentY = doc.y + 15;
    }

    doc.font(font(true)).fontSize(8).text('AWAITING PAYMENT', margin, currentY, { align: 'center', width: contentWidth });
    currentY = doc.y + 5;
    doc.font(font()).fontSize(7).text('Valid for 24 hours only.', margin, currentY, { align: 'center', width: contentWidth });

    const finalHeight = currentY + margin + 10;
    (doc.page as any).height = finalHeight;
    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));
    return `receipts/${invoiceNumber}.pdf`;
  }
}

