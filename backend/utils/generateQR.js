const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'qr_output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Generates a QR code for a packaging record and saves it as a PNG.
 * Call this the moment a Packaging record is complete — that's the
 * "packaging => qr code" step happening automatically, with no manual
 * QR generation step for staff to remember.
 *
 * @param {string} qrCode - the value stored on Packaging.qr_code, e.g. "QR-040-2026"
 * @returns {Promise<{ url: string, filePath: string }>}
 */
async function generateQRForBatch(qrCode) {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-site.netlify.app';
  // Encodes trace.html?qr=... directly rather than the shorter /t/QR_CODE
  // path. Netlify's /t/* -> /trace.html?qr=:splat rule rewrites content at
  // the edge but never touches the browser's actual address bar, so a phone
  // scanning /t/QR-001-2026 would land on trace.html with an empty
  // window.location.search and find no code. Baking the real query string
  // into the QR itself sidesteps that entirely.
  const url = `${FRONTEND_URL}/trace.html?qr=${encodeURIComponent(qrCode)}`;

  const fileName = `${qrCode}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await QRCode.toFile(filePath, url, {
    width: 600,
    margin: 3,
    color: { dark: '#16241C', light: '#FFFDF8' }
  });

  return { url, filePath: `/qr_output/${fileName}` };
}

module.exports = { generateQRForBatch };
