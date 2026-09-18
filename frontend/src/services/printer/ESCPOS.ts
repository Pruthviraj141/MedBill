// Core ESC/POS byte encoder
export class ESCPOS {
  private buffer: number[] = [];

  constructor() {
    this.buffer = [];
  }

  // Initialize printer
  init() {
    this.buffer.push(0x1B, 0x40);
  }

  // Text alignment
  alignLeft() {
    this.buffer.push(0x1B, 0x61, 0x00);
  }
  alignCenter() {
    this.buffer.push(0x1B, 0x61, 0x01);
  }
  alignRight() {
    this.buffer.push(0x1B, 0x61, 0x02);
  }

  // Text formatting
  boldOn() {
    this.buffer.push(0x1B, 0x45, 0x01);
  }
  boldOff() {
    this.buffer.push(0x1B, 0x45, 0x00);
  }

  // Text printing with Rs. fallback for unsupported ₹ characters
  text(str: string) {
    // If the printer struggles with native ₹ encoding, we fall back to a safe text representation.
    const safeStr = str.replace(/₹/g, 'Rs.'); 
    for (let i = 0; i < safeStr.length; i++) {
      this.buffer.push(safeStr.charCodeAt(i));
    }
  }

  textLine(str: string) {
    this.text(str);
    this.newline();
  }

  newline() {
    this.buffer.push(0x0A);
  }

  feed(lines: number = 3) {
    this.buffer.push(0x1B, 0x64, lines);
  }

  cut() {
    // Standard full cut
    this.buffer.push(0x1D, 0x56, 0x41, 0x00);
  }

  // Retrieve raw buffer
  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  // Retrieve Base64 payload designed for RawBT triggers
  getBase64(): string {
    const bytes = this.getBytes();
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Optional: print raw bitmap raster (for QR code, to be attached in Phase 5)
  // Re-uses standard 'GS v 0' command structure unless tests show it fails
  printRaster(widthPixels: number, heightPixels: number, monochromeBits: Uint8Array) {
    const bytesWidth = Math.ceil(widthPixels / 8);
    // GS v 0 <m> <xL> <xH> <yL> <yH> <data>
    // m = 0 (normal mode)
    this.buffer.push(0x1D, 0x76, 0x30, 0x00);
    this.buffer.push(bytesWidth & 0xFF, (bytesWidth >> 8) & 0xFF);
    this.buffer.push(heightPixels & 0xFF, (heightPixels >> 8) & 0xFF);
    
    for (let i = 0; i < monochromeBits.length; i++) {
      this.buffer.push(monochromeBits[i]);
    }
  }
}
