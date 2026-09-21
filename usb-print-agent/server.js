import express from 'express';
import cors from 'cors';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';

const app = express();
const PORT = 28080;

// FIX 7: Restrict CORS to known Vite dev-server origins only.
// A wildcard would allow any browser tab on this machine to trigger printing.
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
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

// FIX 4: Read optional explicit printer name from environment.
// Set PRINTER_NAME to the CUPS queue name (e.g. EZO-58) to avoid relying on the OS default printer.
// If unset, falls back to the OS default (existing behaviour).
const PRINTER_NAME = process.env.PRINTER_NAME || '';
if (PRINTER_NAME) {
  console.log(`[PRINTER AGENT] Explicit printer target: ${PRINTER_NAME}`);
} else {
  console.log('[PRINTER AGENT] No PRINTER_NAME set — using OS default printer.');
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

    const isWindows = os.platform() === 'win32';

    if (isWindows) {
      // Windows: 'print /D:' has no spawn-friendly equivalent; exec is acceptable here
      // because tempPath is built from Date.now() with no user input.
      // IMPORTANT: Set PRINTER_NAME to the exact Windows share name of the EZO printer.
      // The default fallback 'ThermalPrinter' must match the actual share name on this machine.
      // Example: net share to list shares; set PRINTER_NAME=EZO-TBT in environment.
      const printerTarget = PRINTER_NAME || 'ThermalPrinter';
      const tempPath = `${os.tmpdir()}\\pos_receipt_${Date.now()}.bin`;
      fs.writeFileSync(tempPath, buffer);
      exec(`print /D:"\\\\localhost\\${printerTarget}" "${tempPath}"`, (error) => {
        fs.unlink(tempPath, () => {});
        if (error) {
          console.error('[PRINTER AGENT] Windows print error:', error.message);
          return res.status(500).send({ error: 'OS print command failed.', detail: error.message });
        }
        res.status(200).send({ success: true, message: 'Print job completed.' });
      });
    } else {
      // Linux/Mac: use spawn with an explicit argument array — no shell interpolation,
      // no injection risk even if PRINTER_NAME contains unexpected characters.
      const printerFlag = PRINTER_NAME ? ['-d', PRINTER_NAME] : [];
      const tempPath = `/tmp/pos_receipt_${Date.now()}.bin`;
      fs.writeFileSync(tempPath, buffer);
      const lpArgs = [...printerFlag, '-o', 'raw', tempPath];
      const lp = spawn('lp', lpArgs, { stdio: 'pipe' });
      let stderrOutput = '';
      lp.stderr.on('data', (data) => { stderrOutput += data.toString(); });
      lp.on('close', (code) => {
        fs.unlink(tempPath, () => {});
        if (code !== 0) {
          console.error(`[PRINTER AGENT] lp exited with code ${code}: ${stderrOutput}`);
          return res.status(500).send({ error: 'OS print command failed.', detail: stderrOutput.trim() || `exit code ${code}` });
        }
        res.status(200).send({ success: true, message: 'Print job completed.' });
      });
      lp.on('error', (err) => {
        fs.unlink(tempPath, () => {});
        console.error('[PRINTER AGENT] spawn error:', err.message);
        if (!res.headersSent) res.status(500).send({ error: 'Failed to start lp.', detail: err.message });
      });
    }
  } catch (error) {
    console.error('[PRINTER AGENT] Unexpected error:', error);
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
