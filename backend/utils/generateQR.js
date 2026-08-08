const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'qr_output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/**
 * Generates a QR code for a batch and saves it as a PNG.
 * Call this the moment a packaging/batch record is created — that's the
 * "packaging => qr code" step happening automatically, with no manual
 * QR generation step for staff to remember.
 *
 * @param {string} batchId - e.g. "BATCH-2026-040"
 * @returns {Promise<{ url: string, filePath: string }>}
 */
async function generateQRForBatch(batchId) {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-site.netlify.app';
  // Uses the clean /b/BATCH_ID path (see netlify.toml redirect) rather than
  // /trace.html?batch=... — shorter, and the query-string form still works too.
  const url = `${FRONTEND_URL}/b/${encodeURIComponent(batchId)}`;

  const fileName = `${batchId}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  await QRCode.toFile(filePath, url, {
    width: 600,
    margin: 3,
    color: { dark: '#16241C', light: '#FFFDF8' }
  });

  return { url, filePath: `/qr_output/${fileName}` };
}

module.exports = { generateQRForBatch };
