import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { WriteStream } from 'tty';
import fs from 'fs';
import os from 'os';

const app = express();
const PORT = 28080;

app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '10mb' }));

let lastVirtualReceipt = "<html><body><h2>No virtual receipt generated yet. Print an order first!</h2></body></html>";

function parseESCPOS(buffer) {
    let index = 0;
    let html = `<html><head><title>Virtual Receipt Preview</title><style>
      body { background: #e0e0e0; display: flex; justify-content: center; padding: 20px; font-family: monospace; }
      #receipt { background: #fff; width: 330px; padding: 20px 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-size: 14px; line-height: 1.2; }
      .line { word-wrap: break-word; white-space: pre-wrap; }
      .left { text-align: left; }
      .center { text-align: center; }
      .right { text-align: right; }
      .bold { font-weight: bold; }
      canvas { margin-top: 10px; margin-bottom: 20px; }
    </style></head><body><div id="receipt">\n`;
    let currentLine = ''; let align = 'left'; let bold = false;

    const flushLine = () => {
        let text = currentLine.replace(/ /g, '&nbsp;');
        if (text === '') text = '&nbsp;';
        html += `<div class="line ${align} ${bold ? 'bold' : ''}">${text}</div>\n`;
        currentLine = '';
    };

    while (index < buffer.length) {
        let b = buffer[index++];
        if (b === 0x1B) { // ESC
            let c = buffer[index++];
            if (c === 0x40) { align = 'left'; bold = false; }
            else if (c === 0x61) { let a = buffer[index++]; align = a === 1 ? 'center' : (a === 2 ? 'right' : 'left'); }
            else if (c === 0x45) { bold = buffer[index++] === 1; }
            else if (c === 0x64) { let lines = buffer[index++]; for(let i=0; i<lines; i++) flushLine(); }
        } else if (b === 0x1D) { // GS
            let c = buffer[index++];
            if (c === 0x76) { 
                let c2 = buffer[index++];
                if (c2 === 0x30) {
                    index++; // skip m
                    let xL = buffer[index++]; let xH = buffer[index++];
                    let yL = buffer[index++]; let yH = buffer[index++];
                    let wBytes = xL + (xH << 8); let hDots = yL + (yH << 8);
                    
                    let pixels = [];
                    for (let i=0; i < wBytes * hDots; i++) {
                        let byte = buffer[index++];
                        for (let bit=7; bit>=0; bit--) pixels.push((byte >> bit) & 1 ? '1' : '0');
                    }
                    html += `<div class="${align}"><canvas width="${wBytes*8}" height="${hDots}" data-bits="${pixels.join('')}"></canvas></div>\n`;
                }
            } else if (c === 0x56) {
                index += 2; // skip cut args
                html += `<div style="border-top: 2px dashed #bbb; margin: 30px 0 10px;"></div>\n`;
            }
        } else if (b === 0x0A) { flushLine(); } 
        else if (b >= 0x20) { currentLine += String.fromCharCode(b); }
    }
    if (currentLine) flushLine();
    
    html += `</div><script>
      document.querySelectorAll('canvas').forEach(canvas => {
         let ctx = canvas.getContext('2d');
         let bits = canvas.getAttribute('data-bits');
         let imgData = ctx.createImageData(canvas.width, canvas.height);
         for(let i=0; i<bits.length; i++) {
            let isBlack = bits[i] === '1';
            let c = isBlack ? 0 : 255;
            let idx = i * 4;
            imgData.data[idx] = c; imgData.data[idx+1] = c; imgData.data[idx+2] = c; imgData.data[idx+3] = ((isBlack) ? 255 : 0); // Transparent white
         }
         ctx.putImageData(imgData, 0, 0);
      });
    </script></body></html>`;
    return html;
}

app.post('/print', (req, res) => {
  const { payload } = req.body;
  
  if (!payload) {
    return res.status(400).send({ error: 'Missing base64 payload' });
  }

  try {
    const buffer = Buffer.from(payload, 'base64');
    
    // Virtual Mode Development Intercept
    if (process.env.PRINTER_MODE === 'virtual') {
      lastVirtualReceipt = parseESCPOS(buffer);
      console.log(`[VIRTUAL PRINTER] Rendered receipt cleanly (${buffer.length} bytes). Browse to /preview`);
      return res.status(200).send({
         success: true,
         message: 'PRINT SUCCESS — VIRTUAL PRINTER',
         jobId: `v-job-${Date.now()}`,
         bytes: buffer.length,
         previewUrl: 'http://127.0.0.1:28080/preview'
      });
    }

    // Safest cross-platform raw dump to default USB generic printer
    const isWindows = os.platform() === 'win32';
    
    if (isWindows) {
      // In Windows, a raw print usually goes via temp file + Print /D:
      const tempPath = `${os.tmpdir()}\\pos_receipt_${Date.now()}.bin`;
      fs.writeFileSync(tempPath, buffer);
      // Assumes default thermal is shared or mapped. Usually users map standard POS-58
      exec(`print /D:"\\\\localhost\\ThermalPrinter" "${tempPath}"`, (error) => {
        if (error) console.error("Windows print Error:", error);
        // Clean up
        fs.unlink(tempPath, () => {});
      });
    } else {
      // Linux/Mac - usually lp -o raw handles generic ESCPOS streams flawlessly
      const tempPath = `/tmp/pos_receipt_${Date.now()}.bin`;
      fs.writeFileSync(tempPath, buffer);
      exec(`lp -o raw ${tempPath}`, (error) => {
        if (error) console.error("Unix lp print Error:", error);
        fs.unlink(tempPath, () => {});
      });
    }

    res.status(200).send({ success: true, message: 'Print job dispatched to local spooler.' });
  } catch (error) {
    console.error('Print Error:', error);
    res.status(500).send({ error: 'Local print dispatcher failed.' });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'cafe-pos-usb-agent' });
});

app.get('/preview', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(lastVirtualReceipt);
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🔌 Cafe POS USB Print Agent running securely on port ${PORT}`);
  console.log(`Waiting for jobs...`);
});
