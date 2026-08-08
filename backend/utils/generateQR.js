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
  // Uses the clean /t/QR_CODE path (see netlify.toml redirect) rather than
  // /trace.html?qr=... — shorter, and the query-string form still works too.
  const url = `${FRONTEND_URL}/t/${encodeURIComponent(qrCode)}`;

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
