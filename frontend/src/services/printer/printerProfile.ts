export interface PrinterProfile {
  paperWidthMm: number;
  targetColumns: number;
  qrSizePx: number;
}

export const INITIAL_58MM_PROFILE: PrinterProfile = {
  paperWidthMm: 58,
  // 32 columns is typical for 58mm at standard font size.
  // Can be configured from settings later if the physical 
  // unit prints differently.
  targetColumns: 32,
  // Typically thermal printers support GS v 0 bitmaps up to 384 dots across.
  qrSizePx: 200, 
};
