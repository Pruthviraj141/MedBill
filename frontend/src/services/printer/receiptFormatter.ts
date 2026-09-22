import { ReceiptDocument } from './ReceiptDocument';
import { ESCPOS } from './ESCPOS';
import { INITIAL_58MM_PROFILE } from './printerProfile';

export class ReceiptFormatter {
  private escpos: ESCPOS;
  private width: number;

  constructor(private doc: ReceiptDocument, widthColumns: number = INITIAL_58MM_PROFILE.targetColumns) {
    this.escpos = new ESCPOS();
    this.width = widthColumns;
  }

  // Helper to right-align text in a specific column width
  private formatRow(left: string, right: string, totalWidth: number): string {
    const spaceLength = Math.max(1, totalWidth - left.length - right.length);
    return left + ' '.repeat(spaceLength) + right;
  }

  // Format a 3-column item row safely
  private formatItemRow(name: string, qty: string, price: string): string {
    const qtyWidth = 4;
    // FIX 6: widened from 8 → 9 to accommodate Rs.9999.99 (9 chars) without truncation.
    // nameWidth reduced by 1 accordingly (19 → 18). Values > 9 chars are hard-sliced.
    const priceWidth = 9;
    const nameWidth = this.width - qtyWidth - priceWidth - 1;

    // Word wrap long item names
    let remainingName = name;
    let mainLines: string[] = [];

    while (remainingName.length > 0) {
      if (remainingName.length <= nameWidth) {
        mainLines.push(remainingName);
        break;
      }
      
      let breakPoint = remainingName.lastIndexOf(' ', nameWidth);
      if (breakPoint === -1 || breakPoint === 0) breakPoint = nameWidth;
      
      mainLines.push(remainingName.substring(0, breakPoint).trim());
      remainingName = remainingName.substring(breakPoint).trim();
    }

    let result = '';
    
    // First line includes Qty and Price
    const firstLineName = mainLines[0];
    const qtyStr = qty.padStart(qtyWidth);
    // Hard-slice to guard against values exceeding the column width.
    const priceStr = price.slice(-priceWidth).padStart(priceWidth);

    result += firstLineName.padEnd(nameWidth) + ' ' + qtyStr + priceStr + '\n';

    // Append subsequent wrapped name lines if any
    for (let i = 1; i < mainLines.length; i++) {
        result += mainLines[i] + '\n';
    }

    return result.replace(/\n$/, '');
  }

  private drawSeparator() {
    this.escpos.textLine('-'.repeat(this.width));
  }

  public async generate(): Promise<ESCPOS> {
    this.escpos.init();

    // 1. Header
    this.escpos.alignCenter();
    this.escpos.boldOn();
    this.escpos.textLine(this.doc.businessName);
    this.escpos.boldOff();
    this.escpos.textLine("TAX INVOICE");
    this.escpos.textLine("");

    // 2. Meta
    this.escpos.alignLeft();
    // Removed Invoice # line as requested to clean up the layout
    this.escpos.textLine(`Date: ${this.doc.date}`);
    this.escpos.textLine(`Time: ${this.doc.time}`);
    this.drawSeparator();

    // 3. Items Header
    const qtyPad = 4;
    // FIX 6: mirror of formatItemRow column widths (8 → 9).
    const pricePad = 9;
    const nameW = this.width - qtyPad - pricePad - 1;
    this.escpos.boldOn();
    this.escpos.textLine('ITEM'.padEnd(nameW) + ' ' + 'QTY'.padStart(qtyPad) + 'AMT'.padStart(pricePad));
    this.escpos.boldOff();
    this.drawSeparator();

    // 4. Items List
    for (const item of this.doc.items) {
      this.escpos.textLine(this.formatItemRow(
          item.name, 
          item.quantity.toString(), 
          `₹${item.price.toFixed(2)}`
      ));
    }
    this.drawSeparator();

    // 5. Totals
    this.escpos.alignRight();
    // Use formatRow to keep perfect alignment instead of just right aligning
    // Let's use formatRow with full width, then just normal print.
    this.escpos.alignLeft();
    this.escpos.textLine(this.formatRow("Subtotal", `₹${this.doc.subtotal.toFixed(2)}`, this.width));
    if (this.doc.discount > 0) {
      this.escpos.textLine(this.formatRow("Discount", `-₹${this.doc.discount.toFixed(2)}`, this.width));
    }
    if (this.doc.gst > 0) {
      this.escpos.textLine(this.formatRow("GST", `₹${this.doc.gst.toFixed(2)}`, this.width));
    }
    this.drawSeparator();
    
    this.escpos.boldOn();
    this.escpos.textLine(this.formatRow("TOTAL", `₹${this.doc.total.toFixed(2)}`, this.width));
    this.escpos.boldOff();
    this.drawSeparator();

    // 6. Payment info
    this.escpos.textLine(`Payment: ${this.doc.paymentMethod}`);
    this.escpos.textLine("");

    // 7. Footer message
    this.drawSeparator();
    this.escpos.alignCenter();
    this.escpos.boldOn();
    this.escpos.textLine("*** Thank you :) :) ***");
    this.escpos.boldOff();
    this.escpos.textLine("Please visit again!");
    this.escpos.textLine("");

    return this.escpos;
  }
}
