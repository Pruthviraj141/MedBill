// We explicitly bind to the external repository root QR asset!
import qrAssetUrl from '../../../../qr.jpg';
import { INITIAL_58MM_PROFILE } from './printerProfile';

/**
 * Loads an image from a URL into an HTMLImageElement
 */
const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load local qr.jpg asset'));
    img.src = url;
  });
};

/**
 * Converts HTML canvas pixel data (RGBA) into standard ESC/POS monochrome bits (1 bit per pixel)
 */
function rgbaToMonochrome(pixels: Uint8ClampedArray, width: number, height: number): Uint8Array {
  // ESCPOS generic raster requires 1 bit per pixel. width must be padded to byte.
  const bytesWidth = Math.ceil(width / 8);
  const out = new Uint8Array(bytesWidth * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      // Luminance formula
      const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      // Dark pixels (luminance < 128) and opaque (a > 128) = 1 (print dot)
      if (luminance < 128 && a > 128) {
        // Set the appropriate bit
        const byteIndex = y * bytesWidth + Math.floor(x / 8);
        const bitOffset = 7 - (x % 8);
        out[byteIndex] |= (1 << bitOffset);
      }
    }
  }

  return out;
}

export const loadAndEncodeQR = async (): Promise<{ buffer: Uint8Array; w: number; h: number } | null> => {
  try {
    const img = await loadImage(qrAssetUrl);

    let drawWidth = img.width;
    let drawHeight = img.height;

    // Scale down if it exceeds the maximum safe thermal width limit
    const maxPx = INITIAL_58MM_PROFILE.qrSizePx;
    if (drawWidth > maxPx) {
      const ratio = maxPx / drawWidth;
      drawWidth = maxPx;
      drawHeight = drawHeight * ratio;
    }

    // Must be even/byte aligned for standard processing cleanly 
    drawWidth = Math.floor(drawWidth / 8) * 8;
    drawHeight = Math.floor(drawHeight);

    const canvas = document.createElement('canvas');
    canvas.width = drawWidth;
    canvas.height = drawHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D unsupported');

    // Fill white background first (vital for transparent images on thermal prints)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, drawWidth, drawHeight);

    // Draw and extract
    ctx.drawImage(img, 0, 0, drawWidth, drawHeight);
    const imageData = ctx.getImageData(0, 0, drawWidth, drawHeight);

    const monoBits = rgbaToMonochrome(imageData.data, drawWidth, drawHeight);
    return { buffer: monoBits, w: drawWidth, h: drawHeight };
  } catch (error) {
    console.error('Failed processing QR for thermal:', error);
    return null;
  }
};
